// src/lib/auth/options.ts
import NextAuth, { type NextAuthOptions } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Kakao from "next-auth/providers/kakao";
import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcryptjs";
import { formatPhoneNumberToKorean } from "@/utils/phoneNumber";

// ---- helpers admin db ----
function getDbAdmin() {
  const url = process.env.SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  if (!url || !key) throw new Error("Missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY");
  return createClient(url, key, { auth: { persistSession: false } });
}
const isUuid = (s: unknown): s is string =>
  typeof s === "string" &&
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(s);

// ---- link OAuth account -> app user (auth_users/auth_accounts) ----
async function ensureUserForOAuth(params: {
  provider: string;
  providerAccountId: string;
  email?: string | null;
  name?: string | null;
  avatarUrl?: string | null;
}): Promise<string | null> {
  const db = getDbAdmin();
  const { provider, providerAccountId, email, name, avatarUrl } = params;

  const { data: acc } = await db
    .from("auth_accounts")
    .select("user_id")
    .eq("provider", provider)
    .eq("provider_account_id", providerAccountId)
    .maybeSingle();
  if (acc?.user_id) return acc.user_id;

  let userId: string | null = null;
  if (email) {
    const { data: u } = await db.from("auth_users").select("id").eq("email", email).maybeSingle();
    if (u?.id) userId = u.id;
  }
  if (!userId) {
    const { data: ins, error: insErr } = await db
      .from("auth_users")
      .insert({
        email: email ?? null,
        name: name ?? null,
        avatar_url: avatarUrl ?? null,
      })
      .select("id")
      .single();
    if (insErr) {
      console.error("[nextauth] create auth_users error:", insErr);
      return null;
    }
    userId = ins?.id ?? null;
  }
  if (userId) {
    const { error: linkErr } = await db
      .from("auth_accounts")
      .insert({ user_id: userId, provider, provider_account_id: String(providerAccountId) });
    if (linkErr && linkErr.code !== "23505") {
      console.warn("[nextauth] link account warning:", linkErr.message);
    }
  }
  return userId;
}

// ---- ensure profile + tenant/membership on first login ----
async function ensureProfileAndTenant(args: {
  userId: string;
  email?: string | null;
  name?: string | null;
  phone?: string | null;
}) {
  const db = getDbAdmin();
  const { userId, email, name, phone } = args;

  const profileRow: any = {
    id: userId,
    email: email ?? "",
    name: name ?? "User",
    updated_at: new Date().toISOString(),
  };
  if (phone) profileRow.phone_number = phone;

  const { error: pErr } = await db.from("profiles").upsert(profileRow);
  if (pErr) console.error("[nextauth] profiles upsert error:", pErr);

  const { data: m, error: mErr } = await db
    .from("tenant_members")
    .select("id")
    .eq("user_id", userId)
    .limit(1);
  if (mErr) {
    console.error("[nextauth] membership check error:", mErr);
    return;
  }
  if (m && m.length > 0) return;

  const base = name ?? (email ? email.split("@")[0] : "내");
  const workspaceName = `${base} 워크스페이스`;

  const { data: tenant, error: tErr } = await db
    .from("tenants")
    .insert({ name: workspaceName })
    .select("id")
    .single();
  if (tErr || !tenant?.id) {
    console.error("[nextauth] create tenant error:", tErr);
    return;
  }
  const { error: addErr } = await db.from("tenant_members").insert({
    tenant_id: tenant.id,
    user_id: userId,
    email: email ?? "",
    role: "OWNER",
  });
  if (addErr) console.error("[nextauth] add membership error:", addErr);
}

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  debug: true,
  // Ensure cookies are marked Secure in production and optionally set domain for custom domains
  useSecureCookies: process.env.NODE_ENV === "production",
  cookies: {
    sessionToken: {
      name:
        process.env.NODE_ENV === "production"
          ? "__Secure-next-auth.session-token"
          : "next-auth.session-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
        // If you use a custom domain or subdomains in production, set NEXTAUTH_COOKIE_DOMAIN (e.g. .example.com)
        domain: process.env.NEXTAUTH_COOKIE_DOMAIN || undefined,
      },
    },
  },
  logger: {
    error(code, meta) { console.error("[nextauth:error]", code, meta); },
    warn(code) { console.warn("[nextauth:warn]", code); },
    debug(code, meta) { console.log("[nextauth:debug]", code, meta); },
  },
  session: { strategy: "jwt" },
  pages: { signIn: "/login", error: "/login" },

  providers: [
    Credentials({
      name: "email-password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        try {
          if (!credentials?.email || !credentials?.password) return null;
          const db = getDbAdmin();
          const email = credentials.email.trim().toLowerCase();

          const { data: user, error } = await db
            .from("auth_users")
            .select("id, email, password_hash, name, avatar_url")
            .eq("email", email)
            .maybeSingle();
          if (error || !user?.password_hash) return null;

          const ok = await bcrypt.compare(credentials.password, user.password_hash);
          if (!ok) return null;

          return { id: String(user.id), email: user.email, name: user.name ?? null, image: user.avatar_url ?? null };
        } catch (e) {
          console.error("[auth] authorize exception", e);
          return null;
        }
      },
    }),

    Kakao({
      clientId: process.env.KAKAO_CLIENT_ID!,
      clientSecret: process.env.KAKAO_CLIENT_SECRET || "",
      authorization: { params: { scope: "profile_nickname profile_image account_email" } },
      allowDangerousEmailAccountLinking: true,
      profile(p: any) {
        const acct = p?.kakao_account ?? {};
        return {
          id: String(p.id),
          email: acct.email ?? null,
          name: acct.profile?.nickname ?? "Kakao User",
          image: acct.profile?.profile_image_url ?? null,
        };
      },
    }),
  ],

  callbacks: {
    async signIn() { return true; },

    async jwt({ token, user, account, profile }) {
      if ((token as any).uuid && isUuid((token as any).uuid)) return token;

      if (user?.id && isUuid(String(user.id))) {
        (token as any).uuid = String(user.id);
        return token;
      }

      if (account?.provider && account?.providerAccountId) {
        const uuid = await ensureUserForOAuth({
          provider: account.provider,
          providerAccountId: String(account.providerAccountId),
          email: user?.email ?? (profile as any)?.email ?? null,
          name: user?.name ?? (profile as any)?.name ?? null,
          avatarUrl: user?.image ?? (profile as any)?.picture ?? null,
        });
        if (uuid) (token as any).uuid = uuid;
      }
      return token;
    },

    async session({ session, token }) {
      if (session.user && (token as any)?.uuid) {
        (session.user as any).id = (token as any).uuid;
        (session.user as any).uuid = (token as any).uuid;
      }
      return session;
    },
  },

  events: {
    async signIn({ user, account, profile }) {
      try {
        let userId: string | null = null;

        if (account?.provider && account?.providerAccountId) {
          userId = await ensureUserForOAuth({
            provider: account.provider,
            providerAccountId: String(account.providerAccountId),
            email: user?.email ?? (profile as any)?.email ?? null,
            name: user?.name ?? (profile as any)?.name ?? null,
            avatarUrl: user?.image ?? (profile as any)?.picture ?? null,
          });
        } else if (user?.id && isUuid(String(user.id))) {
          userId = String(user.id);
        }
        if (!userId) return;

        let phone: string | null = null;
        if (account?.provider === "kakao" && (account as any)?.access_token) {
          try {
            const res = await fetch("https://kapi.kakao.com/v2/user/me", {
              headers: { Authorization: `Bearer ${(account as any).access_token}` },
            });
            if (res.ok) {
              const data = await res.json();
              const raw = data?.kakao_account?.phone_number as string | undefined;
              if (raw) phone = formatPhoneNumberToKorean(raw);
            }
          } catch (e) {
            console.warn("[nextauth] kakao phone fetch failed:", (e as Error)?.message);
          }
        }

        await ensureProfileAndTenant({
          userId,
          email: user?.email ?? (profile as any)?.email ?? null,
          name: user?.name ?? (profile as any)?.name ?? null,
          phone,
        });
      } catch (e) {
        console.error("[nextauth] events.signIn error:", e);
      }
    },
  },
};

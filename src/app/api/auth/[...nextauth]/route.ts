export const runtime = "nodejs";

import NextAuth, { type NextAuthOptions } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Kakao from "next-auth/providers/kakao";
import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcryptjs";
import { formatPhoneNumberToKorean } from "@/utils/phoneNumber";

function getDbAdmin() {
  const url = process.env.SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  if (!url || !key) throw new Error("Missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY");
  return createClient(url, key, { auth: { persistSession: false } });
}

const isUuid = (s: unknown): s is string =>
  typeof s === "string" &&
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(s);

async function findAuthUserIdByEmail(db: ReturnType<typeof getDbAdmin>, email: string) {
  let page = 1;
  for (;;) {
    // @ts-expect-error: admin
    const { data, error } = await (db as any).auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw error;
    const found = (data.users ?? []).find(
      (u: any) => u.email?.toLowerCase() === email.toLowerCase()
    );
    if (found) return found.id as string;
    if ((data.users?.length ?? 0) < 1000) break;
    page++;
  }
  return null;
}

async function ensureUserForOAuth(params: {
  provider: string;
  providerAccountId: string;
  email?: string | null;
  name?: string | null;
  avatarUrl?: string | null;
}): Promise<string | null> {
  const db = getDbAdmin();
  const { provider, providerAccountId, email, name, avatarUrl } = params;
  if (!email) {
    console.error("[oauth] missing email");
    return null;
  }

  // 1) ensure auth.users
  let authId = await findAuthUserIdByEmail(db, email);
  if (!authId) {
    const { data, error } = await db.auth.admin.createUser({
      email,
      email_confirm: true,
      user_metadata: { name, avatar_url: avatarUrl ?? null },
    });
    if (error) {
      console.error("[createUser]", error.message);
      return null;
    }
    authId = data.user?.id ?? null;
  }
  if (!authId) return null;

  // 2) upsert public.auth_users with id = authId (FK to auth.users)
  {
    const { error } = await db
      .from("auth_users")
      .upsert({ id: authId, email, name, avatar_url: avatarUrl ?? null }, { onConflict: "id" });
    if (error) {
      console.error("[upsert auth_users]", error.message);
      return null;
    }
  }

  // 3) link auth_accounts (idempotent)
  {
    const { error } = await db
      .from("auth_accounts")
      .upsert(
        { user_id: authId, provider, provider_account_id: String(providerAccountId) },
        { onConflict: "provider,provider_account_id" }
      );
    if (error && (error as any).code !== "23505") {
      console.warn("[link account]", error.message);
    }
  }

  return authId;
}

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
    user_id: args.userId,
    email: email ?? "",
    role: "OWNER",
  });
  if (addErr) console.error("[nextauth] add membership error:", addErr);
}

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  debug: true,
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

          return {
            id: String(user.id),
            email: user.email,
            name: user.name ?? null,
            image: user.avatar_url ?? null,
          };
        } catch (e) {
          console.error("[auth] authorize exception", e);
          return null;
        }
      },
    }),

    Kakao({
      clientId: process.env.KAKAO_CLIENT_ID!,
      clientSecret: process.env.KAKAO_CLIENT_SECRET || "",
      authorization: {
        params: {
          scope: "profile_nickname profile_image account_email name phone_number",
        },
      },
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

      if (account?.provider && account?.providerAccountId) {
        const uuid = await ensureUserForOAuth({
          provider: account.provider,
          providerAccountId: String(account.providerAccountId),
          email: user?.email ?? (profile as any)?.email ?? null,
          name: user?.name ?? (profile as any)?.name ?? null,
          avatarUrl: user?.image ?? (profile as any)?.picture ?? null,
        });
        if (uuid) (token as any).uuid = uuid;
        return token;
      }

      if (user?.id && isUuid(String(user.id))) {
        (token as any).uuid = String(user.id);
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
          } catch {}
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

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };

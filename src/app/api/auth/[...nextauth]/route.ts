export const runtime = "nodejs";

import NextAuth, { type NextAuthOptions } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Kakao from "next-auth/providers/kakao";
import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcryptjs";

function getDbAdmin() {
  const url = process.env.SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  if (!url || !key) throw new Error("Missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY");
  return createClient(url, key, { auth: { persistSession: false } });
}

const isUuid = (s: unknown): s is string =>
  typeof s === "string" &&
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(s);

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

const authOptions: NextAuthOptions = {
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
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };

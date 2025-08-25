import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { createClient } from "@supabase/supabase-js";

type Role = "OWNER" | "ADMIN" | "USER";
export type Member = { id: number; tenant_id: string; role: Role };

function getAdmin() {
  const url = process.env.SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(url, key, { auth: { persistSession: false } });
}

export async function getCurrentUser() {
  const session = await getServerSession(authOptions);
  const u = session?.user as any;
  if (!u?.id) return null;
  return { id: String(u.id), email: u.email ?? null, name: u.name ?? null };
}

export async function getCurrentMembership(): Promise<Member | null> {
  const db = getAdmin();
  const user = await getCurrentUser();
  if (!user) return null;

  const { data, error } = await db
    .from("tenant_members")
    .select("id, tenant_id, role")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true })
    .limit(1);

  if (error) {
    console.error("[auth] getCurrentMembership error:", error);
    return null;
  }
  return (data?.[0] as Member) ?? null;
}

/** Create tenant + OWNER membership with Service Role if absent (bypass RLS) */
export async function ensureMembershipOrBootstrap(): Promise<Member> {
  const db = getAdmin();
  const user = await getCurrentUser();
  if (!user) throw new Error("UNAUTHENTICATED");

  const existing = await getCurrentMembership();
  if (existing) return existing;

  const workspaceName = `${user.name ?? (user.email?.split("@")[0] ?? "내")} 워크스페이스`;

  const { data: tenant, error: tErr } = await db
    .from("tenants")
    .insert({ name: workspaceName })
    .select("id")
    .single();
  if (tErr || !tenant?.id) {
    console.error("[auth] tenant create error:", tErr);
    throw Object.assign(new Error("TENANT_CREATE_FAILED"), { code: "TENANT_CREATE_FAILED" });
  }

  const { data: m, error: addErr } = await db
    .from("tenant_members")
    .insert({
      tenant_id: tenant.id,
      user_id: user.id,
      email: user.email ?? "",
      role: "OWNER",
    })
    .select("id, tenant_id, role")
    .single();
  if (addErr || !m) {
    console.error("[auth] add membership error:", addErr);
    throw Object.assign(new Error("MEMBERSHIP_CREATE_FAILED"), { code: "MEMBERSHIP_CREATE_FAILED" });
  }

  return m as Member;
}

export async function requireAdminOrOwner() {
  const member = await getCurrentMembership();
  if (!member || !["OWNER", "ADMIN"].includes(member.role)) {
    throw new Error("Forbidden");
  }
  return member;
}

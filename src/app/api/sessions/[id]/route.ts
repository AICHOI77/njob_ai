import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createClient } from "@supabase/supabase-js";

function admin() {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const session = await getServerSession(authOptions);
    const user = session?.user as any;
    if (!user?.id) return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });

    const db = admin();

    const { data: row, error } = await db
      .from("saju_sessions")
      .select("id, tenant_id, created_at, status, input_json, output_json")
      .eq("id", id)
      .maybeSingle();
    if (error) throw error;
    if (!row) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });

    const { data: mem, error: mErr } = await db
      .from("tenant_members")
      .select("id")
      .eq("tenant_id", row.tenant_id)
      .eq("user_id", user.id)
      .maybeSingle();
    if (mErr) throw mErr;
    if (!mem) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });

    return NextResponse.json(row);
  } catch (e) {
    console.error("[/api/sessions/:id] error:", e);
    return NextResponse.json({ error: "SERVER_ERROR" }, { status: 500 });
  }
}

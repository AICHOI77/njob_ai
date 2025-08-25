import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { createClient } from "@supabase/supabase-js";

// Admin client (bypass RLS)
function getAdmin() {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const user = session?.user as any;
    if (!user?.id) return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });

    const url = new URL(req.url);
    const page = Number(url.searchParams.get("page") ?? 1);
    const pageSize = Number(url.searchParams.get("pageSize") ?? 10);
    const status = url.searchParams.get("status") ?? undefined;
    const from = url.searchParams.get("from") ?? undefined;
    const to   = url.searchParams.get("to")   ?? undefined;

    const db = getAdmin();

    // 1) Get all tenants where the user is a member
    const { data: memberships, error: mErr } = await db
      .from("tenant_members")
      .select("tenant_id, role")
      .eq("user_id", user.id);
    if (mErr) throw mErr;

    const tenantIds = (memberships ?? []).map(m => m.tenant_id);
    if (tenantIds.length === 0) {
      return NextResponse.json({
        data: [],
        page, pageSize, totalCount: 0,
        kpi: { todaySessions: 0, totalSessions: 0, completed: 0, processing: 0 }
      });
    }

    // 2) List paginated sessions on these tenants
    let listQ = db
      .from("saju_sessions")
      .select("id, created_at, status, input_json, output_json")
      .in("tenant_id", tenantIds);

    if (status) listQ = listQ.eq("status", status);
    if (from)   listQ = listQ.gte("created_at", from);
    if (to)     listQ = listQ.lte("created_at", to);

    listQ = listQ.order("created_at", { ascending: false });

    const fromIdx = (page - 1) * pageSize;
    const toIdx   = fromIdx + pageSize - 1;

    const [{ data: rows, error: rowsErr }, { count: totalCount, error: cntErr }] = await Promise.all([
      listQ.range(fromIdx, toIdx),
      db.from("saju_sessions").select("id", { count: "exact", head: true }).in("tenant_id", tenantIds),
    ]);
    if (rowsErr || cntErr) {
      return NextResponse.json({ error: rowsErr?.message || cntErr?.message }, { status: 500 });
    }

    // 3) KPI on all tenants
    const todayStart = new Date(); todayStart.setHours(0,0,0,0);
    const todayIso = todayStart.toISOString();

    const [
      { count: todayCount,      error: tErr },
      { count: totalAllCount,   error: taErr },
      { count: doneCount,       error: dErr },
      { count: processingCount, error: pErr },
    ] = await Promise.all([
      db.from("saju_sessions").select("id", { count: "exact", head: true }).in("tenant_id", tenantIds).gte("created_at", todayIso),
      db.from("saju_sessions").select("id", { count: "exact", head: true }).in("tenant_id", tenantIds),
      db.from("saju_sessions").select("id", { count: "exact", head: true }).in("tenant_id", tenantIds).eq("status", "done"),
      db.from("saju_sessions").select("id", { count: "exact", head: true }).in("tenant_id", tenantIds).eq("status", "processing"),
    ]);
    if (tErr || taErr || dErr || pErr) {
      console.warn("[/api/sessions] KPI warn:", tErr || taErr || dErr || pErr);
    }

    return NextResponse.json({
      data: rows ?? [],
      page,
      pageSize,
      totalCount: totalCount ?? 0,
      kpi: {
        todaySessions: todayCount ?? 0,
        totalSessions: totalAllCount ?? 0,
        completed:     doneCount ?? 0,
        processing:    processingCount ?? 0,
      },
    });
  } catch (e: any) {
    console.error("[/api/sessions] error:", e);
    return NextResponse.json({ error: "SERVER_ERROR" }, { status: 500 });
  }
}

export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const toNumber = (v: unknown): number => {
  if (typeof v === "number") return v;
  if (typeof v === "string") {
    const digits = v.replace(/[^\d]/g, "");
    return digits ? parseInt(digits, 10) : 0;
  }
  return 0;
};

function json(messageOrBody: any, status = 200) {
  const body =
    typeof messageOrBody === "string"
      ? { ok: false, message: messageOrBody }
      : messageOrBody;
  return NextResponse.json(body, {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

const genOrderId = (lectureId: number) =>
  `ORD-${lectureId}-${Date.now().toString(36)}-${crypto
    .randomUUID()
    .slice(0, 6)}`;

export async function POST(req: Request) {
  try {
    // --- ENV ----------------------------------------------------------------
    const SUPABASE_URL =
      process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const ORDERS_TENANT_ID = process.env.ORDERS_TENANT_ID;

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      return json(
        {
          ok: false,
          code: "CONFIG_MISSING",
          message:
            "SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY manquants côté serveur",
        },
        500
      );
    }
    if (!ORDERS_TENANT_ID) {
      return json(
        {
          ok: false,
          code: "TENANT_MISSING",
          message: "ORDERS_TENANT_ID manquant",
        },
        500
      );
    }

    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false },
    });

    // --- SESSION / USER -----------------------------------------------------
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return json({ ok: false, message: "로그인이 필요합니다" }, 401);
    }
    const { data: profile, error: profileErr } = await admin
      .from("profiles")
      .select("id, tenant_id, email")
      .eq("email", session.user.email)
      .maybeSingle();

    if (profileErr) {
      return json(
        { ok: false, message: `DB error (profiles): ${profileErr.message}` },
        500
      );
    }
    if (!profile?.id) {
      return json(
        { ok: false, message: "사용자 프로필을 찾을 수 없습니다" },
        401
      );
    }

    const userId: string = String(profile.id);
    const tenantId: string =
      String(profile.tenant_id ?? ORDERS_TENANT_ID) || ORDERS_TENANT_ID;

    // --- PAYLOAD ------------------------------------------------------------
    let payload: any = {};
    try {
      payload = await req.json();
    } catch {
      payload = {};
    }

    const lectureId = Number(payload?.lectureId ?? payload?.id);
    const clientAmount = Number(payload?.amount ?? 0);

    if (!Number.isFinite(lectureId) || lectureId <= 0) {
      return json({ ok: false, message: "lectureId est requis" }, 400);
    }

    // --- LECTURE & MONTANT --------------------------------------------------
    const { data: lecture, error: lecErr } = await admin
      .from("lectures")
      .select("id, title, price")
      .eq("id", lectureId)
      .maybeSingle();

    if (lecErr) {
      return json(
        { ok: false, message: `DB error (lectures): ${lecErr.message}` },
        500
      );
    }
    if (!lecture) return json({ ok: false, message: "Lecture introuvable" }, 404);

    const dbAmount = toNumber(lecture.price);
    const finalAmount =
      Number.isFinite(clientAmount) && clientAmount > 0
        ? clientAmount
        : dbAmount;
    const isFree = finalAmount <= 0;

    // --- INSERT ORDER -------------------------------------------------------
    const orderId = genOrderId(lectureId);

    const { data: orderRow, error: insErr } = await admin
      .from("orders")
      .insert({
        order_id: orderId,
        tenant_id: tenantId,
        user_id: userId,
        currency: "KRW",
        amount_expected: Math.max(0, finalAmount),
        status: isFree ? "paid" : "pending",
        paid_at: isFree ? new Date().toISOString() : null,
        lecture_id: lectureId,
      })
      .select("id, order_id, amount_expected, status")
      .single();

    if (insErr || !orderRow) {
      return json(
        { ok: false, message: `주문 생성 실패: ${insErr?.message || "unknown"}` },
        400
      );
    }

    // --- RÉPONSES -----------------------------------------------------------
    if (isFree) {
      return json({
        ok: true,
        free: true,
        id: orderRow.id,
        orderId: orderRow.order_id,
        amount: 0,
        title: lecture.title,
        redirect: `/payment/success?orderId=${encodeURIComponent(
          orderRow.order_id
        )}&amount=0`,
      });
    }

    return json({
      ok: true,
      id: orderRow.id,
      orderId: orderRow.order_id,
      amount: orderRow.amount_expected,
      status: orderRow.status,
      title: lecture.title,
    });
  } catch (e: any) {
    return json({ ok: false, message: e?.message || "server error" }, 500);
  }
}

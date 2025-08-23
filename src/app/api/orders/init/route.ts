export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const toNumber = (v: unknown): number => {
  if (typeof v === "number") return v;
  if (typeof v === "string") {
    const digits = v.replace(/[^\d]/g, "");
    return digits ? parseInt(digits, 10) : 0;
  }
  return 0;
};

const isUuid = (s: unknown): s is string =>
  typeof s === "string" &&
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(s);

function json(messageOrBody: any, status = 200) {
  const body = typeof messageOrBody === "string" ? { ok: false, message: messageOrBody } : messageOrBody;
  return NextResponse.json(body, { status, headers: { "Content-Type": "application/json" } });
}

export async function POST(req: Request) {
  try {
    const SUPABASE_URL = process.env.SUPABASE_URL;
    const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const ORDERS_TENANT_ID = process.env.ORDERS_TENANT_ID;

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      return json(
        { ok: false, code: "CONFIG_MISSING", message: "SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY manquants" },
        500
      );
    }
    if (!ORDERS_TENANT_ID) {
      return json({ ok: false, code: "TENANT_MISSING", message: "ORDERS_TENANT_ID manquant" }, 500);
    }

    const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

    let payload: any = {};
    try { payload = await req.json(); } catch { payload = {}; }

    const lectureId = Number(payload?.lectureId ?? payload?.id);
    const userId: string | null = payload?.userId ?? null;
    const clientAmount = Number(payload?.amount ?? 0);

    if (!Number.isFinite(lectureId) || lectureId <= 0) {
      return json({ ok: false, message: "lectureId est requis" }, 400);
    }
    if (!userId || !isUuid(userId)) {
      return json({ ok: false, code: "INVALID_USER_ID", message: "userId는 UUID 형식이어야 합니다." }, 400);
    }

    const { data: lecture, error: lecErr } = await db
      .from("lectures")
      .select("id, title, price")
      .eq("id", lectureId)
      .maybeSingle();

    if (lecErr) return json({ ok: false, message: `DB error: ${lecErr.message}` }, 500);
    if (!lecture) return json({ ok: false, message: "Lecture introuvable" }, 404);

    const dbAmount = toNumber(lecture.price);
    const finalAmount = Number.isFinite(clientAmount) && clientAmount > 0 ? clientAmount : dbAmount;
    const isFree = finalAmount <= 0;

    const orderId = `ord-${lectureId}-${Date.now().toString(36)}`;
    const insertPayload: any = {
      order_id: orderId,
      tenant_id: ORDERS_TENANT_ID,
      user_id: userId,
      currency: "KRW",
      amount_expected: Math.max(0, finalAmount),
      status: isFree ? "paid" : "pending",
      paid_at: isFree ? new Date().toISOString() : null,
      lecture_id: lectureId,
    };

    const { error: insErr } = await db.from("orders").insert(insertPayload);
    if (insErr) {
      return json({ ok: false, message: `주문 생성 실패: ${insErr.message}` }, 400);
    }

    if (isFree) {
      return json({
        ok: true,
        orderId,
        free: true,
        redirect: `/payment/success?orderId=${encodeURIComponent(orderId)}&amount=0`,
      });
    }

    return json({ ok: true, orderId, amount: finalAmount, title: lecture.title });
  } catch (e: any) {
    return json({ ok: false, message: e?.message || "server error" }, 500);
  }
}

// src/app/api/payments/toss/confirm/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function bad(message: string, status = 400) {
  return NextResponse.json({ message }, { status });
}

export async function POST(req: Request) {
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const TOSS_SECRET_KEY = process.env.TOSS_SECRET_KEY;

  console.log("[toss/confirm] env", {
    hasUrl: !!SUPABASE_URL,
    hasServiceRole: !!SUPABASE_SERVICE_ROLE_KEY,
    hasSecret: !!TOSS_SECRET_KEY,
  });

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return bad("Server Supabase env missing (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY).", 500);
  }
  if (!TOSS_SECRET_KEY) {
    return bad("TOSS_SECRET_KEY is missing.", 500);
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });

  try {
    const { paymentKey, orderId, amount } = (await req.json().catch(() => ({}))) as {
      paymentKey?: string;
      orderId?: string;
      amount?: number;
    };

    console.log("[toss/confirm] incoming", { paymentKey: !!paymentKey, orderId, amount });

    if (!paymentKey || !orderId || typeof amount !== "number") {
      return bad("필수 파라미터가 누락되었습니다: paymentKey, orderId, amount");
    }

    // 1) Find order and validate amount/status
    const { data: order, error: orderErr } = await supabase
      .from("orders")
      .select("id, order_id, amount_expected, status, tenant_id, user_id")
      .eq("order_id", orderId)
      .single();

    console.log("[toss/confirm] order lookup", {
      error: orderErr?.message,
      found: !!order,
      id: order?.id,
      status: order?.status,
      amount_expected: order?.amount_expected,
    });

    if (orderErr || !order) return bad("주문을 찾을 수 없습니다");

    if (order.status !== "pending") {
      if (order.status === "paid") {
        return NextResponse.json({ ok: true, alreadyConfirmed: true });
      }
      return bad(`유효하지 않은 주문 상태: ${order.status}`);
    }

    if (Number(order.amount_expected) !== Number(amount)) {
      return bad("주문 금액이 일치하지 않습니다");
    }

    // 2) Confirm with Toss
    console.log("[toss/confirm] calling Toss API /payments/confirm");
    const auth = Buffer.from(`${TOSS_SECRET_KEY}:`).toString("base64");
    const confirmRes = await fetch("https://api.tosspayments.com/v1/payments/confirm", {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/json",
        "Idempotency-Key": crypto.randomUUID(),
      },
      body: JSON.stringify({ paymentKey, orderId, amount }),
      cache: "no-store",
    });

    const confirmData = await confirmRes.json().catch(() => ({}));
    console.log("[toss/confirm] toss response", {
      status: confirmRes.status,
      ok: confirmRes.ok,
      code: confirmData?.code,
      message: confirmData?.message,
    });

    if (!confirmRes.ok) {
      await supabase.from("payments").insert({
        provider: "toss",
        order_id: order.id,
        payment_key: paymentKey,
        status: "failed",
        raw_json: confirmData,
      });
      return NextResponse.json(confirmData, { status: confirmRes.status });
    }

    // 3) Record payment + mark order paid
    const approvedAt = confirmData?.approvedAt ?? new Date().toISOString();

    const { error: payErr } = await supabase.from("payments").insert({
      provider: "toss",
      order_id: order.id,
      payment_key: paymentKey,
      status: "paid",
      approved_at: approvedAt,
      raw_json: confirmData,
    });
    if (payErr) return bad("결제 기록 저장에 실패했습니다", 500);

    const { error: updErr } = await supabase
      .from("orders")
      .update({ status: "paid", paid_at: approvedAt })
      .eq("id", order.id);
    if (updErr) return bad("주문 업데이트에 실패했습니다", 500);

    return NextResponse.json({ ok: true, payment: confirmData });
  } catch (e: any) {
    console.error("[toss/confirm] exception", e);
    return bad(e?.message || "서버 오류", 500);
  }
}

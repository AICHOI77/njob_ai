
export const runtime = "nodejs"; // Node 런타임 보장 (Buffer 등 사용)

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const TOSS_SECRET_KEY = process.env.TOSS_SECRET_KEY!; // test_sk_... 또는 live_sk_...

console.log("Supabase_url:  ", SUPABASE_URL);
console.log("SUPABASE_SERVICE_ROLE_KEY:  ", SUPABASE_SERVICE_ROLE_KEY);
console.log("TOSS_SECRET_KEY:  ", TOSS_SECRET_KEY);

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

function badRequest(message: string, status = 400) {
  return NextResponse.json({ message }, { status });
}

export async function POST(req: Request) {
  try {
    const { paymentKey, orderId, amount } = (await req.json()) as {
      paymentKey?: string;
      orderId?: string;
      amount?: number;
    };

    if (!paymentKey || !orderId || typeof amount !== "number") {
      return badRequest("필수 파라미터가 누락되었습니다: paymentKey, orderId, amount");
    }

    // 1) 주문 조회 및 금액 검증
    const { data: order, error: orderErr } = await supabase
      .from("orders")
      .select("id, order_id, amount_expected, status, tenant_id, user_id")
      .eq("order_id", orderId)
      .single();

    if (orderErr || !order) {
      return badRequest("주문을 찾을 수 없습니다");
    }

    if (order.status !== "pending") {
      if (order.status === "paid") {
        // 멱등성 보장: 이미 결제 완료 상태면 OK 반환
        return NextResponse.json({ ok: true, alreadyConfirmed: true });
      }
      return badRequest(`유효하지 않은 주문 상태: ${order.status}`);
    }

    if (Number(order.amount_expected) !== Number(amount)) {
      return badRequest("주문 금액이 일치하지 않습니다");
    }

    // 2) TossPayments 결제 확인 호출
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

    const confirmData = await confirmRes.json();
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

    // 3) 결제 성공 처리: payments 기록 + 주문 상태 업데이트
    const approvedAt = confirmData?.approvedAt ?? new Date().toISOString();

    const { error: payErr } = await supabase.from("payments").insert({
      provider: "toss",
      order_id: order.id,
      payment_key: paymentKey,
      status: "paid",
      approved_at: approvedAt,
      raw_json: confirmData,
    });
    if (payErr) {
      return badRequest("결제 기록 저장에 실패했습니다");
    }

    const { error: updErr } = await supabase
      .from("orders")
      .update({ status: "paid", paid_at: approvedAt })
      .eq("id", order.id);
    if (updErr) {
      return badRequest("주문 업데이트에 실패했습니다");
    }

    // 4) 강의 접근 권한 생성 (6개월)
    const { data: items, error: itemsErr } = await supabase
      .from("order_items")
      .select("course_id")
      .eq("order_id", order.id);

    if (!itemsErr && items && items.length > 0) {
      const start = new Date();
      const end = new Date();
      end.setMonth(end.getMonth() + 6);

      const accessRows = items.map((it: any) => ({
        user_id: order.user_id,
        course_id: it.course_id,
        tenant_id: order.tenant_id,
        start_at: start.toISOString(),
        end_at: end.toISOString(),
      }));

      await supabase.from("course_access").insert(accessRows);
    }

    return NextResponse.json({ ok: true, payment: confirmData });
  } catch (e: any) {
    return NextResponse.json({ message: e?.message || "서버 오류" }, { status: 500 });
  }
}
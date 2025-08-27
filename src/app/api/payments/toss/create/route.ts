export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const TOSS_SECRET_KEY = process.env.TOSS_SECRET_KEY!;
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY;

function bad(message: string, status = 400) {
  return NextResponse.json({ message }, { status });
}

const isUuid = (s: unknown): s is string =>
  typeof s === "string" &&
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(s);

export async function POST(req: Request) {
  try {
    if (!SUPABASE_URL || !SERVICE_ROLE) return bad("SUPABASE SERVICE ROLE 설정이 필요합니다", 500);
    if (!TOSS_SECRET_KEY) return bad("TOSS_SECRET_KEY가 설정되어 있지 않습니다", 500);

    const { orderId } = (await req.json().catch(() => ({}))) as { orderId?: string };
    if (!orderId) return bad("orderId는 필수입니다");

    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE, { auth: { persistSession: false } });

    let { data: order, error } = await supabase
      .from("orders")
      .select("id, order_id, amount_expected, status")
      .eq("order_id", orderId)
      .maybeSingle();

    if ((!order || error) && isUuid(orderId)) {
      const alt = await supabase
        .from("orders")
        .select("id, order_id, amount_expected, status")
        .eq("id", orderId)
        .maybeSingle();
      order = alt.data ?? null;
      error = alt.error ?? null;
    }

    if (error) {
      console.error("[create] Supabase error:", error.message);
      return bad("주문을 찾을 수 없습니다", 400);
    }
    if (!order) return bad("주문을 찾을 수 없습니다", 400);
    if (order.status !== "pending") return bad(`유효하지 않은 주문 상태: ${order.status}`);

    const amount =
      typeof order.amount_expected === "number"
        ? order.amount_expected
        : Number(order.amount_expected);

    const auth = Buffer.from(`${TOSS_SECRET_KEY}:`).toString("base64");
    const payload = {
      method: "CARD",
      amount,
      orderId: order.order_id,
      orderName: "강의 결제",
      successUrl: process.env.SUCCESS_URL,
      failUrl: process.env.FAIL_URL,
    };

    if (!payload.successUrl || !payload.failUrl) {
      return bad("SUCCESS_URL / FAIL_URL 환경변수가 필요합니다", 500);
    }

    const res = await fetch("https://api.tosspayments.com/v1/payments", {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/json",
        "Idempotency-Key": crypto.randomUUID(),
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      console.error("[create] Toss error", res.status, data);
      return NextResponse.json({ step: "create", status: res.status, error: data }, { status: res.status });
    }

    const checkoutUrl = data?.checkout?.url ?? null;
    if (!checkoutUrl) return bad("결제창 URL을 가져오지 못했습니다", 500);

    return NextResponse.json({ checkoutUrl });
  } catch (e: any) {
    console.error("[/payments/toss/create] error", e);
    return NextResponse.json({ message: e?.message || "서버 오류" }, { status: 500 });
  }
}

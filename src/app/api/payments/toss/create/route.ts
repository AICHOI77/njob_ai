export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const TOSS_SECRET_KEY = process.env.TOSS_SECRET_KEY!;
const APP_BASE_URL = process.env.APP_BASE_URL;
const SUCCESS_URL =
  process.env.SUCCESS_URL || (APP_BASE_URL ? `${APP_BASE_URL}/payment/success` : undefined);
const FAIL_URL =
  process.env.FAIL_URL || (APP_BASE_URL ? `${APP_BASE_URL}/payment/fail` : undefined);

function badRequest(message: string, status = 400) {
  return NextResponse.json({ message }, { status });
}

// ⚠️ Client Supabase avec ANON KEY (RLS actif)
function getSupabaseAnon() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    console.error("[create] ENV snapshot", { hasUrl: !!url, hasKey: !!key });
    throw new Error(
      "Supabase 환경변수가 설정되어 있지 않습니다 (NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY)"
    );
  }
  return createClient(url, key, { auth: { persistSession: false } });
}

export async function POST(req: Request) {
  try {
    // log temporaire
    console.log(
      "[create] NEXT_PUBLIC_SUPABASE_URL?", !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      "NEXT_PUBLIC_SUPABASE_ANON_KEY?", !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );

    const { orderId } = (await req.json()) as { orderId?: string };
    if (!orderId) return badRequest("orderId는 필수입니다");

    // 1) 주문 조회 및 유효성 검증 (RLS doit autoriser SELECT)
    const supabase = getSupabaseAnon();
    const { data: order, error } = await supabase
      .from("orders")
      .select("order_id, amount_expected, status")
      .eq("order_id", orderId)
      .single();

    if (error) {
      console.error("[create] Supabase error:", error);
      return NextResponse.json(
        { message: "주문을 찾을 수 없습니다", supabaseError: error.message },
        { status: 400 }
      );
    }
    if (!order) return badRequest("주문을 찾을 수 없습니다");
    if (order.status !== "pending") {
      return badRequest(`유효하지 않은 주문 상태: ${order.status}`);
    }

    if (!SUCCESS_URL || !FAIL_URL) {
      return badRequest("SUCCESS_URL / FAIL_URL 환경변수를 설정해 주세요");
    }
    if (!TOSS_SECRET_KEY) {
      return badRequest("TOSS_SECRET_KEY가 설정되어 있지 않습니다", 500);
    }

    const amount =
      typeof order.amount_expected === "number"
        ? order.amount_expected
        : Number(order.amount_expected);

    // 2) TossPayments 결제 창 생성
    const auth = Buffer.from(`${TOSS_SECRET_KEY}:`).toString("base64");
    const payload = {
      method: "CARD",
      amount,
      orderId: order.order_id,
      orderName: "강의 결제",
      successUrl: SUCCESS_URL,
      failUrl: FAIL_URL,
    };

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
      return NextResponse.json(
        { step: "create", status: res.status, error: data },
        { status: res.status }
      );
    }

    const checkoutUrl = data?.checkout?.url ?? null;
    if (!checkoutUrl) return badRequest("결제창 URL을 가져오지 못했습니다");

    return NextResponse.json({ checkoutUrl });
  } catch (e: any) {
    console.error("[create] unexpected error", e);
    return NextResponse.json({ message: e?.message || "서버 오류" }, { status: 500 });
  }
}

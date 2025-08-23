export const runtime = "nodejs";

import { NextResponse } from "next/server";

const TOSS_SECRET_KEY = process.env.TOSS_SECRET_KEY!;
const APP_BASE_URL = process.env.APP_BASE_URL;
const SUCCESS_URL = process.env.SUCCESS_URL || (APP_BASE_URL ? `${APP_BASE_URL}/payment/success` : undefined);
const FAIL_URL = process.env.FAIL_URL || (APP_BASE_URL ? `${APP_BASE_URL}/payment/fail` : undefined);

function badRequest(message: string, status = 400) {
  return NextResponse.json({ message }, { status });
}

export async function POST() {
  try {
    if (!TOSS_SECRET_KEY) return badRequest("TOSS_SECRET_KEY가 설정되어 있지 않습니다");
    if (!SUCCESS_URL || !FAIL_URL) return badRequest("SUCCESS_URL/FAIL_URL 환경변수를 설정해 주세요");

    const payload = {
      method: "CARD",
      amount: 55000,
      orderId: "demo-ORDER-0001",
      orderName: "강의 결제 (스모크 테스트)",
      successUrl: SUCCESS_URL,
      failUrl: FAIL_URL,
    };

    const auth = Buffer.from(`${TOSS_SECRET_KEY}:`).toString("base64");

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
      return NextResponse.json({ step: "create-direct", status: res.status, error: data }, { status: res.status });
    }

    const checkoutUrl = data?.checkout?.url || null;
    if (!checkoutUrl) return badRequest("결제창 URL을 가져오지 못했습니다");

    return NextResponse.json({ checkoutUrl, data });
  } catch (e: any) {
    console.error("[toss/create-direct] error", e);
    return NextResponse.json({ message: e?.message || "서버 오류" }, { status: 500 });
  }
}

"use client";

import { useState } from "react";

export default function CheckoutDemo() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startPayment = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/payments/toss/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: "demo-ORDER-0002" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "결제창 생성에 실패했습니다");
      if (!data?.checkoutUrl) throw new Error("결제창 URL 없음");
      // Toss 호스티드 결제창으로 이동
      window.location.href = data.checkoutUrl;
    } catch (e: any) {
      setError(e?.message || "오류가 발생했습니다");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="mx-auto max-w-md px-6 py-12">
      <div className="rounded-2xl border p-6 shadow-sm">
        <h1 className="text-xl font-semibold">체크아웃 (테스트)</h1>
        <p className="mt-2 text-sm text-gray-600">주문번호 <b>demo-ORDER-0001</b>, 금액 <b>55,000 KRW</b></p>

        <button
          onClick={startPayment}
          disabled={loading}
          className="mt-6 w-full rounded-xl bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {loading ? "결제창 여는 중…" : "결제 진행"}
        </button>

        {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

        <div className="mt-6 text-xs text-gray-500">
          <p>결제 성공 후 <code>/payment/success</code>로 리디렉션되며, 서버에서 자동 확인됩니다.</p>
        </div>
      </div>
    </main>
  );
}

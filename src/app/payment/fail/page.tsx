
"use client";

import { useSearchParams } from "next/navigation";

export default function PaymentFail() {
  const search = useSearchParams();
  const code = search.get("code") || search.get("errorCode") || "PAYMENT_FAILED";
  const message = search.get("message") || search.get("errorMessage") || "결제가 취소되었거나 실패했습니다.";
  const orderId = search.get("orderId");

  return (
    <main className="mx-auto max-w-xl px-6 py-12">
      <div className="rounded-2xl border p-6 shadow-sm">
        <h1 className="text-xl font-semibold">결제 실패/취소 ❌</h1>
        <p className="mt-2 text-sm text-gray-700">{message}</p>

        <div className="mt-6 divide-y">
          <div className="flex items-center justify-between gap-4 py-1">
            <span className="text-sm text-gray-500">코드</span>
            <span className="text-sm font-medium">{code}</span>
          </div>
          {orderId && (
            <div className="flex items-center justify-between gap-4 py-1">
              <span className="text-sm text-gray-500">주문 ID</span>
              <span className="text-sm font-medium break-all">{orderId}</span>
            </div>
          )}
        </div>

        <div className="mt-8 flex gap-3">
          <a href="/checkout" className="rounded-xl border px-4 py-2 text-sm font-medium hover:bg-gray-50">결제 다시 시도</a>
          <a href="/" className="rounded-xl border px-4 py-2 text-sm font-medium hover:bg-gray-50">홈으로</a>
        </div>
      </div>
    </main>
  );
}
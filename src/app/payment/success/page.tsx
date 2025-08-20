// =============================
// app/payment/success/page.tsx
// =============================
"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";

function LabelValue({ label, value }: { label: string; value?: string | number | null }) {
  if (value == null || value === "") return null;
  return (
    <div className="flex items-center justify-between gap-4 py-1">
      <span className="text-sm text-gray-500">{label}</span>
      <span className="text-sm font-medium break-all">{String(value)}</span>
    </div>
  );
}

export default function PaymentSuccess() {
  const search = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<"idle" | "confirming" | "ok" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState<string>("");

  const qp = useMemo(() => {
    const paymentKey = search.get("paymentKey");
    const orderId = search.get("orderId");
    const amountStr = search.get("amount");
    const amount = amountStr ? Number(amountStr) : undefined;
    return { paymentKey, orderId, amount };
  }, [search]);

  useEffect(() => {
    const run = async () => {
      // 필수 파라미터 검증
      if (!qp.paymentKey || !qp.orderId || typeof qp.amount !== "number" || Number.isNaN(qp.amount)) {
        setStatus("error");
        setErrorMsg("필수 파라미터가 누락되었거나 올바르지 않습니다 (paymentKey, orderId, amount).");
        return;
      }
      try {
        setStatus("confirming");
        const res = await fetch("/api/payments/toss/confirm", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ paymentKey: qp.paymentKey, orderId: qp.orderId, amount: qp.amount }),
          cache: "no-store",
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          setErrorMsg(data?.message || data?.error || `확인 실패 (HTTP ${res.status}).`);
          setStatus("error");
          return;
        }
        setStatus("ok");
      } catch (err: any) {
        setErrorMsg(err?.message || "결제 확인 중 네트워크 오류가 발생했습니다.");
        setStatus("error");
      }
    };
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main className="mx-auto max-w-xl px-6 py-12">
      <div className="rounded-2xl border p-6 shadow-sm">
        {status === "confirming" && (
          <>
            <h1 className="text-xl font-semibold">결제 검증 중…</h1>
            <p className="mt-2 text-sm text-gray-600">안전한 확인 절차를 진행하고 있습니다. 잠시만 기다려 주세요.</p>
            <div className="mt-6 h-2 w-full overflow-hidden rounded bg-gray-100">
              <div className="h-2 w-1/2 animate-pulse bg-gray-400" />
            </div>
          </>
        )}

        {status === "ok" && (
          <>
            <h1 className="text-xl font-semibold">결제가 확인되었습니다 ✅</h1>
            <p className="mt-2 text-sm text-gray-600">구매하신 강의 접근 권한이 활성화되었습니다. 좋은 학습 되세요!</p>

            <div className="mt-6 divide-y">
              <LabelValue label="주문 ID" value={qp.orderId} />
              <LabelValue label="금액" value={qp.amount?.toLocaleString()} />
              <LabelValue label="결제 키" value={qp.paymentKey} />
            </div>

            <div className="mt-8 flex gap-3">
              <button onClick={() => router.push("/my/courses")} className="rounded-xl border bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-900">
                내 강의로 가기
              </button>
              <button onClick={() => router.push("/dashboard")} className="rounded-xl border px-4 py-2 text-sm font-medium hover:bg-gray-50">
                대시보드
              </button>
            </div>
          </>
        )}

        {status === "error" && (
          <>
            <h1 className="text-xl font-semibold">확인에 실패했습니다 ❌</h1>
            <p className="mt-2 text-sm text-red-600">{errorMsg || "오류가 발생했습니다."}</p>
            <div className="mt-6 divide-y">
              <LabelValue label="주문 ID" value={qp.orderId} />
              <LabelValue label="금액" value={qp.amount?.toLocaleString()} />
              <LabelValue label="결제 키" value={qp.paymentKey} />
            </div>
            <div className="mt-8 flex gap-3">
              <button onClick={() => router.push("/checkout")} className="rounded-xl border px-4 py-2 text-sm font-medium hover:bg-gray-50">
                결제 다시 시도
              </button>
              <button onClick={() => router.push("/")} className="rounded-xl border px-4 py-2 text-sm font-medium hover:bg-gray-50">
                홈으로
              </button>
            </div>
          </>
        )}

        {status === "idle" && (
          <>
            <h1 className="text-xl font-semibold">리디렉션 중…</h1>
            <p className="mt-2 text-sm text-gray-600">처리 중입니다.</p>
          </>
        )}
      </div>
    </main>
  );
}

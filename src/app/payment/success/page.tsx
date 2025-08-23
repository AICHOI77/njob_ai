"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";

export const dynamic = "force-dynamic";

const krw = (n?: number) =>
  typeof n === "number"
    ? new Intl.NumberFormat("ko-KR", { style: "currency", currency: "KRW", maximumFractionDigits: 0 })
        .format(n)
        .replace("₩", "") + "원"
    : undefined;

function LabelValue({ label, value }: { label: string; value?: string | number | null }) {
  if (value == null || value === "") return null;
  return (
    <div className="flex items-center justify-between gap-4 py-1">
      <span className="text-sm text-white/50">{label}</span>
      <span className="text-sm font-medium break-all text-white">{String(value)}</span>
    </div>
  );
}

function SuccessInner() {
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

  const isFreeFlow = !!qp.orderId && !qp.paymentKey;

  useEffect(() => {
    const run = async () => {
      if (isFreeFlow) {
        setStatus("ok");
        return;
      }
      if (!qp.paymentKey || !qp.orderId || typeof qp.amount !== "number" || Number.isNaN(qp.amount)) {
        setStatus("error");
        setErrorMsg("필수 파라미터가 누락되었거나 올바르지 않습니다 (paymentKey, orderId, amount).");
        return;
      }
      try {
        setStatus("confirming");
        const res = await fetch("/api/payments/toss/confirm", {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify({ paymentKey: qp.paymentKey, orderId: qp.orderId, amount: qp.amount }),
          cache: "no-store",
        });
        const ct = res.headers.get("content-type") || "";
        const data = ct.includes("application/json") ? await res.json() : {};
        if (!res.ok) {
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
    <main className="relative min-h-screen bg-black text-white">
      {/* Netflix-like backdrop */}
      <div className="pointer-events-none absolute inset-0 -z-10 [background:linear-gradient(149deg,_#192247_0%,_#210e17_96.86%)]" />
      <div className="pointer-events-none absolute inset-0 -z-10 [background:linear-gradient(180deg,rgba(0,0,0,0.86)_0%,rgba(0,0,0,0.82)_45%,rgba(0,0,0,0.92)_100%)]" />
      <div className="pointer-events-none absolute inset-0 -z-10 [background:radial-gradient(65%_120%_at_100%_100%,rgba(229,9,20,0.18),rgba(229,9,20,0)_60%),radial-gradient(60%_120%_at_0%_100%,rgba(121,53,200,0.16),rgba(121,53,200,0)_60%)]" />
      <div className="absolute inset-0 -z-10 bg-[url('/noise.png')] opacity-20 mix-blend-overlay" aria-hidden />

      <div className="mx-auto max-w-xl px-6 py-16">
        <div className="rounded-2xl border border-white/10 bg-black/60 p-6 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.7)] backdrop-blur">
          {/* Confirming */}
          {status === "confirming" && (
            <>
              <div className="flex items-center gap-3">
                <span className="inline-flex h-8 w-8 animate-spin rounded-full border-4 border-white/15 border-t-white/70" />
                <h1 className="text-xl font-bold">결제 검증 중…</h1>
              </div>
              <p className="mt-2 text-sm text-white/70">안전한 확인 절차를 진행하고 있습니다. 잠시만 기다려 주세요.</p>
              <div className="mt-6 h-2 w-full overflow-hidden rounded bg-white/10">
                <div className="h-2 w-1/2 animate-pulse bg-white/40" />
              </div>
            </>
          )}

          {/* OK */}
          {status === "ok" && (
            <>
              <div className="flex items-center gap-3">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[var(--accent)]/20">
                  {/* check icon */}
                  <svg width="18" height="18" viewBox="0 0 24 24" className="text-[var(--accent)]">
                    <path fill="currentColor" d="M9 16.17 4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                  </svg>
                </span>
                <h1 className="text-xl font-extrabold">
                  {isFreeFlow ? "무료 등록이 완료되었습니다 ✅" : "결제가 확인되었습니다 ✅"}
                </h1>
              </div>
              <p className="mt-2 text-sm text-white/70">구매하신 강의 접근 권한이 활성화되었습니다. 좋은 학습 되세요!</p>

              <div className="mt-6 divide-y divide-white/10">
                <LabelValue label="주문 ID" value={qp.orderId} />
                {!isFreeFlow && <LabelValue label="금액" value={qp.amount != null ? krw(qp.amount) : undefined} />}
                {!isFreeFlow && <LabelValue label="결제 키" value={qp.paymentKey} />}
              </div>

              <div className="mt-8 flex flex-wrap gap-3">
                <button
                  onClick={() => router.push("/my/courses")}
                  className="rounded-xl bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white hover:brightness-95"
                >
                  내 강의로 가기
                </button>
                <button
                  onClick={() => router.push("/")}
                  className="rounded-xl border border-white/15 px-4 py-2 text-sm font-medium hover:bg-white/5"
                >
                  홈으로
                </button>
              </div>
            </>
          )}

          {/* Error */}
          {status === "error" && (
            <>
              <div className="flex items-center gap-3">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-red-500/15">
                  {/* x icon */}
                  <svg width="18" height="18" viewBox="0 0 24 24" className="text-red-400">
                    <path
                      fill="currentColor"
                      d="m12 10.586 4.95-4.95 1.414 1.414L13.414 12l4.95 4.95-1.414 1.414L12 13.414l-4.95 4.95-1.414-1.414L10.586 12l-4.95-4.95L7.05 5.636z"
                    />
                  </svg>
                </span>
                <h1 className="text-xl font-extrabold">확인에 실패했습니다 ❌</h1>
              </div>
              <p className="mt-2 text-sm text-red-400">{errorMsg || "오류가 발생했습니다."}</p>

              <div className="mt-6 divide-y divide-white/10">
                <LabelValue label="주문 ID" value={qp.orderId} />
                <LabelValue label="금액" value={qp.amount != null ? krw(qp.amount) : undefined} />
                <LabelValue label="결제 키" value={qp.paymentKey} />
              </div>

              <div className="mt-8 flex flex-wrap gap-3">
                <button
                  onClick={() => router.push("/lecture")}
                  className="rounded-xl border border-white/15 px-4 py-2 text-sm font-medium hover:bg-white/5"
                >
                  결제 다시 시도
                </button>
                <button
                  onClick={() => router.push("/")}
                  className="rounded-xl border border-white/15 px-4 py-2 text-sm font-medium hover:bg-white/5"
                >
                  홈으로
                </button>
              </div>
            </>
          )}

          {/* Idle */}
          {status === "idle" && (
            <>
              <h1 className="text-xl font-extrabold">리디렉션 중…</h1>
              <p className="mt-2 text-sm text-white/70">처리 중입니다.</p>
            </>
          )}
        </div>
      </div>
    </main>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense
      fallback={
        <main className="relative min-h-screen bg-black text-white">
          <div className="pointer-events-none absolute inset-0 -z-10 [background:linear-gradient(149deg,_#192247_0%,_#210e17_96.86%)]" />
          <div className="pointer-events-none absolute inset-0 -z-10 [background:linear-gradient(180deg,rgba(0,0,0,0.86)_0%,rgba(0,0,0,0.82)_45%,rgba(0,0,0,0.92)_100%)]" />
          <div className="pointer-events-none absolute inset-0 -z-10 [background:radial-gradient(65%_120%_at_100%_100%,rgba(229,9,20,0.18),rgba(229,9,20,0)_60%),radial-gradient(60%_120%_at_0%_100%,rgba(121,53,200,0.16),rgba(121,53,200,0)_60%)]" />
          <div className="absolute inset-0 -z-10 bg-[url('/noise.png')] opacity-20 mix-blend-overlay" aria-hidden />
          <div className="mx-auto max-w-xl px-6 py-16">
            <div className="rounded-2xl border border-white/10 bg-black/60 p-6 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.7)] backdrop-blur">
              <div className="flex items-center gap-3">
                <span className="inline-flex h-8 w-8 animate-spin rounded-full border-4 border-white/15 border-t-white/70" />
                <h1 className="text-xl font-bold">리디렉션 중…</h1>
              </div>
              <p className="mt-2 text-sm text-white/70">처리 중입니다.</p>
              <div className="mt-6 h-2 w-full overflow-hidden rounded bg-white/10">
                <div className="h-2 w-1/2 animate-pulse bg-white/40" />
              </div>
            </div>
          </div>
        </main>
      }
    >
      <SuccessInner />
    </Suspense>
  );
}

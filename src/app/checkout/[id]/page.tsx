"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { lecturesApi } from "@/app/api/lectures";
import type { LectureWithCoach } from "@/types/lectures";

const krw = (n: number) =>
  new Intl.NumberFormat("ko-KR", { style: "currency", currency: "KRW", maximumFractionDigits: 0 })
    .format(n)
    .replace("₩", "") + "원";

const toNumber = (v: unknown): number => {
  if (typeof v === "number") return v;
  if (typeof v === "string") {
    const digits = v.replace(/[^\d]/g, "");
    return digits ? parseInt(digits, 10) : 0;
  }
  return 0;
};

type PayMethod = "TOSS";

const isUuid = (s: unknown): s is string =>
  typeof s === "string" &&
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(s);

export default function CheckoutPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { status, data: session } = useSession();

  const [lecture, setLecture] = useState<LectureWithCoach | null>(null);
  const [loading, setLoading] = useState(true);
  const [coupon, setCoupon] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const lec = await lecturesApi.getLectureById(id);
        setLecture(lec);
      } catch (e) {
        console.error(e);
        router.replace("/lecture");
      } finally {
        setLoading(false);
      }
    })();
  }, [id, router]);

  useEffect(() => {
    if (!loading && status === "unauthenticated") {
      const cb = `/checkout/${id}`;
      router.replace(`/login?callbackUrl=${encodeURIComponent(cb)}`);
    }
  }, [loading, status, id, router]);

  const rawPrice = lecture?.price ?? "0";
  const price = toNumber(rawPrice);
  const discount = 0;
  const total = useMemo(() => Math.max(0, price - discount), [price, discount]);
  const isFree = total <= 0;

  async function startPayment() {
    if (!lecture || !id) return;

    if (status !== "authenticated") {
      const cb = `/checkout/${id}`;
      router.replace(`/login?callbackUrl=${encodeURIComponent(cb)}`);
      return;
    }

    const userUuid = (session?.user as any)?.id;
    if (!isUuid(userUuid)) {
      console.error("[checkout] UUID utilisateur invalide dans la session", session?.user);
      alert("계정 식별자(사용자 UUID)를 찾을 수 없습니다. 다시 로그인해 주세요.");
      return;
    }

    setSubmitting(true);
    try {
      const initRes = await fetch("/api/orders/init", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        body: JSON.stringify({
          lectureId: lecture.id,
          coupon: coupon || null,
          method: "TOSS" as PayMethod,
          userId: userUuid,
        }),
      });

      const initCT = initRes.headers.get("content-type") || "";
      if (!initCT.includes("application/json")) {
        const txt = await initRes.text();
        console.error("[/api/orders/init] Non-JSON response", { status: initRes.status, txt: txt.slice(0, 200) });
        alert("서버 응답이 올바르지 않습니다. 잠시 후 다시 시도해 주세요.");
        setSubmitting(false);
        return;
      }

      const initJson = await initRes.json();
      if (!initRes.ok) {
        alert(initJson?.message || "주문 생성에 실패했습니다");
        setSubmitting(false);
        return;
      }
      if (initJson.free && initJson.redirect) {
        window.location.href = initJson.redirect;
        return;
      }
      const payRes = await fetch("/api/payments/toss/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        body: JSON.stringify({ orderId: initJson.orderId }),
      });

      const payCT = payRes.headers.get("content-type") || "";
      if (!payCT.includes("application/json")) {
        const txt = await payRes.text();
        console.error("[/api/payments/toss/create] Non-JSON response", { status: payRes.status, txt: txt.slice(0, 200) });
        alert("결제창 생성 중 문제가 발생했습니다. 잠시 후 다시 시도해 주세요.");
        setSubmitting(false);
        return;
      }

      const payJson = await payRes.json();
      if (!payRes.ok || !payJson.checkoutUrl) {
        alert(payJson?.message || "결제창 생성에 실패했습니다");
        setSubmitting(false);
        return;
      }

      window.location.href = payJson.checkoutUrl;
    } catch (e: any) {
      console.error(e);
      alert(e?.message || "결제 시작 중 오류가 발생했습니다");
      setSubmitting(false);
    }
  }

  if (loading || !lecture) {
    return (
      <div className="min-h-screen grid place-items-center bg-black text-white">
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-white/15 border-t-white/70" />
          <p className="text-sm text-white/70">결제 페이지를 불러오는 중…</p>
        </div>
      </div>
    );
  }

  return (
    <main className="relative min-h-screen bg-black text-white">
      <div className="pointer-events-none absolute inset-0 -z-10 [background:linear-gradient(149deg,_#192247_0%,_#210e17_96.86%)]" />
      <div className="pointer-events-none absolute inset-0 -z-10 [background:linear-gradient(180deg,rgba(0,0,0,0.86)_0%,rgba(0,0,0,0.82)_45%,rgba(0,0,0,0.92)_100%)]" />
      <div className="pointer-events-none absolute inset-0 -z-10 [background:radial-gradient(65%_120%_at_100%_100%,rgba(229,9,20,0.18),rgba(229,9,20,0)_60%),radial-gradient(60%_120%_at_0%_100%,rgba(121,53,200,0.16),rgba(121,53,200,0)_60%)]" />

      <div className="mx-auto max-w-6xl px-4 py-10">
        <h1 className="text-3xl font-extrabold mb-8">주문결제</h1>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          {/* Gauche */}
          <div className="space-y-6">
            <div className="rounded-2xl border border-white/10 bg-[#0f0f0f] p-5">
              <div className="flex items-center gap-4">
                <div className="overflow-hidden rounded-lg border border-white/10">
                  <Image
                    src={lecture.thumbnail}
                    alt={lecture.title}
                    width={280}
                    height={160}
                    className="h-28 w-44 object-cover"
                  />
                </div>
                <div className="min-w-0">
                  <h2 className="text-lg font-bold line-clamp-2">{lecture.title}</h2>
                  <p className="mt-2 text-white/80">{krw(price)}</p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-[#0f0f0f] p-5">
              <h3 className="mb-3 font-semibold">쿠폰</h3>
              <div className="flex gap-2">
                <input
                  value={coupon}
                  onChange={(e) => setCoupon(e.target.value)}
                  placeholder="쿠폰 코드를 입력하세요."
                  className="flex-1 rounded-md border border-white/15 bg-black/40 px-4 py-3 placeholder-white/40 outline-none focus:border-white/25"
                />
                <button
                  type="button"
                  onClick={() => alert("쿠폰 기능은 곧 제공됩니다.")}
                  className="shrink-0 rounded-md border border-white/15 px-4 py-3 hover:bg-white/5"
                >
                  쿠폰 등록
                </button>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-[#0f0f0f] p-5">
              <h3 className="mb-3 font-semibold">결제 방법</h3>

              {isFree ? (
                <div className="rounded-xl border border-green-500/40 bg-green-500/10 p-4 text-sm text-green-300">
                  무료 강의입니다. 결제 없이 등록됩니다.
                </div>
              ) : (
                <button
                  onClick={startPayment}
                  disabled={submitting}
                  className={`w-full rounded-xl border px-4 py-4 transition
                    ${submitting ? "opacity-60 cursor-not-allowed" : "hover:bg-white/5"}
                    border-white/15 bg-[#0a0a0a]`}
                  aria-label="toss pay로 결제하기"
                >
                  <div className="flex items-center justify-center gap-3">
                    <Image
                      src="/toss-pay-white.png"
                      alt="toss pay"
                      width={160}
                      height={36}
                      className="h-full w-auto"
                      priority
                    />
                  </div>
                </button>
              )}

              <div className="mt-3 text-xs text-white/60">
                <span className="inline-flex items-center gap-2 rounded-md bg-black/40 px-3 py-2">
                  신한카드 최대 12개월 무이자 할부
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-5">
            <div className="rounded-2xl border border-white/10 bg-[#0f0f0f] p-6">
              <h3 className="mb-4 text-lg font-extrabold">결제 금액</h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-white/70">강의 금액</span>
                  <span>{krw(price)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-white/70">쿠폰 사용</span>
                  <span>{krw(0)}</span>
                </div>

                <div className="my-3 h-px w-full bg-white/10" />

                <div className="flex items-center justify-between text-xl font-extrabold">
                  <span>총 결제 금액</span>
                  <span>{krw(total)}</span>
                </div>
                {!isFree && (
                  <p className="text-right text-xs text-white/50">
                    12개월 할부 시 월 {krw(Math.ceil(total / 12))}
                  </p>
                )}
              </div>

              <button
                onClick={startPayment}
                disabled={submitting}
                className="mt-6 w-full rounded-lg bg-[var(--accent)] py-4 font-semibold text-white transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting
                  ? isFree
                    ? "등록 중…"
                    : "결제 시작…"
                  : isFree
                  ? "무료로 등록하기"
                  : "결제하기"}
              </button>

              <p className="mt-4 text-right text-xs text-white/50">
                <Link href="/policy" className="underline hover:text-white">
                  환불 규정
                </Link>{" "}
                및{" "}
                <Link href="/tos" className="underline hover:text-white">
                  이용약관
                </Link>{" "}
                동의
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

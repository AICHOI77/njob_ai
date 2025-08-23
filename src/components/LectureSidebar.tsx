"use client";

import { LectureWithCoach } from "@/types/lectures";
import InfoModal from "@/components/InfoModal";
import { CountdownTimer } from "@/components/CountdownTimer";
import { useLectureApply } from "@/hooks/useLectureApply";
import { useCountdownTimer } from "@/hooks/useCountdownTimer";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

export function LectureSidebar({ lecture }: { lecture: LectureWithCoach }) {
  const {
    modalStatus,
    setModalStatus,
    isLoading,
    handleLogin,
    isApplied,
  } = useLectureApply(lecture.id);

  const { status } = useSession();
  const router = useRouter();

  const timeLeft = useCountdownTimer(lecture.start_date);
  const isExpired =
    timeLeft.days === 0 &&
    timeLeft.hours === 0 &&
    timeLeft.minutes === 0 &&
    timeLeft.seconds === 0;

  const price = (lecture as any).price ?? 0;
  const originalPrice: number | undefined = (lecture as any).original_price;
  const hasDiscount = typeof originalPrice === "number" && originalPrice > price;
  const discountPct = hasDiscount
    ? Math.round((1 - price / (originalPrice as number)) * 100)
    : 0;
  const fmtKRW = (n: number) =>
    n.toLocaleString("ko-KR", { maximumFractionDigits: 0 }) + "원";

  const disabled = isLoading || isExpired || (price === 0 && isApplied);
  const ctaLabel = isLoading
    ? "처리 중..."
    : isExpired
    ? "신청 마감"
    : price === 0
    ? isApplied
      ? "무료강의 신청완료"
      : "무료강의 신청하기"
    : "강의 구매하기";

  const onCtaClick = () => {
    const target = `/checkout/${lecture.id}`;
    if (status === "authenticated") {
      router.push(target);
    } else {
      router.push(`/login?callbackUrl=${encodeURIComponent(target)}`);
    }
  };

  return (
    <div className="h-fit lg:sticky lg:top-8">
      <aside className="rounded-2xl border border-white/10 bg-[#0b0b0b] p-5 text-white shadow-sm">
        {/* Coach chip */}
        <div className="mb-3 flex flex-wrap gap-2">
          <span className="rounded-full border px-4 py-1 text-sm font-semibold text-[var(--accent)] border-[var(--accent)]">
            {lecture.coach.name}
          </span>
        </div>

        {/* Title */}
        <h3 className="mb-5 text-xl font-bold">{lecture.title}</h3>

        {/* Info */}
        <div className="space-y-2 border-b border-white/10 pb-5">
          <div className="flex justify-between text-sm">
            <span className="font-semibold text-white/70">강의정보</span>
            <span className="text-white/80">온라인</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="font-semibold text-white/70">강사명</span>
            <span className="text-white/90">{lecture.coach.name}</span>
          </div>
        </div>

        {/* Price / Discount */}
        <div className="mt-5">
          {price === 0 ? (
            <div className="flex items-baseline justify-between">
              <span className="font-bold text-[var(--accent)]">무료</span>
              <span className="font-bold text-[var(--accent)]">0원</span>
            </div>
          ) : (
            <>
              {hasDiscount && (
                <div className="mb-2 flex flex-wrap items-baseline gap-x-3">
                  <div className="text-lg font-extrabold text-red-500">
                    {discountPct}% 할인
                  </div>
                  <div className="text-xl font-bold">
                    <span className="mr-2 align-middle text-white/40 line-through">
                      {fmtKRW(originalPrice!)}
                    </span>
                    <span className="align-middle">{fmtKRW(price)}</span>
                  </div>
                </div>
              )}

              <div className="rounded-xl border border-white/10 bg-[#141414] p-4">
                <dl className="space-y-2 text-white/90">
                  <div className="flex items-center justify-between">
                    <dt className="text-white/70">판매금액</dt>
                    <dd>{fmtKRW(originalPrice ?? price)}</dd>
                  </div>
                  <div className="flex items-center justify-between">
                    <dt className="text-white/70">할인금액</dt>
                    <dd>
                      {hasDiscount
                        ? fmtKRW((originalPrice as number) - price)
                        : "0원"}
                    </dd>
                  </div>
                  <div className="mt-1 flex items-center justify-between border-t border-white/10 pt-2">
                    <dt className="font-bold">총 결제금액</dt>
                    <dd className="font-extrabold">{fmtKRW(price)}</dd>
                  </div>
                </dl>
              </div>
            </>
          )}
        </div>

        {/* CTA */}
        <button
          onClick={onCtaClick}
          disabled={disabled}
          className={`mt-4 w-full rounded-xl px-5 py-4 text-center text-base font-extrabold transition
            ${
              disabled
                ? "cursor-not-allowed bg-[var(--accent)]/40 text-white/40 glow"
                : "bg-[var(--accent)] text-white hover:bg-[var(--accent)] active:bg-[var(--accent)] glow"
            }`}
            aria-disabled={disabled}
        >
          {ctaLabel}
        </button>

        {/* Countdown */}
        <div className="mt-4">
          <CountdownTimer deadline={lecture.start_date} />
        </div>
      </aside>

      <InfoModal
        isOpen={modalStatus !== "hidden"}
        onClose={() => setModalStatus("hidden")}
        onLogin={handleLogin}
        status={modalStatus === "success" ? "success" : "login"}
      />
    </div>
  );
}

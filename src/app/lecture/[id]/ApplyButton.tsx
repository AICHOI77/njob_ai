"use client";

import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

export default function ApplyButton({ lectureId }: { lectureId: number }) {
  const router = useRouter();
  const { status } = useSession();

  const handleClick = () => {
    const target = `/checkout/${lectureId}`;
    if (status === "authenticated") {
      router.push(target);
    } else {
      router.push(`/login?callbackUrl=${encodeURIComponent(target)}`);
    }
  };

  return (
    <button
      onClick={handleClick}
      className="rounded-xl bg-[var(--accent,#111)] text-white px-4 py-3 hover:brightness-110"
    >
      신청 마감
    </button>
  );
}

// src/components/AuthButton.tsx
"use client";

import Link from "next/link";
import Image from "next/image";
import { useSession, signOut } from "next-auth/react";

export default function AuthButton() {
  const { data, status } = useSession();
  const user = data?.user;

  if (status === "loading") {
    return <div className="shrink-0 w-[140px] h-9 rounded-md bg-white/10 animate-pulse" />;
  }

  if (!user) {
    return (
      <Link
        href="/login"
        className="shrink-0 inline-flex items-center gap-2 rounded-md border border-white/15 px-3 py-1.5 text-sm hover:bg-white/5"
      >
        로그인
      </Link>
    );
  }

  const name = user.name ?? user.email?.split("@")[0] ?? "내 프로필";

  return (
    <div className="shrink-0 inline-flex items-center gap-2">
      <Link href="/me/agents" className="inline-flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-white/5">
        {user.image ? (
          <Image
            src={user.image}
            alt="avatar"
            width={28}
            height={28}
            className="w-7 h-7 rounded-full object-cover"
            unoptimized
          />
        ) : (
          <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-xs">
            {name.slice(0, 1).toUpperCase()}
          </div>
        )}
        <span className="text-white font-semibold">{name}님 강의실</span>
      </Link>
      <button
        onClick={() => signOut({ callbackUrl: "/" })}
        className="rounded-md border border-white/15 px-2 py-1 text-xs text-white/70 hover:bg-white/5"
      >
        로그아웃
      </button>
    </div>
  );
}

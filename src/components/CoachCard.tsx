"use client";

import Image from "next/image";
import { ArrowDownRight } from "lucide-react";
import { CoachCardProps } from "@/types/coaches";
import Link from "next/link";

export default function CoachCard({
  coach,
  isActive,
  onClick,
}: CoachCardProps) {
  return (
    <div
      className={`relative h-[412px] min-w-full cursor-pointer overflow-hidden rounded-[20px] bg-neutral-900 text-white saturate-100 transition-all duration-800 xl:w-auto xl:min-w-[184px] ${
        isActive
          ? "xl:min-w-[500px] xl:flex-[3] xl:saturate-100"
          : "xl:w-[184px] xl:flex-[1] xl:saturate-[0.1]"
      }`}
      onClick={onClick}
    >
      {/* Gradient Overlay */}
      <div className="pointer-events-none absolute inset-0 z-10 bg-gradient-to-b from-neutral-900/90 via-neutral-900/35 to-violet-800/30" />

      {/* Mentor Image */}
      <div className="absolute inset-y-6 left-4 w-[60%] transition-all duration-800 sm:left-6 sm:w-[56%] md:left-8 md:w-[54%] xl:left-10 xl:w-[50%]">
        <div className="relative size-full rounded-xl ring-1 ring-white/10 shadow-2xl bg-neutral-900/40">
          <Image
            src={coach.profile_image || ""}
            alt={coach.name}
            fill
            sizes="100vw"
            className="pointer-events-none h-full w-full select-none object-contain"
          />
        </div>
      </div>

      {/* Content */}
      <div
        className={`absolute inset-y-0 right-0 z-20 px-6 py-8 md:px-10
        left-[62%] sm:left-[60%] md:left-[58%] xl:left-[54%]
        transition-all duration-800 ${isActive ? "xl:opacity-100" : "xl:opacity-0"}`}
      >
        <div className="flex h-full flex-col gap-6">
          <div className="relative w-fit">
            <h3 className="text-2xl font-semibold">{coach.name}</h3>
            <div className="absolute -bottom-px left-0 h-2 w-full rounded bg-gradient-to-r from-violet-600 to-fuchsia-500" />
          </div>

          {/* Specialty and Achievements */}
          <div className="space-y-3 flex-1">
            <h4 className="font-semibold">{coach.bio}</h4>
            <ul className="list-inside list-disc text-sm">
              {coach.career.split("\n").map((line, index) => (
                <li key={index}>{line}</li>
              ))}
            </ul>
          </div>

          {/* Learn More Button */}
          <Link
            href={`/coach/${coach.id}`}
            className="group inline-flex items-center gap-3 self-end mt-6"
          >
            <span className="text-white/90">강사 더 알아보기</span>
            <div
              className={`flex aspect-square size-10 items-center justify-center rounded-full border stroke-1 p-1 transition-all duration-300 ${
                isActive
                  ? "border-slate-700 bg-slate-700 group-hover:scale-105"
                  : "border-white/70 bg-white/10 backdrop-blur-sm group-hover:scale-105"
              }`}
            >
              <ArrowDownRight className="h-5 w-5" />
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}

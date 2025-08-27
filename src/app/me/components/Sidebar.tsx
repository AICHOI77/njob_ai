"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart2, Activity, Settings, User2, X, PlusCircle } from "lucide-react";
import dynamic from "next/dynamic";

const AuthButton = dynamic(() => import("@/components/AuthButton"), { ssr: false });

export default function Sidebar({
  onNavigate,
  onClose, // called by the ✕ button
}: {
  onNavigate?: () => void;
  onClose?: () => void;
}) {
  const pathname = usePathname();

  const NavItem = ({
    icon,
    label,
    href,
  }: {
    icon: React.ReactNode;
    label: string;
    href: string;
  }) => {
    const active = href === "/me" ? pathname === "/me" : pathname?.startsWith(href);
    return (
      <Link
        href={href}
        onClick={onNavigate}
        className={`flex items-center gap-3 px-3 py-3 md:py-2 rounded-xl text-sm transition-colors border ${
          active ? "bg-zinc-800/70 border-zinc-700" : "border-transparent hover:bg-zinc-800/60"
        }`}
      >
        {icon}
        <span>{label}</span>
      </Link>
    );
  };

  return (
    <aside className="w-full h-full flex flex-col bg-[#151515] text-white">
      {/* Brand + Close (mobile only) */}
      <div className="h-16 px-4 flex items-center justify-between border-b border-neutral-800">
        <Link href="/me" onClick={onNavigate} className="inline-flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-rose-600 flex items-center justify-center font-bold">AI</div>
          <div className="leading-tight">
            <div className="font-semibold">AI 사주 에이전트</div>
            <div className="text-xs text-neutral-400">관리자 패널</div>
          </div>
        </Link>

        {/* ✕ close */}
        <button
          type="button"
          aria-label="Close menu"
          onClick={onClose ?? onNavigate}
          className="md:hidden inline-flex h-9 w-9 items-center justify-center rounded-lg border border-neutral-800 hover:bg-neutral-900"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Nav */}
      <div className="flex-1 overflow-y-auto p-3 space-y-6">
        <div>
          <div className="px-3 text-xs uppercase tracking-wide text-neutral-500">주요 기능</div>
          <div className="mt-2 space-y-1">
            <NavItem icon={<BarChart2 className="h-4 w-4" />} label="대시보드" href="/me/ai-saju" />
            <NavItem icon={<Activity className="h-4 w-4" />} label="세션 관리" href="/me/ai-saju/sessions" />
            {/* NEW: 사주 읽기 -> /me/reading/new */}
            <NavItem icon={<PlusCircle className="h-4 w-4" />} label="사주 읽기" href="/me/ai-saju/reading/new" />
          </div>
        </div>

        <div>
          <div className="px-3 text-xs uppercase tracking-wide text-neutral-500">시스템 관리</div>
          <div className="mt-2 space-y-1">
            <NavItem icon={<Settings className="h-4 w-4" />} label="설정" href="/me/ai-saju/settings" />
          </div>
        </div>
        <div>
          <div className="px-3 text-xs uppercase tracking-wide text-neutral-500">사용자</div>
          <div className="mt-2 space-y-1">
            <AuthButton />
          </div>
        </div>
      </div>
      

      {/* Footer */}
      <div className="p-4 border-t border-neutral-800 flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-neutral-800 flex items-center justify-center">
          <User2 className="h-5 w-5" />
        </div>
        <div>
          <div className="text-sm font-medium">관리자</div>
          <div className="text-xs text-neutral-400">Admin User</div>
        </div>
      </div>
    </aside>
  );
}

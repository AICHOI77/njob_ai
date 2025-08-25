"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, FileText, PlusCircle, Users, Settings } from "lucide-react";

function NavItem({
  href, label, icon, active, onClick,
}: {
  href: string;
  label: string;
  icon: React.ReactNode;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`group flex items-center gap-3 px-3 py-2 rounded-xl border transition
        ${active ? "border-neutral-700 bg-neutral-900"
                 : "border-transparent hover:border-neutral-800 hover:bg-black/30"}`}
    >
      <span className="w-5 h-5 opacity-90">{icon}</span>
      <span className="text-sm">{label}</span>
    </Link>
  );
}

export default function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const items = [
    { href: "/me", label: "대시보드", icon: <LayoutDashboard className="w-5 h-5" /> },
    { href: "/me/sessions", label: "세션 관리", icon: <FileText className="w-5 h-5" /> },
    { href: "/me/reading/new", label: "사주 읽기", icon: <PlusCircle className="w-5 h-5" /> },
    { href: "/me/users", label: "사용자", icon: <Users className="w-5 h-5" /> },
    { href: "/me/settings", label: "설정", icon: <Settings className="w-5 h-5" /> },
  ];

  return (
    <div className="h-full flex flex-col">
      {/* Brand */}
      <div className="px-4 py-4 border-b border-neutral-800">
        <Link href="/me" className="inline-flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-[#E50914] flex items-center justify-center font-bold">AI</div>
          <div className="leading-tight">
            <div className="font-extrabold">AI 사주 에이전트</div>
            <div className="text-[11px] text-neutral-400">Admin Console</div>
          </div>
        </Link>
      </div>

      {/* Nav */}
      <div className="flex-1 p-3 space-y-1">
        {items.map((it) => (
          <NavItem
            key={it.href}
            href={it.href}
            label={it.label}
            icon={it.icon}
            active={it.href === "/me" ? pathname === "/me" : pathname?.startsWith(it.href)}
            onClick={onNavigate}
          />
        ))}
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-neutral-800">
        <div className="text-xs text-neutral-400">© {new Date().getFullYear()} wol1000.ai</div>
      </div>
    </div>
  );
}

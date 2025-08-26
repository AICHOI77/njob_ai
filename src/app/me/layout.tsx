"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Menu } from "lucide-react";
import Sidebar from "./components/Sidebar";

export default function MeLayout({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  // Escape to close
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="min-h-screen bg-[#141414] text-white flex">
      {/* Desktop sidebar */}
      <aside className="hidden md:block w-64 shrink-0 border-r border-neutral-800">
        <Sidebar />
      </aside>

      {/* Mobile header (burger) */}
      <header className="md:hidden fixed top-0 left-0 right-0 z-40 h-14 bg-[#151515]/95 backdrop-blur border-b border-neutral-800">
        <div className="h-full px-4 flex items-center justify-between">
          <button
            onClick={() => setOpen(true)}
            aria-label="Open menu"
            className="inline-flex items-center justify-center h-9 w-9 rounded-lg border border-neutral-800 bg-black/40 active:scale-95"
          >
            <Menu className="h-5 w-5" />
          </button>

          <Link href="/me" className="inline-flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#E50914] flex items-center justify-center font-bold">AI</div>
            <span className="text-sm font-semibold">AI 사주 에이전트</span>
          </Link>

          <div className="w-9" />
        </div>
      </header>

      {/* Mobile drawer */}
      <div
        className={`fixed inset-0 z-50 md:hidden transition ${
          open ? "pointer-events-auto" : "pointer-events-none"
        }`}
      >
        <div
          className={`absolute inset-0 bg-black/50 transition-opacity ${
            open ? "opacity-100" : "opacity-0"
          }`}
          onClick={() => setOpen(false)}
        />
        <div
          className={`absolute top-0 left-0 h-full w-72 bg-[#151515] border-r border-neutral-800 transform transition-transform ${
            open ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          {/* Pass onClose so the ✕ button works */}
          <Sidebar onNavigate={() => setOpen(false)} onClose={() => setOpen(false)} />
        </div>
      </div>

      {/* Main */}
      <div className="flex-1 flex min-w-0 flex-col">
        {/* spacer for mobile header */}
        <div className="md:hidden h-14" />
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}

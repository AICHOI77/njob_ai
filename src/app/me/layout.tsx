"use client";

import { useState } from "react";
import Sidebar from "./sidebar/page";

export default function MeLayout({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#141414] text-white flex">
      {/* Sidebar desktop */}
      <aside className="hidden md:block w-64 shrink-0 border-r border-neutral-800">
        <Sidebar />
      </aside>

      {/* Sidebar mobile (drawer) */}
      <div
        className={`fixed inset-0 z-40 md:hidden transition ${
          open ? "pointer-events-auto" : "pointer-events-none"
        }`}
      >
        {/* Backdrop */}
        <div
          className={`absolute inset-0 bg-black/50 transition-opacity ${
            open ? "opacity-100" : "opacity-0"
          }`}
          onClick={() => setOpen(false)}
        />
        {/* Panel */}
        <div
          className={`absolute top-0 left-0 h-full w-72 bg-[#151515] border-r border-neutral-800 transform transition-transform ${
            open ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <Sidebar onNavigate={() => setOpen(false)} />
        </div>
      </div>

      {/* Main */}
      <div className="flex-1 flex min-w-0 flex-col">
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}

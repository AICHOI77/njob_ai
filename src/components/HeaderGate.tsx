"use client";

import { usePathname } from "next/navigation";
import GlobalHeader from "@/components/GlobalHeader";

export default function HeaderGate() {
  const pathname = usePathname();
  if (!pathname) return null;

  if (pathname === "/me" || pathname.startsWith("/me/")) {
    return null;
  }

  return <GlobalHeader />;
}
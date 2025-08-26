"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

// If you have an AuthContext, uncomment the following line and adapt the hook name:
// import { useAuth } from "@/context/AuthContext";

export default function Protected({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);

  // const { isAuthenticated } = useAuth(); // <-- if you have it
  const isAuthenticated = false; // replaced by fallback below

  useEffect(() => {
  // 1) priority to context if you use it
  // if (isAuthenticated) { setReady(true); return; }

  // 2) fallback: token in localStorage or sessionStorage
    const hasToken =
      typeof window !== "undefined" &&
      (localStorage.getItem("token") || sessionStorage.getItem("token"));

    if (!isAuthenticated && !hasToken) {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    } else {
      setReady(true);
    }
  }, [isAuthenticated, pathname, router]);

  if (!ready) return null; // or a spinner
  return <>{children}</>;
}

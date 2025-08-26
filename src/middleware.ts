import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { createSupabaseMiddlewareClient } from "@/utils/supabase-middleware";

export async function middleware(req: NextRequest) {
  const t0 = Date.now();
  const { pathname, search } = req.nextUrl;
  const host = req.headers.get("host") || "";
  const ua = req.headers.get("user-agent") || "";

  // Bypass auth pages & NextAuth endpoints
  if (
    pathname.startsWith("/login") ||
    pathname.startsWith("/admin/login") ||
    pathname.startsWith("/api/auth")
  ) {
    return NextResponse.next();
  }

  const isProtected =
    pathname === "/me" ||
    pathname.startsWith("/me/") ||
    pathname.startsWith("/admin");

  if (!isProtected) return NextResponse.next();

  // 1) direct NextAuth cookie presence (works whether JWT or DB sessions)
  //    Be tolerant of prefixes/suffixes (e.g., chunked cookies or __Secure- prefix)
  const cookieNames = req.cookies.getAll().map((c) => c.name);
  const hasAnyNextAuth = cookieNames.some((n) => n.includes("next-auth.session-token"));
  const hasSecureNextAuth = cookieNames.includes("__Secure-next-auth.session-token");
  const hasDevNextAuth = cookieNames.includes("next-auth.session-token");
  const hasNextAuthCookie = hasAnyNextAuth || hasSecureNextAuth || hasDevNextAuth;

  if (hasNextAuthCookie) {
    const res = NextResponse.next();
  res.headers.set("x-auth-debug", "allow:nextauth-cookie");
  res.headers.set("x-auth-cookies", cookieNames.join(","));
    res.headers.set("x-auth-time", `${Date.now() - t0}ms`);
    console.log(
      JSON.stringify({
        tag: "mw",
        path: pathname,
        host,
        ua,
        reason: "allow:nextauth-cookie",
        hasSecureNextAuth,
        hasDevNextAuth,
        env: {
          NEXTAUTH_URL: process.env.NEXTAUTH_URL ? "set" : "missing",
          NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ? "set" : "missing",
        },
      })
    );
    return res;
  }

  // 2) try to decode NextAuth JWT (if strategy=jwt + secret ok)
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (token) {
      const res = NextResponse.next();
      res.headers.set("x-auth-debug", "allow:nextauth-jwt");
      res.headers.set("x-auth-time", `${Date.now() - t0}ms`);
      console.log(
        JSON.stringify({
          tag: "mw",
          path: pathname,
          host,
          ua,
          reason: "allow:nextauth-jwt",
          tokenDecoded: true,
        })
      );
      return res;
    } else {
      console.log(
        JSON.stringify({
          tag: "mw",
          path: pathname,
          host,
          ua,
          note: "getToken returned null",
          tokenDecoded: false,
        })
      );
    }
  } catch (e: any) {
    console.warn(
      JSON.stringify({
        tag: "mw",
        path: pathname,
        host,
        ua,
        warn: "getToken threw",
        error: e?.message || String(e),
      })
    );
  }

  // 3) Supabase session fallback
  try {
    const { supabase, response } = createSupabaseMiddlewareClient(req);
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (user) {
      response.headers.set("x-auth-debug", "allow:supabase");
      response.headers.set("x-auth-time", `${Date.now() - t0}ms`);
      console.log(
        JSON.stringify({
          tag: "mw",
          path: pathname,
          host,
          ua,
          reason: "allow:supabase",
          supabaseUserId: user.id,
        })
      );
      return response;
    } else {
      console.log(
        JSON.stringify({
          tag: "mw",
          path: pathname,
          host,
          ua,
          note: "supabase.auth.getUser returned null",
          supabaseError: error?.message || null,
        })
      );
    }
  } catch (e: any) {
    console.warn(
      JSON.stringify({
        tag: "mw",
        path: pathname,
        host,
        ua,
        warn: "supabase.getUser threw",
        error: e?.message || String(e),
      })
    );
  }

  // 4) redirect if none matched
  const loginPath = pathname.startsWith("/admin") ? "/admin/login" : "/login";
  const url = new URL(loginPath, req.url);
  url.searchParams.set("redirect", pathname + search);

  const res = NextResponse.redirect(url);
  res.headers.set("x-auth-debug", "deny:none");
  res.headers.set("x-auth-time", `${Date.now() - t0}ms`);

  console.warn(
    JSON.stringify({
      tag: "mw",
      path: pathname,
      host,
      ua,
      reason: "deny:none",
      cookiesSeen: req.cookies.getAll().map((c) => c.name),
      env: {
        NEXTAUTH_URL: process.env.NEXTAUTH_URL ? "set" : "missing",
        NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ? "set" : "missing",
      },
    })
  );

  return res;
}

export const config = {
  matcher: ["/me", "/me/:path*", "/admin/:path*"],
};

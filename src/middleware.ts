import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { createSupabaseMiddlewareClient } from "@/utils/supabase-middleware";

export async function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;

  if (
    pathname.startsWith("/login") ||
    pathname.startsWith("/admin/login") ||
    pathname.startsWith("/api/auth")
  ) {
    return NextResponse.next();
  }

  // Protège /me, /me/* et /admin/*
  const isProtected =
    pathname === "/me" || pathname.startsWith("/me/") || pathname.startsWith("/admin");
  if (!isProtected) return NextResponse.next();

  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (token) return NextResponse.next(); // utilisateur authentifié via NextAuth

  const { supabase, response } = createSupabaseMiddlewareClient(req);
  const { data: { user } } = await supabase.auth.getUser();
  if (user) return response;

  const loginPath = pathname.startsWith("/admin") ? "/admin/login" : "/login";
  const url = new URL(loginPath, req.url);
  url.searchParams.set("redirect", pathname + search);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/me", "/me/:path*", "/admin/:path*"],
};

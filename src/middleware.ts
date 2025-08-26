import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createSupabaseMiddlewareClient } from "@/utils/supabase-middleware";

export async function middleware(request: NextRequest) {
  const { supabase, response } = createSupabaseMiddlewareClient(request);
  const { pathname, search } = request.nextUrl;

  if (pathname.startsWith("/admin/login")) {
    return response;
  }

  if (
    pathname.startsWith("/admin") ||
    pathname === "/me" ||
    pathname.startsWith("/me/")
  ) {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      const loginPath = pathname.startsWith("/admin") ? "/admin/login" : "/login";
      const loginUrl = new URL(loginPath, request.url);
      loginUrl.searchParams.set("redirect", pathname + search);
      return NextResponse.redirect(loginUrl);
    }
  }

  return response;
}

export const config = {
  matcher: ["/admin/:path*", "/me/:path*"],
};

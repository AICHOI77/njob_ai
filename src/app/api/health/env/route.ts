import { NextResponse } from "next/server";

export async function GET() {
  const defined = (v?: string) => Boolean(v && v.length > 0);
  return NextResponse.json({
    TOSS_SECRET_KEY: defined(process.env.TOSS_SECRET_KEY),
    SUPABASE_URL: defined(process.env.NEXT_PUBLIC_SUPABASE_URL),
    SUPABASE_SERVICE_ROLE_KEY: defined(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
    APP_BASE_URL: process.env.APP_BASE_URL || null,
    SUCCESS_URL: process.env.SUCCESS_URL || null,
    FAIL_URL: process.env.FAIL_URL || null,
    NEXT_PUBLIC_TOSS_CLIENT_KEY: process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY ? "present" : null,
  });
}

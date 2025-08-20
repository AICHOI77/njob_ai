import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!, key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const db = createClient(url, key, { auth: { persistSession: false } });
  const { data, error } = await db.from("orders").select("order_id, status").limit(5);
  if (error) return NextResponse.json({ ok:false, error: error.message }, { status: 500 });
  return NextResponse.json({ ok:true, sample: data });
}
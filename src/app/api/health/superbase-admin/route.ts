import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const hasUrl = !!url, hasKey = !!key;
  try {
    if (!hasUrl || !hasKey) return NextResponse.json({ ok:false, hasUrl, hasKey }, { status: 500 });
    const db = createClient(url!, key!, { auth: { persistSession: false } });
    const { data, error } = await db.from("orders").select("id").limit(1);
    if (error) return NextResponse.json({ ok:false, hasUrl, hasKey, dbError: error.message }, { status: 500 });
    return NextResponse.json({ ok:true, hasUrl, hasKey, sample: data?.length ?? 0 });
  } catch (e:any) {
    return NextResponse.json({ ok:false, hasUrl, hasKey, err: e?.message }, { status: 500 });
  }
}
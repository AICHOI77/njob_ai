// src/app/api/payments/toss/confirm/route.ts
import { NextResponse } from "next/server";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { AGENTS } from "@/lib/agents";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function createSupabaseAdmin(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("Missing Supabase env: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  }
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

async function confirmWithToss(paymentKey: string, orderId: string, amount: number) {
  const secretKey = process.env.TOSS_SECRET_KEY;
  if (!secretKey) throw new Error("Missing env TOSS_SECRET_KEY");
  const basicToken = Buffer.from(`${secretKey}:`).toString("base64");

  console.log("[toss/confirm] Calling Toss API confirm…", { paymentKey, orderId, amount });

  const res = await fetch("https://api.tosspayments.com/v1/payments/confirm", {
    method: "POST",
    headers: {
      Authorization: `Basic ${basicToken}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({ paymentKey, orderId, amount }),
    cache: "no-store",
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    console.error("[toss/confirm] Toss confirm failed", res.status, data);
    const error: any = new Error(data?.message || data?.error || `Toss confirm failed (HTTP ${res.status})`);
    error.status = res.status;
    error.toss = data;
    throw error;
  }

  console.log("[toss/confirm] Toss confirm success ✅", {
    orderId: data?.orderId,
    status: data?.status,
    amount: data?.totalAmount,
    currency: data?.currency,
  });
  return data;
}

async function ensureAccess(
  supabase: SupabaseClient,
  payload: { user_id: string; course_id: string; tenant_id: string }
): Promise<{ inserted: boolean; error?: string }> {
  const { data: existing, error: selErr } = await supabase
    .from("course_access")
    .select("id")
    .eq("user_id", payload.user_id)
    .eq("course_id", payload.course_id)
    .eq("tenant_id", payload.tenant_id)
    .limit(1);

  if (selErr) {
    console.error("[toss/confirm] ensureAccess select error:", selErr.message, payload);
    return { inserted: false, error: selErr.message };
  }
  if (existing && existing.length > 0) {
    console.log("[toss/confirm] Access already exists ✔️", payload);
    return { inserted: false };
  }

  const startAt = new Date();
  const endAt = new Date();
  endAt.setFullYear(endAt.getFullYear() + 10);

  const { error: insErr } = await supabase.from("course_access").insert({
    user_id: payload.user_id,
    course_id: payload.course_id,
    tenant_id: payload.tenant_id,
    start_at: startAt.toISOString(),
    end_at: endAt.toISOString(),
  });

  if (insErr) {
    console.error("[toss/confirm] ensureAccess insert error:", insErr.message, payload);
    return { inserted: false, error: insErr.message };
  }

  console.log("[toss/confirm] Access inserted ✅", payload);
  return { inserted: true };
}

async function grantAccessForOrder(
  supabase: SupabaseClient,
  order: { id: string; user_id: string; tenant_id: string | null; lecture_id?: number | null }
) {
  console.log("[toss/confirm] Resolving access for order", {
    id: order.id,
    user_id: order.user_id,
    lecture_id: order.lecture_id,
    tenant_id: order.tenant_id,
  });

  const { data: items, error: itemsErr } = await supabase
    .from("order_items")
    .select("course_id")
    .eq("order_id", order.id);

  if (itemsErr) console.error("[toss/confirm] order_items error:", itemsErr.message);
  console.log("[toss/confirm] order_items result:", items);

  let courseIds: string[] = (items ?? []).map((i: any) => i.course_id);

  if (courseIds.length === 0 && order.lecture_id != null) {
    const agent = AGENTS.find((a) => a.lectureId === Number(order.lecture_id));
    console.log("[toss/confirm] lectureId fallback", order.lecture_id, "-> agent", agent);
    if (agent?.courseId) courseIds = [agent.courseId];
  }

  if (courseIds.length === 0) {
    console.warn("[toss/confirm] No courseIds resolved for order", order.id);
    return { granted: 0, courseIds: [] as string[] };
  }

  let granted = 0;
  const tenant = order.tenant_id ?? "00000000-0000-0000-0000-000000000000";

  for (const course_id of courseIds) {
    const { inserted, error } = await ensureAccess(supabase, {
      user_id: order.user_id,
      course_id,
      tenant_id: tenant,
    });
    if (error) {
      console.error("[toss/confirm] ensureAccess failed:", error, { course_id });
    } else if (inserted) {
      granted += 1;
    }
  }

  return { granted, courseIds };
}

type ConfirmBody = { paymentKey?: string; orderId?: string; amount?: number };

export async function POST(req: Request) {
  try {
    const { paymentKey, orderId, amount }: ConfirmBody = await req.json().catch(() => ({} as ConfirmBody));
    console.log("[toss/confirm] Incoming body", { paymentKey, orderId, amount });

    if (!paymentKey || !orderId || typeof amount !== "number" || Number.isNaN(amount)) {
      return NextResponse.json(
        { ok: false, error: "Invalid body. Expect { paymentKey, orderId, amount }" },
        { status: 400 }
      );
    }

    const tossPayment = await confirmWithToss(paymentKey, orderId, amount);

    const supabase = createSupabaseAdmin();

    const { data: orderByExternal } = await supabase
      .from("orders")
      .select("*")
      .eq("order_id", orderId)
      .maybeSingle();

    let order = orderByExternal;
    if (!order) {
      const { data: orderById } = await supabase.from("orders").select("*").eq("id", orderId).maybeSingle();
      order = orderById || null;
    }

    if (!order) {
      console.error("[toss/confirm] ❌ Order not found", { orderId });
      return NextResponse.json({ ok: false, error: "Order not found in database." }, { status: 404 });
    }
    console.log("[toss/confirm] Found order", {
      id: order.id,
      order_id: order.order_id,
      user_id: order.user_id,
      lecture_id: order.lecture_id,
      tenant_id: order.tenant_id,
      amount_expected: order.amount_expected,
      currency: order.currency,
    });

    const expected = Number(order.amount_expected);
    if (!Number.isNaN(expected) && expected !== amount) {
      console.error("[toss/confirm] ❌ Amount mismatch", { expected, received: amount });
      return NextResponse.json(
        { ok: false, error: `Amount mismatch. expected=${expected}, received=${amount}` },
        { status: 409 }
      );
    }

    const { granted, courseIds } = await grantAccessForOrder(supabase, order);

    let forcedGrant = false;
    let forcedCourseId: string | null = null;

    if (granted === 0 && (order.lecture_id === 19 || order.order_id?.startsWith("ORD-19-"))) {
      forcedCourseId = "00000000-0000-0000-0000-00000000a1b2";
      console.log("[toss/confirm] Forcing grant for AI 사주", { forcedCourseId });

      const { inserted, error } = await ensureAccess(supabase, {
        user_id: order.user_id,
        course_id: forcedCourseId,
        tenant_id: order.tenant_id ?? "00000000-0000-0000-0000-000000000000",
      });

      if (error) {
        console.error("[toss/confirm] ❌ Forced grant failed", error);
      } else if (inserted) {
        forcedGrant = true;
        courseIds.push(forcedCourseId);
        console.log("[toss/confirm] ✅ Forced grant success", { forcedCourseId });
      } else {
        console.log("[toss/confirm] Forced grant skipped (already existed)");
        courseIds.push(forcedCourseId);
      }
    }

    const { error: updErr } = await supabase
      .from("orders")
      .update({
        status: "paid", // doit exister dans public.order_status
        paid_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        // on NE touche PAS à payment_key / payment_provider (colonnes absentes chez toi)
        // currency: on la laisse telle quelle
      })
      .eq("order_id", order.order_id);

    if (updErr) {
      console.error("[toss/confirm] ❌ orders update error:", updErr.message);
    } else {
      console.log("[toss/confirm] ✅ Order updated as paid", order.order_id);
    }

    // 6) Réponse
    return NextResponse.json(
      {
        ok: true,
        payment: tossPayment,
        access: { granted, courseIds, forcedGrant },
        order: {
          id: order.id,
          order_id: order.order_id,
          user_id: order.user_id,
          tenant_id: order.tenant_id,
          lecture_id: order.lecture_id,
          amount_expected: order.amount_expected,
        },
      },
      { status: 200 }
    );
  } catch (err: any) {
    const status = err?.status || 500;
    const payload: Record<string, any> = { ok: false, error: err?.message || "Unknown server error" };
    if (err?.toss) payload.toss = err.toss;
    console.error("[toss/confirm] ❌ Fatal error", payload);
    return NextResponse.json(payload, { status });
  }
}

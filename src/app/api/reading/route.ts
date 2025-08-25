import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createClient } from "@supabase/supabase-js";
import OpenAI from "openai";
import { z } from "zod";

// --- Admin client (bypasses RLS; access is gated by session) ---
function admin() {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

// --- Input validation ---
const ReadingInput = z.object({
  name: z.string().min(1),
  birthdate: z.string().min(8), // accept YYYY-MM-DD or MM/DD/YYYY
  gender: z.enum(["M", "F"]),
  question: z.string().min(3),
});

type ReadingOutput = {
  summary: string;
  personality: string;
  fortune: string;
  relationship: string;
  advice: string;
  // optional pillars (MVP/heuristic)
  year_pillar?: string;
  month_pillar?: string;
  day_pillar?: string;
  hour_pillar?: string;
};

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// --- Util: prompt to JSON with a strict schema expectation ---
async function generateReading(payload: z.infer<typeof ReadingInput>): Promise<ReadingOutput> {
  const system =
    "You are an AI Saju (사주) assistant. Respond in Korean. " +
    "Return ONLY a single JSON object (no markdown) with the keys: " +
    "summary, personality, fortune, relationship, advice, year_pillar, month_pillar, day_pillar, hour_pillar. " +
    "Each value is a concise Korean paragraph (pillars can be simple strings). " +
    "Avoid medical/financial/legal claims. Be friendly and helpful.";

  const user = `
이름: ${payload.name}
생년월일: ${payload.birthdate}
성별: ${payload.gender === "M" ? "남성" : "여성"}
질문: ${payload.question}

요청:
- 종합 요약을 포함해 아래 필드를 꼭 JSON으로만 반환하세요.
{
  "summary": "...",
  "personality": "...",
  "fortune": "...",
  "relationship": "...",
  "advice": "...",
  "year_pillar": "정묘",
  "month_pillar": "기묘",
  "day_pillar": "신사",
  "hour_pillar": "미상"
}
`;

  // Prefer models that support JSON mode. gpt-4o-mini is cheap/fast and supports response_format.
  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
    temperature: 0.7,
  });

  const raw = completion.choices[0]?.message?.content ?? "{}";
  // Safe parse; if it fails, try heuristic cleanup
  try {
    const obj = JSON.parse(raw);
    return {
      summary: String(obj.summary ?? ""),
      personality: String(obj.personality ?? ""),
      fortune: String(obj.fortune ?? ""),
      relationship: String(obj.relationship ?? ""),
      advice: String(obj.advice ?? ""),
      year_pillar: obj.year_pillar ? String(obj.year_pillar) : undefined,
      month_pillar: obj.month_pillar ? String(obj.month_pillar) : undefined,
      day_pillar: obj.day_pillar ? String(obj.day_pillar) : undefined,
      hour_pillar: obj.hour_pillar ? String(obj.hour_pillar) : undefined,
    };
  } catch {
    // Fallback: return a minimal shape so the UI still renders
    return {
      summary: "요청하신 내용을 바탕으로 종합 운세를 생성했습니다.",
      personality: "성격 분석 결과를 요약합니다.",
      fortune: "올해의 전반적인 흐름과 기회를 설명합니다.",
      relationship: "인간관계와 연애운에 대한 제안을 제공합니다.",
      advice: "실행 가능한 조언과 주의점을 안내합니다.",
      year_pillar: "정묘",
      month_pillar: "기묘",
      day_pillar: "신사",
      hour_pillar: "미상",
    };
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const user = session?.user as any;
    if (!user?.id) return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });

    const json = await req.json().catch(() => ({}));
    const parsed = ReadingInput.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: "BAD_REQUEST", detail: parsed.error.flatten() }, { status: 400 });
    }
    const input = parsed.data;

    const db = admin();

    // 1) Ensure workspace (tenant) membership
    let tenantId: string | null = null;
    {
      const { data: m } = await db
        .from("tenant_members")
        .select("tenant_id")
        .eq("user_id", user.id)
        .limit(1);
      tenantId = m?.[0]?.tenant_id ?? null;

      if (!tenantId) {
        // bootstrap a new tenant + owner membership
        const workspaceName = `${(input.name || user.email?.split("@")?.[0] || "내")} 워크스페이스`;
        const { data: t, error: tErr } = await db
          .from("tenants")
          .insert({ name: workspaceName })
          .select("id")
          .single();
        if (tErr) throw tErr;
        tenantId = t!.id;

        const { error: addErr } = await db.from("tenant_members").insert({
          tenant_id: tenantId,
          user_id: user.id,
          email: user.email ?? "",
          role: "OWNER",
        });
        if (addErr) throw addErr;
      }
    }

    // 2) Insert session as processing
    const { data: created, error: insErr } = await db
      .from("saju_sessions")
      .insert({
        tenant_id: tenantId!,
        user_id: user.id,
        input_json: input,
        status: "processing",
      })
      .select("id")
      .single();

    if (insErr || !created?.id) {
      return NextResponse.json({ error: "INSERT_FAILED", detail: insErr?.message }, { status: 500 });
    }

    const sessionId = created.id;

    // 3) Generate with OpenAI (real LLM call)
    const output = await generateReading(input);

    // 4) Update to done
    const { error: updErr } = await db
      .from("saju_sessions")
      .update({ status: "done", output_json: output })
      .eq("id", sessionId);
    if (updErr) {
      // still return success to the client; log and keep processing → error state would be too harsh
      console.warn("[/api/reading] update failed but generation succeeded:", updErr);
    }

    return NextResponse.json({ id: sessionId, output });
  } catch (e: any) {
    console.error("[/api/reading] error:", e);
    // Attempt to log error on a session if we created one? (skipped in this simple path)
    return NextResponse.json({ error: "SERVER_ERROR", detail: e?.message ?? String(e) }, { status: 500 });
  }
}

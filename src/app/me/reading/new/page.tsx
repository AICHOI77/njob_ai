"use client";

import { useState } from "react";
import { Star, Loader2 } from "lucide-react";

type FormState = {
  name: string;
  birthdate: string;
  gender: "M" | "F" | "";
  question: string;
};

export default function NewReadingPage() {
  const [form, setForm] = useState<FormState>({
    name: "",
    birthdate: "",
    gender: "",
    question: "",
  });
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const canSubmit =
    form.name.trim() !== "" &&
    form.birthdate.trim() !== "" &&
    (form.gender === "M" || form.gender === "F") &&
    form.question.trim().length >= 5;

  function toIsoDate(input: string) {
    if (/^\d{4}-\d{2}-\d{2}$/.test(input)) return input;
    const m = input.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (!m) return input;
    const [_, mm, dd, yyyy] = m;
    const MM = mm.padStart(2, "0");
    const DD = dd.padStart(2, "0");
    return `${yyyy}-${MM}-${DD}`;
  }

async function handleSubmit() {
  setErrorMsg(null);
  setLoading(true);
  setResult(null);
  try {
    const payload = {
      name: form.name.trim(),
      birthdate: toIsoDate(form.birthdate.trim()),
      gender: (form.gender || "M") as "M" | "F",
      question: form.question.trim(),
    };
    const r = await fetch("/api/me/reading", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const j = await r.json().catch(() => ({}));

    if (!r.ok) {
      if (r.status === 403 && j?.error === "NO_TENANT") {
        setErrorMsg(
          "워크스페이스가 아직 없습니다. 로그아웃 후 다시 로그인하여 워크스페이스를 생성해주세요."
        );
      } else if (r.status === 400) {
        setErrorMsg("입력값을 확인해주세요. (이름/생년월일/성별/질문)");
      } else {
        setErrorMsg(
          j?.detail ||
            "요청 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요."
        );
      }
      return;
    }

    setResult(j);
  } catch (e) {
    setErrorMsg("네트워크 오류가 발생했습니다.");
  } finally {
    setLoading(false);
  }
}


  return (
    <div className="min-h-screen bg-[#141414] text-white">
      <div className="max-w-3xl mx-auto px-4 md:px-6 py-10">
        {/* Header */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-[#E50914] flex items-center justify-center mb-3 shadow-md">
            <Star className="w-6 h-6" />
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold">AI 사주 읽기</h1>
          <p className="text-neutral-400 mt-2 text-center">
            당신의 운명을 AI가 분석해드립니다
          </p>
        </div>

        {/* Card */}
        <div className="bg-[#1a1a1a] border border-neutral-800 rounded-2xl p-4 md:p-6">
          <div className="text-lg font-semibold mb-4">정보 입력</div>

          <div className="space-y-4">
            {/* 이름 */}
            <div className="space-y-2">
              <label className="text-sm text-neutral-300">이름</label>
              <input
                className="w-full bg-black/40 border border-neutral-700 rounded-xl h-11 px-3 outline-none focus:border-neutral-500"
                placeholder="성함을 입력해주세요"
                value={form.name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, name: e.target.value }))
                }
              />
            </div>

            {/* 생년월일 */}
            <div className="space-y-2">
              <label className="text-sm text-neutral-300">생년월일</label>
              <input
                className="w-full bg-black/40 border border-neutral-700 rounded-xl h-11 px-3 outline-none focus:border-neutral-500"
                placeholder="mm/dd/yyyy"
                inputMode="numeric"
                value={form.birthdate}
                onChange={(e) =>
                  setForm((f) => ({ ...f, birthdate: e.target.value }))
                }
              />
            </div>

            {/* 성별 */}
            <div className="space-y-2">
              <label className="text-sm text-neutral-300">성별</label>
              <select
                className="w-full bg-black/40 border border-neutral-700 rounded-xl h-11 px-3 outline-none focus:border-neutral-500"
                value={form.gender}
                onChange={(e) =>
                  setForm((f) => ({ ...f, gender: e.target.value as any }))
                }
              >
                <option value="" disabled>
                  성별을 선택해주세요
                </option>
                <option value="M">남성</option>
                <option value="F">여성</option>
              </select>
            </div>

            {/* 궁금한 점 */}
            <div className="space-y-2">
              <label className="text-sm text-neutral-300">궁금한 점</label>
              <textarea
                className="w-full bg-black/40 border border-neutral-700 rounded-xl min-h-[120px] p-3 outline-none focus:border-neutral-500"
                placeholder="어떤 것이 궁금하신가요? (예: 올해 운세, 연애운, 취업운 등)"
                value={form.question}
                onChange={(e) =>
                  setForm((f) => ({ ...f, question: e.target.value }))
                }
              />
            </div>

            {/* Error */}
            {errorMsg && (
              <div className="text-sm text-rose-400">{errorMsg}</div>
            )}

            {/* Submit */}
            <button
              onClick={handleSubmit}
              disabled={loading || !canSubmit}
              className="mt-2 w-full inline-flex items-center justify-center gap-2 rounded-xl h-12 font-semibold border border-red-700 bg-[#E50914] hover:brightness-110 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  생성 중...
                </>
              ) : (
                <>
                  <Star className="w-5 h-5" />
                  사주 읽기 시작
                </>
              )}
            </button>
          </div>
        </div>

        {/* Result */}
        {result?.output && (
          <div className="mt-8 bg-[#1a1a1a] border border-neutral-800 rounded-2xl p-4 md:p-6 space-y-3">
            <h2 className="text-xl font-bold">결과</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {Object.entries(result.output).map(([k, v]) => (
                <div
                  key={k}
                  className="rounded-xl border border-neutral-800 bg-black/30 p-3"
                >
                  <div className="text-xs text-neutral-400 mb-1">{k}</div>
                  <div className="text-sm">{String(v)}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

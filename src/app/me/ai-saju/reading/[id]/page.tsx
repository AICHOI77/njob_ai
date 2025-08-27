"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Calendar, Clock, MessageSquare, Star } from "lucide-react";

type SessionRow = {
  id: string;
  created_at: string;
  status: "created" | "processing" | "done" | "error";
  input_json: { name?: string; birthdate?: string; gender?: "M" | "F"; question?: string };
  output_json?: {
    summary?: string;
    personality?: string;
    fortune?: string;
    relationship?: string;
    advice?: string;
    year_pillar?: string;
    month_pillar?: string;
    day_pillar?: string;
    hour_pillar?: string;
  };
};

export default function ReadingDetailPage() {
  const routeParams = useParams();
  const id = Array.isArray(routeParams?.id) ? routeParams.id[0] : (routeParams?.id as string | undefined);

  const [row, setRow] = useState<SessionRow | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const r = await fetch(`/api/sessions/${id}`, { cache: "no-store" });
        const j = await r.json();
        setRow(r.ok ? j : null);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading) {
    return <div className="min-h-screen bg-[#141414] text-white p-6">불러오는 중…</div>;
  }

  if (!row) {
    return (
      <div className="min-h-screen bg-[#141414] text-white p-6">
        <Link href="/me" className="inline-flex items-center gap-2 text-neutral-300 mb-6">
          <ArrowLeft className="w-4 h-4" /> 대시보드로 돌아가기
        </Link>
        <div className="text-neutral-300">세션을 찾을 수 없습니다.</div>
      </div>
    );
  }

  const name = row.input_json?.name ?? "-";
  const birth = row.input_json?.birthdate ?? "-";
  const genderLabel = row.input_json?.gender === "M" ? "남성" : row.input_json?.gender === "F" ? "여성" : "-";
  const question = row.input_json?.question ?? "-";
  const createdAt = new Date(row.created_at).toLocaleString();

  const out = row.output_json ?? {};
  const year = out.year_pillar ?? "정묘";
  const month = out.month_pillar ?? "기묘";
  const day = out.day_pillar ?? "신사";
  const hour = out.hour_pillar ?? "미상";

  return (
    <div className="min-h-screen bg-[#141414] text-white">
      <div className="max-w-5xl mx-auto px-4 md:px-6 py-8">
        <Link href="/me" className="inline-flex items-center gap-2 text-neutral-300 mb-6">
          <ArrowLeft className="w-4 h-4" /> 대시보드로 돌아가기
        </Link>

        <h1 className="text-3xl md:text-4xl font-extrabold mb-2">{name}님의 사주 세션</h1>
        <div className="flex flex-wrap items-center gap-4 text-neutral-400 mb-6">
          <div className="inline-flex items-center gap-1">
            <Calendar className="w-4 h-4" />
            <span>{formatKoreanDate(birth)}</span>
          </div>
          <div className="inline-flex items-center gap-1">
            <Clock className="w-4 h-4" />
            <span>{createdAt}</span>
          </div>
          <StatusBadge status={row.status} />
        </div>

        {/* 요청 정보 */}
        <section className="bg-[#1a1a1a] border border-neutral-800 rounded-2xl p-4 md:p-6 mb-6">
          <div className="text-lg font-semibold mb-4 flex items-center gap-2">
            <MessageSquare className="w-5 h-5" /> 요청 정보
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <InfoRow label="이름" value={name} />
            <InfoRow label="성별" value={genderLabel} />
          </div>
          <div className="mt-4">
            <div className="text-sm text-neutral-300 mb-2">질문</div>
            <div className="bg-black/40 border border-neutral-800 rounded-xl px-3 py-2">{question}</div>
          </div>
        </section>

        {/* 종합 운세 */}
        <section className="bg-[#1a1a1a] border border-neutral-800 rounded-2xl p-4 md:p-6 mb-6">
          <div className="text-lg font-semibold mb-3 flex items-center gap-2 text-rose-400">
            <Star className="w-5 h-5" /> 종합 운세
          </div>
          <p className="leading-7 text-neutral-200">{out.summary ?? "요약 정보가 없습니다."}</p>
        </section>

        {/* 4 cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <CardBlock title="성격 분석" text={out.personality ?? "내용 없음"} />
          <CardBlock title="운세" text={out.fortune ?? "내용 없음"} />
          <CardBlock title="인간관계 & 연애운" text={out.relationship ?? "내용 없음"} />
          <CardBlock title="조언 & 개선방향" text={out.advice ?? "내용 없음"} />
        </div>

        {/* 사주 정보 */}
        <section className="bg-[#1a1a1a] border border-neutral-800 rounded-2xl p-4 md:p-6">
          <div className="text-lg font-semibold mb-4">사주 정보</div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Pillar label="년주" value={year} />
            <Pillar label="월주" value={month} />
            <Pillar label="일주" value={day} />
            <Pillar label="시주" value={hour} />
          </div>
        </section>
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value?: string }) {
  return (
    <div className="space-y-1">
      <div className="text-sm text-neutral-400">{label}</div>
      <div className="font-medium">{value ?? "-"}</div>
    </div>
  );
}

function CardBlock({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-2xl bg-[#1a1a1a] border border-neutral-800 p-4">
      <div className="font-semibold mb-2">{title}</div>
      <p className="text-neutral-300 leading-7">{text}</p>
    </div>
  );
}

function Pillar({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-[#1a1a1a] border border-neutral-800 p-4">
      <div className="text-sm text-neutral-400 mb-1">{label}</div>
      <div className="text-lg font-semibold">{value}</div>
    </div>
  );
}

function StatusBadge({ status }: { status: "created"|"processing"|"done"|"error" }) {
  const map: Record<string, string> = {
    created: "bg-neutral-800 text-neutral-200",
    processing: "bg-amber-500/20 text-amber-400",
    done: "bg-emerald-500/20 text-emerald-400",
    error: "bg-rose-500/20 text-rose-400",
  };
  const label =
    status === "done" ? "완료" :
    status === "processing" ? "처리중" :
    status === "created" ? "생성됨" : "오류";

  return (
    <span className={`text-xs px-2 py-1 rounded-lg border border-neutral-700 ${map[status]}`}>
      {label}
    </span>
  );
}

function formatKoreanDate(isoOrMdY: string) {
  if (!isoOrMdY) return "-";
  const mdy = isoOrMdY.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  let d: Date;
  if (mdy) d = new Date(`${mdy[3]}-${mdy[1].padStart(2,"0")}-${mdy[2].padStart(2,"0")}T00:00:00Z`);
  else d = new Date(isoOrMdY);
  if (Number.isNaN(d.getTime())) return isoOrMdY;
  return `${d.getFullYear()}년 ${String(d.getMonth()+1).padStart(2,"0")}월 ${String(d.getDate()).padStart(2,"0")}일`;
}

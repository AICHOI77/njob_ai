"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Plus, Search, Filter as FilterIcon, MessageCircle, User as UserIcon, Eye, ChevronDown
} from "lucide-react";

type Row = {
  id: string;
  created_at: string;
  status: "created" | "processing" | "done" | "error";
  input_json: { name?: string; birthdate?: string; gender?: "M" | "F"; question?: string };
  output_json?: any;
};

type ApiResp = {
  data: Row[];
  totalCount: number;
  page: number;
  pageSize: number;
  kpi: { todaySessions: number; totalSessions: number; completed: number; processing: number };
};

const STATUS_OPTIONS: Array<{ value: "" | Row["status"]; label: string }> = [
  { value: "", label: "모든 상태" },
  { value: "done", label: "완료" },
  { value: "processing", label: "처리중" },
  { value: "created", label: "생성됨" },
  { value: "error", label: "오류" },
];

export default function SessionsPage() {
  const [raw, setRaw] = useState<ApiResp | null>(null);
  const [loading, setLoading] = useState(true);

  // UI filters
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"" | Row["status"]>("");

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const r = await fetch(`/api/sessions?page=1&pageSize=200`, { cache: "no-store" });
        const j = await r.json();
        setRaw(j);
      } catch (e) {
        console.error(e);
        setRaw({ data: [], totalCount: 0, page: 1, pageSize: 200, kpi: { todaySessions: 0, totalSessions: 0, completed: 0, processing: 0 } });
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = useMemo(() => {
    let list = raw?.data ?? [];
    if (status) list = list.filter((r) => r.status === status);
    const q = query.trim().toLowerCase();
    if (q) {
      list = list.filter((r) => {
        const name = (r.input_json?.name ?? "").toLowerCase();
        const question = (r.input_json?.question ?? "").toLowerCase();
        return name.includes(q) || question.includes(q);
      });
    }
    return list;
  }, [raw, query, status]);

  return (
    <div className="min-h-screen bg-[#141414] text-white">
      <div className="max-w-6xl mx-auto p-4 md:p-8">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold">세션 관리</h1>
            <p className="text-neutral-400 mt-2">모든 사주 읽기 세션을 관리하고 확인하세요.</p>
          </div>
          <Link
            href="/reading/new"
            className="inline-flex items-center gap-2 rounded-xl bg-[#E50914] border border-red-700 px-4 py-2 font-semibold hover:brightness-110"
          >
            <Plus className="w-4 h-4" /> 새 사주 읽기
          </Link>
        </div>

        {/* Filters */}
        <div className="bg-[#1a1a1a] border border-neutral-800 rounded-2xl p-4 md:p-5 mb-6">
          <div className="flex items-center gap-2 text-neutral-300 mb-3">
            <FilterIcon className="w-4 h-4" />
            <span className="font-semibold">필터 및 검색</span>
          </div>

          <div className="flex flex-col md:flex-row gap-3">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full h-11 pl-9 pr-3 rounded-xl bg-black/40 border border-neutral-700 outline-none focus:border-neutral-500"
                placeholder="이름이나 질문으로 검색…"
              />
            </div>

            {/* Status */}
            <div className="w-full md:w-52 relative">
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="appearance-none w-full h-11 rounded-xl bg-black/40 border border-neutral-700 pl-3 pr-9 outline-none focus:border-neutral-500"
              >
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value || "all"} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Count */}
        <div className="text-neutral-400 mb-3">총 {filtered.length}개의 세션</div>

        {/* Table */}
        <div className="bg-[#1a1a1a] rounded-2xl border border-neutral-800 overflow-hidden">
          <div className="px-4 py-3 border-b border-neutral-800 text-lg font-semibold">사주 세션 목록</div>

          {loading ? (
            <div className="p-6 text-neutral-300">불러오는 중…</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="text-neutral-400">
                  <tr className="[&>th]:text-left [&>th]:px-4 [&>th]:py-3">
                    <th>이름</th>
                    <th>생년월일</th>
                    <th className="min-w-[320px]">질문</th>
                    <th>상태</th>
                    <th>생성일</th>
                    <th className="text-right pr-6">동작</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800">
                  {filtered.map((row) => (
                    <tr key={row.id} className="[&>td]:px-4 [&>td]:py-3 hover:bg-black/30 transition">
                      <td className="font-medium flex items-center gap-2">
                        <UserIcon className="w-4 h-4 text-neutral-400" />
                        <span>{row.input_json?.name ?? "-"}</span>
                      </td>
                      <td className="text-neutral-300">{fmtBirth(row.input_json?.birthdate)}</td>
                      <td className="text-neutral-200 truncate flex items-center gap-2">
                        <MessageCircle className="w-4 h-4 text-neutral-400 shrink-0" />
                        <span className="truncate">{row.input_json?.question ?? "-"}</span>
                      </td>
                      <td><StatusBadge status={row.status} /></td>
                      <td className="text-neutral-400">{new Date(row.created_at).toLocaleString()}</td>
                      <td className="text-right pr-6">
                        <Link
                          href={`/reading/${row.id}`}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded-lg border border-neutral-700 hover:bg-neutral-800"
                        >
                          <Eye className="w-4 h-4" /> 보기
                        </Link>
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-4 py-10 text-center text-neutral-400">
                        아직 세션이 없습니다.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: "created" | "processing" | "done" | "error" }) {
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

function fmtBirth(b?: string) {
  if (!b) return "-";
  // support "YYYY-MM-DD" or "MM/DD/YYYY" -> "YYYY.MM.DD"
  const mdy = b.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (mdy) {
    const yyyy = mdy[3];
    const mm = mdy[1].padStart(2, "0");
    const dd = mdy[2].padStart(2, "0");
    return `${yyyy}.${mm}.${dd}`;
  }
  const d = new Date(b);
  if (Number.isNaN(d.getTime())) return b;
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}.${mm}.${dd}`;
}

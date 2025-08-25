"use client";

import { useEffect, useState } from "react";
import { Loader2, Star, FileText, TrendingUp, User as UserIcon, Eye } from "lucide-react";

type Row = {
  id: string;
  created_at: string;
  status: string;
  input_json: { name: string; birthdate: string; gender?: "M"|"F"; question: string; };
  output_json?: any;
};

type ApiResp = {
  data: Row[];
  kpi: { todaySessions: number; totalSessions: number; completed: number; processing: number; };
  totalCount: number; page: number; pageSize: number;
};

export default function Dashboard() {
  const [resp, setResp] = useState<ApiResp | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const r = await fetch("/api/sessions", { cache: "no-store" });
      const j = await r.json();
      setResp(j);
      setLoading(false);
    })();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#141414] text-white">
        <div className="max-w-6xl mx-auto p-4 md:p-8">
          <h1 className="text-3xl font-bold mb-6">대시보드</h1>
          <div className="flex items-center gap-2 text-neutral-300">
            <Loader2 className="animate-spin w-5 h-5" /> 불러오는 중...
          </div>
        </div>
      </div>
    );
  }

  const kpi = resp?.kpi ?? { todaySessions: 0, totalSessions: 0, completed: 0, processing: 0 };

  return (
    <div className="min-h-screen bg-[#141414] text-white">
      <div className="max-w-6xl mx-auto p-4 md:p-8">
        <h1 className="text-3xl md:text-4xl font-extrabold mb-2">대시보드</h1>
        <p className="text-neutral-400 mb-8">AI 사주 에이전트 관리 현황</p>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <KPICard icon={<Star className="w-5 h-5" />} title="오늘 세션" value={kpi.todaySessions} subtitle="Today" />
          <KPICard icon={<FileText className="w-5 h-5" />} title="전체 세션" value={kpi.totalSessions} subtitle="Total Sessions" />
          <KPICard icon={<TrendingUp className="w-5 h-5" />} title="완료된 읽기" value={kpi.completed} subtitle="Completed" accent="success" />
          <KPICard icon={<UserIcon className="w-5 h-5" />} title="처리중" value={kpi.processing} subtitle="Processing" accent="warning" />
        </div>

        {/* Table */}
        <div className="bg-[#1a1a1a] rounded-2xl border border-neutral-800 overflow-hidden">
          <div className="px-4 py-3 border-b border-neutral-800 text-lg font-semibold">최근 사주 세션</div>
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
                {(resp?.data ?? []).map((row) => (
                  <tr key={row.id} className="[&>td]:px-4 [&>td]:py-3 hover:bg-black/30 transition">
                    <td className="font-medium">{row.input_json?.name ?? "-"}</td>
                    <td className="text-neutral-300">{row.input_json?.birthdate ?? "-"}</td>
                    <td className="text-neutral-200 truncate">{row.input_json?.question ?? "-"}</td>
                    <td>{<StatusBadge status={row.status as any} />}</td>
                    <td className="text-neutral-400">{new Date(row.created_at).toLocaleString()}</td>
                    <td className="text-right pr-6">
                      <a
                        href={`/me/reading/${row.id}`}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-lg border border-neutral-700 hover:bg-neutral-800"
                      >
                        <Eye className="w-4 h-4" /> 보기
                      </a>
                    </td>
                  </tr>
                ))}
                {resp?.data?.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-neutral-400">
                      아직 세션이 없습니다.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}

function KPICard({
  icon, title, value, subtitle, accent,
}: { icon: React.ReactNode; title: string; value: number | string; subtitle?: string; accent?: "success"|"warning"; }) {
  const chip =
    accent === "success" ? "text-emerald-400" :
    accent === "warning" ? "text-amber-400" : "text-neutral-400";
  return (
    <div className="rounded-2xl bg-[#1a1a1a] border border-neutral-800 p-4">
      <div className="flex items-center justify-between">
        <div className="w-9 h-9 rounded-xl bg-black/50 border border-neutral-800 flex items-center justify-center">{icon}</div>
        <div className={`text-xs ${chip}`}>{subtitle}</div>
      </div>
      <div className="mt-3 text-neutral-400 text-sm">{title}</div>
      <div className="text-3xl font-bold mt-1">{value}</div>
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
  return (
    <span className={`text-xs px-2 py-1 rounded-lg border border-neutral-700 ${map[status]}`}>
      {status === "done" ? "완료" : status === "processing" ? "처리중" : status === "created" ? "생성됨" : "오류"}
    </span>
  );
}

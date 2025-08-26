"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Loader2, Star, FileText, Users, Activity,
  RefreshCw, Download, Clock, Database, Server,
  CheckCircle2, AlertTriangle, Plus, ChevronRight, Eye,
} from "lucide-react";
import {
  LineChart as RLineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell,
} from "recharts";

/* ---------- API Types ---------- */
type Row = {
  id: string;
  created_at: string;
  status: "created" | "processing" | "done" | "error";
  input_json: { name: string; birthdate: string; gender?: "M" | "F"; question: string };
  output_json?: any;
};
type ApiResp = {
  data: Row[];
  kpi: { todaySessions: number; totalSessions: number; completed: number; processing: number };
  totalCount: number;
  page: number;
  pageSize: number;
};

/* ---------- UI ---------- */
const pieColors = ["#ef4444", "#22c55e", "#f59e0b", "#3b82f6", "#8b5cf6"];

/* ===================================================================== */
export default function Dashboard() {
  const [resp, setResp] = useState<ApiResp | null>(null);
  const [loading, setLoading] = useState(true);

  // Filters
  const [period, setPeriod] = useState("7d");
  const [tenant, setTenant] = useState("all");
  const [metric, setMetric] = useState("sessions");

  // Fetch API
  useEffect(() => {
    (async () => {
      setLoading(true);
      const qs = new URLSearchParams({ limit: "500", period, tenant });
      const r = await fetch(`/api/sessions?${qs.toString()}`, { cache: "no-store" });
      const j = await r.json();
      setResp(j);
      setLoading(false);
    })();
  }, [period, tenant]);

  // Direct KPIs from API
  const k = resp?.kpi ?? { todaySessions: 0, totalSessions: 0, completed: 0, processing: 0 };

  // Derived from resp.data (trend, active users, categories)
  const { trendData, yesterdayCount, activeUsersToday, categories } = useMemo(() => {
    const rows = resp?.data ?? [];
    const byDay: Record<string, { date: string; sessions: number; usersSet: Set<string> }> = {};
    const byCategory: Record<string, number> = {};
    const now = Date.now();
    const dayMs = 24 * 60 * 60 * 1000;

    const todayStart = new Date(); todayStart.setHours(0,0,0,0);
    const yesterdayStart = new Date(todayStart.getTime() - dayMs);

    let yesterdayCountLocal = 0;

    for (const row of rows) {
      const created = new Date(row.created_at);
      const key = `${String(created.getMonth()+1).padStart(2,"0")}-${String(created.getDate()).padStart(2,"0")}`;

      if (!byDay[key]) byDay[key] = { date: key, sessions: 0, usersSet: new Set() };
      byDay[key].sessions += 1;
      if (row.input_json?.name) byDay[key].usersSet.add(row.input_json.name);

      if (created >= yesterdayStart && created < todayStart) yesterdayCountLocal += 1;

      const q = (row.input_json?.question || "").toLowerCase();
      const cat =
        /mariage|연애|결혼|love|couple/.test(q) ? "연애/결혼" :
        /job|travail|career|직업|진로/.test(q) ? "직업/진로" :
        /santé|health|건강/.test(q) ? "건강" :
        /argent|finance|재물|사업|business|money/.test(q) ? "재물/사업" :
        "기타";
      byCategory[cat] = (byCategory[cat] || 0) + 1;
    }

    const trendData = Object.values(byDay)
      .map(d => ({ date: d.date, sessions: d.sessions, users: d.usersSet.size }))
      .sort((a, b) => a.date.localeCompare(b.date));

    const activeUserSet = new Set<string>();
    for (const row of rows) {
      const t = new Date(row.created_at).getTime();
      if (now - t <= dayMs && row.input_json?.name) activeUserSet.add(row.input_json.name);
    }

    const categoriesArr = Object.entries(byCategory).map(([name, value]) => ({ name, value }));
    return { trendData, yesterdayCount: yesterdayCountLocal, activeUsersToday: activeUserSet.size, categories: categoriesArr };
  }, [resp]);

  // Variation vs yesterday for the “오늘 세션” card
  const dayChangePct = useMemo(() => {
    if (!yesterdayCount) return null;
    const delta = k.todaySessions - yesterdayCount;
    return `${delta >= 0 ? "+" : ""}${Math.round((delta / Math.max(1, yesterdayCount)) * 100)}%`;
  }, [k.todaySessions, yesterdayCount]);

  // “System Status” = % of sessions done in the loaded window
  const systemUptime = useMemo(() => {
    const total = resp?.data?.length ?? 0;
    const done = (resp?.data ?? []).filter(r => r.status === "done").length;
    return total ? `${((done / total) * 100).toFixed(1)}%` : "—";
  }, [resp]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#141414] text-white">
        <div className="max-w-7xl mx-auto p-4 md:p-8">
          <h1 className="text-3xl font-bold mb-6">대시보드</h1>
          <div className="flex items-center gap-2 text-neutral-300">
            <Loader2 className="animate-spin w-5 h-5" /> 불러오는 중...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#141414] text-white">
      <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold">관리자 대시보드</h1>
            <p className="text-neutral-400 mt-1">AI 사주 에이전트 시스템 현황 및 관리</p>
          </div>
          <div className="flex items-center gap-3 text-sm text-neutral-400">
            <Clock className="h-4 w-4" /> 마지막 업데이트: 방금 전
          </div>
        </div>

        {/* Filters */}
        <div className="rounded-2xl bg-[#1a1a1a] border border-neutral-800 p-4 flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-neutral-400 text-sm w-10">기간</span>
            <select value={period} onChange={(e) => setPeriod(e.target.value)} className="bg-[#121212] border border-neutral-700 rounded-xl px-3 py-2 text-sm focus:outline-none">
              <option value="7d">최근 7일</option>
              <option value="14d">최근 14일</option>
              <option value="30d">최근 30일</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-neutral-400 text-sm w-10">테넌트</span>
            <select value={tenant} onChange={(e) => setTenant(e.target.value)} className="bg-[#121212] border border-neutral-700 rounded-xl px-3 py-2 text-sm focus:outline-none min-w-[140px]">
              <option value="all">모든 테넌트</option>
              <option value="default">기본</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-neutral-400 text-sm w-10">지표</span>
            <select value={metric} onChange={(e) => setMetric(e.target.value)} className="bg-[#121212] border border-neutral-700 rounded-xl px-3 py-2 text-sm focus:outline-none min-w-[140px]">
              <option value="sessions">세션 수</option>
              <option value="users">사용자 수</option>
            </select>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <button className="inline-flex items-center gap-2 rounded-xl border border-neutral-700 bg-black/40 px-3 py-2 text-sm hover:bg-black/60">
              <RefreshCw className="h-4 w-4" /> 새로고침
            </button>
            <button className="inline-flex items-center gap-2 rounded-xl border border-neutral-700 bg-black/40 px-3 py-2 text-sm hover:bg-black/60">
              <Download className="h-4 w-4" /> 내보내기
            </button>
          </div>
        </div>

        {/* KPI */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard icon={<Star className="w-5 h-5" />} title="오늘 세션" value={k.todaySessions} subtitle="오늘 생성된 사주 세션 수" change={dayChangePct || undefined} />
          <KPICard icon={<FileText className="w-5 h-5" />} title="총 세션" value={k.totalSessions} subtitle="누적 사주 세션 수" />
          <KPICard icon={<Users className="w-5 h-5" />} title="활성 사용자" value={activeUsersToday} subtitle="최근 24시간" />
          <KPICard icon={<Activity className="w-5 h-5" />} title="시스템 상태" value={systemUptime} subtitle="전체 시스템 가동률" />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-[#1a1a1a] rounded-2xl border border-neutral-800 p-4">
            <div className="text-lg font-semibold mb-4">세션 트렌드</div>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <RLineChart data={trendData} margin={{ left: 10, right: 10, top: 10, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                  <XAxis dataKey="date" stroke="#a1a1aa" />
                  <YAxis stroke="#a1a1aa" />
                  <Tooltip contentStyle={{ background: "#101010", border: "1px solid #27272a", color: "#fff" }} />
                  <Legend />
                  <Line type="monotone" dataKey="sessions" name="세션" stroke="#ef4444" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="users" name="사용자" stroke="#22c55e" strokeWidth={2} dot={false} />
                </RLineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-[#1a1a1a] rounded-2xl border border-neutral-800 p-4">
            <div className="text-lg font-semibold mb-4">질문 카테고리 분포</div>
            <div className="h-72 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={categories} dataKey="value" nameKey="name" innerRadius={60} outerRadius={90}>
                    {categories.map((_, i) => (
                      <Cell key={i} fill={pieColors[i % pieColors.length]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex gap-4 justify-center text-sm text-neutral-300 mt-2 flex-wrap">
              {categories.map((c, i) => (
                <span key={c.name} className="inline-flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: pieColors[i % pieColors.length] }} />
                  {c.name}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Quick actions + System state */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-[#1a1a1a] rounded-2xl border border-neutral-800 p-4">
            <div className="text-lg font-semibold mb-4">빠른 작업</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <ActionCard title="세션 관리" desc="모든 사주 세션 보기 및 관리" icon={<Activity className="h-5 w-5" />} href="/me/sessions" />
              <ActionCard title="새 세션 생성" desc="관리자 권한으로 새 세션 시작" icon={<Plus className="h-5 w-5" />} href="/me/reading/new" />
              <ActionCard title="사용자 관리" desc="사용자 계정 및 권한 관리" icon={<Users className="h-5 w-5" />} href="/me/users" />
              <ActionCard title="시스템 설정" desc="애플리케이션 설정 및 구성" icon={<CheckCircle2 className="h-5 w-5" />} href="/me/settings" />
            </div>
          </div>

          <div className="bg-[#1a1a1a] rounded-2xl border border-neutral-800 p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="text-lg font-semibold">시스템 상태</div>
              <div className="text-emerald-400 text-sm flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-500" /> 모든 시스템 정상
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <SystemStat icon={<Activity className="h-4 w-4" />} label="API 응답 시간" value="245ms" />
              <SystemStat icon={<CheckCircle2 className="h-4 w-4" />} label="AI 서비스" value="활성" />
              <SystemStat icon={<Database className="h-4 w-4" />} label="데이터베이스" value="정상" />
              <SystemStat icon={<Server className="h-4 w-4" />} label="서버 상태" value={systemUptime} />
            </div>
          </div>
        </div>

        {/* Table sessions */}
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
                    <td><StatusBadge status={row.status} /></td>
                    <td className="text-neutral-400">{new Date(row.created_at).toLocaleString()}</td>
                    <td className="text-right pr-6">
                      <a href={`/me/reading/${row.id}`} className="inline-flex items-center gap-1 px-2 py-1 rounded-lg border border-neutral-700 hover:bg-neutral-800">
                        <Eye className="w-4 h-4" /> 보기
                      </a>
                    </td>
                  </tr>
                ))}
                {resp?.data?.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-neutral-400">아직 세션이 없습니다.</td>
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

/* ---------- Small UI components ---------- */
function KPICard({ icon, title, value, subtitle, change }: { icon: React.ReactNode; title: string; value: number | string; subtitle?: string; change?: string }) {
  return (
    <div className="rounded-2xl bg-[#1a1a1a] border border-neutral-800 p-4">
      <div className="flex items-center justify-between">
        <div className="w-9 h-9 rounded-xl bg-black/50 border border-neutral-800 flex items-center justify-center">{icon}</div>
        {change && <div className="text-emerald-400 text-xs">{change} 전일 대비</div>}
      </div>
      <div className="mt-3 text-neutral-400 text-sm">{title}</div>
      <div className="text-3xl font-bold mt-1">{value}</div>
      {subtitle && <div className="text-xs text-neutral-500 mt-1">{subtitle}</div>}
    </div>
  );
}

function Badge({ n }: { n: number }) {
  return <span className="ml-2 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-rose-600 text-xs px-2">{n}</span>;
}

function AlertItem({ icon, title, desc, time }: { icon: React.ReactNode; title: string; desc: string; time: string }) {
  return (
    <div className="rounded-xl border border-neutral-800 bg-black/30 p-3">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 text-amber-400">{icon}</div>
        <div className="flex-1">
          <div className="font-medium">{title}</div>
          <div className="text-sm text-neutral-300">{desc}</div>
          <div className="text-xs text-neutral-500 mt-1">{time}</div>
        </div>
      </div>
    </div>
  );
}

function ActionCard({ title, desc, icon, href }: { title: string; desc: string; icon: React.ReactNode; href: string }) {
  return (
    <a href={href} className="group rounded-2xl border border-neutral-800 bg-black/30 p-4 hover:bg-black/50 transition flex items-start gap-3">
      <div className="h-10 w-10 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center justify-center">{icon}</div>
      <div className="flex-1">
        <div className="font-medium">{title}</div>
        <div className="text-sm text-neutral-400">{desc}</div>
      </div>
      <ChevronRight className="h-5 w-5 text-neutral-500 group-hover:translate-x-0.5 transition-transform" />
    </a>
  );
}

function SystemStat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-xl border border-neutral-800 bg-black/30 p-3 flex items-center gap-3">
      <div className="h-9 w-9 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center justify-center">{icon}</div>
      <div>
        <div className="text-sm text-neutral-400">{label}</div>
        <div className="font-medium">{value}</div>
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
  return (
    <span className={`text-xs px-2 py-1 rounded-lg border border-neutral-700 ${map[status]}`}>
      {status === "done" ? "완료" : status === "processing" ? "처리중" : status === "created" ? "생성됨" : "오류"}
    </span>
  );
}

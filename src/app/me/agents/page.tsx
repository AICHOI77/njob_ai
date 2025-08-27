// src/app/me/agents/page.tsx
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { AGENTS } from "@/lib/agents";
import { Lock, CheckCircle2, ArrowRight, Sparkles } from "lucide-react";
import AuthButton from "@/components/AuthButton";
import { getAdminDb } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function MyAgentsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) redirect("/login?next=/me/agents");

  const admin = getAdminDb();

  const { data: profile, error: profileErr } = await admin
    .from("profiles")
    .select("id, email")
    .eq("email", session.user.email)
    .maybeSingle();

  console.log("[/me/agents] session.email:", session.user.email);
  console.log("[/me/agents] profile lookup:", {
    found: !!profile?.id,
    error: profileErr?.message ?? null,
    profile,
  });

  if (!profile?.id) {
    redirect("/login?next=/me/agents");
  }
  const userId = String(profile.id);

  const { data: access, error: accessErr } = await admin
    .from("course_access")
    .select("course_id, start_at, end_at")
    .eq("user_id", userId);

  console.log("[/me/agents] course_access:", {
    count: access?.length ?? 0,
    error: accessErr?.message ?? null,
    rows: access,
  });

  const owned = new Set<string>((access ?? []).map((r: any) => r.course_id));

  const ownedAgents = AGENTS.filter((a) => owned.has(a.courseId));
  const lockedAgents = AGENTS.filter((a) => !owned.has(a.courseId));

  console.log("[/me/agents] mapping:", {
    ownedCourseIds: Array.from(owned),
    ownedAgents: ownedAgents.map((a) => ({ slug: a.slug, title: a.title, courseId: a.courseId })),
  });

  return (
    <div className="min-h-screen bg-[#141414] text-white">
      <div className="mx-auto max-w-6xl p-4 md:p-8">
        <div className="mb-6 space-y-1">
          <h1 className="text-3xl md:text-4xl font-extrabold">내 AI 에이전트</h1>
          <p className="text-neutral-400">
            구매한 에이전트만 접근할 수 있습니다. 잠긴 에이전트를 클릭하면 해제(결제) 페이지로 이동합니다.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-6">
          <aside className="lg:sticky lg:top-6 h-max">
            <div className="rounded-2xl border border-neutral-800 bg-[#1a1a1a]">
              <div className="px-4 py-3 border-b border-neutral-800 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-emerald-400" />
                <div className="text-sm font-semibold">내가 해제한 에이전트</div>
                <span className="ml-auto text-xs text-neutral-400">
                  {ownedAgents.length}/{AGENTS.length}
                </span>
              </div>
              <div className="px-4 py-6 text-sm text-neutral-300">
                <AuthButton />
              </div>

              {ownedAgents.length === 0 ? (
                <div className="px-4 pb-6 text-sm text-neutral-300">
                  아직 해제된 에이전트가 없습니다.
                </div>
              ) : (
                <nav className="p-2 pt-0">
                  <ul className="space-y-1">
                    {ownedAgents.map((a) => (
                      <li key={a.slug}>
                        <a
                          href={a.openPath ?? "#"}
                          className="block rounded-xl px-3 py-2 text-sm border border-transparent hover:border-neutral-700 hover:bg-black/40"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="truncate">{a.title}</span>
                            <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                          </div>
                          {a.short && (
                            <div className="mt-0.5 text-xs text-neutral-400 line-clamp-1">
                              {a.short}
                            </div>
                          )}
                        </a>
                      </li>
                    ))}
                  </ul>
                </nav>
              )}
            </div>
          </aside>
          <main className="space-y-8">
            <section>
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-xl font-semibold">해제된 에이전트</h2>
                <span className="text-sm text-neutral-400">
                  {ownedAgents.length} / {AGENTS.length}
                </span>
              </div>

              {ownedAgents.length === 0 ? (
                <div className="rounded-2xl border border-neutral-800 bg-[#1a1a1a] p-6 text-neutral-300">
                  아직 해제된 에이전트가 없습니다.
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {ownedAgents.map((a) => (
                    <OwnedCard
                      key={a.slug}
                      title={a.title}
                      short={a.short}
                      href={a.openPath ?? "#"}
                    />
                  ))}
                </div>
              )}
            </section>

            <section>
              <h2 className="mb-3 text-xl font-semibold">구매 가능한 다른 에이전트</h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {lockedAgents.map((a) => (
                  <LockedCard
                    key={a.slug}
                    title={a.title}
                    short={a.short}
                    href={a.purchaseUrl ?? "/products"}
                  />
                ))}
              </div>
            </section>
          </main>
        </div>
      </div>
    </div>
  );
}

function OwnedCard({ title, short, href }: { title: string; short: string; href: string }) {
  return (
    <a href={href} className="group block rounded-2xl border border-neutral-800 bg-[#1a1a1a] p-5 transition hover:bg-[#171717]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-lg font-semibold">{title}</div>
          <div className="mt-1 text-sm text-neutral-400">{short}</div>
        </div>
        <div className="shrink-0 text-emerald-400">
          <CheckCircle2 className="h-5 w-5" />
        </div>
      </div>
      <div className="mt-4 inline-flex items-center gap-2 text-sm text-emerald-400 transition-transform group-hover:translate-x-0.5">
        이동 <ArrowRight className="h-4 w-4" />
      </div>
    </a>
  );
}

function LockedCard({ title, short, href }: { title: string; short: string; href: string }) {
  return (
    <a href={href} className="group block rounded-2xl border border-neutral-800 bg-black/30 p-5 transition hover:bg-black/50">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-lg font-semibold">{title}</div>
          <div className="mt-1 text-sm text-neutral-400">{short}</div>
        </div>
        <div className="shrink-0 text-neutral-400">
          <Lock className="h-5 w-5" />
        </div>
      </div>
      <div className="mt-4 inline-flex items-center gap-2 text-sm text-neutral-300 group-hover:text-white">
        해제하기 <ArrowRight className="h-4 w-4" />
      </div>
    </a>
  );
}

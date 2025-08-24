"use client";

import { useState, useEffect } from "react";
import { notFound, useParams } from "next/navigation";
import LectureImage from "@/components/LectureImage";
import Image from "next/image";
import { lecturesApi } from "@/app/api/lectures";
import { LectureSidebar } from "@/components/LectureSidebar";
import { LectureWithCoach } from "@/types/lectures";
import { useLectureApply } from "@/hooks/useLectureApply";

export default function CourseDetailPage() {
  const [activeTab, setActiveTab] = useState<"intro" | "instructor">("intro");
  const params = useParams();
  const lectureId = params.id as string;
  const [lecture, setLecture] = useState<LectureWithCoach | null>(null);
  const [loading, setLoading] = useState(true);

  const { isLoading, handleApplyClick } = useLectureApply(lectureId);

  useEffect(() => {
    const fetchLecture = async () => {
      try {
        const fetchedLecture = await lecturesApi.getLectureById(lectureId);
        if (fetchedLecture) setLecture(fetchedLecture);
        else notFound();
      } catch (error) {
        console.error("Failed to fetch lecture:", error);
        notFound();
      } finally {
        setLoading(false);
      }
    };
    if (lectureId) fetchLecture();
  }, [lectureId]);

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black">
        <div className="text-center text-white">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-white/15 border-t-white/70"></div>
          <p className="text-sm text-white/70">강의 정보를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (!lecture) return notFound();

  return (
    <>
      <section className="relative min-h-screen overflow-hidden bg-black text-white">
        <div className="pointer-events-none absolute inset-0 -z-10 [background:linear-gradient(149deg,_#192247_0%,_#210e17_96.86%)]" />
        <div className="pointer-events-none absolute inset-0 -z-10 [background:linear-gradient(180deg,rgba(0,0,0,0.86)_0%,rgba(0,0,0,0.82)_45%,rgba(0,0,0,0.92)_100%)]" />
        <div className="pointer-events-none absolute inset-0 -z-10 [background:radial-gradient(65%_120%_at_100%_100%,rgba(229,9,20,0.18),rgba(229,9,20,0)_60%),radial-gradient(60%_120%_at_0%_100%,rgba(121,53,200,0.16),rgba(121,53,200,0)_60%)]" />

        <div className="mx-auto max-w-7xl px-4 py-8">
          <div className="relative flex flex-col gap-8 lg:flex-row">
            {/* Left content */}
            <div className="w-full space-y-4 lg:w-3/5">
              <div className="overflow-hidden rounded-xl border border-white/10 bg-[#141414]">
                <LectureImage
                  src={lecture.thumbnail}
                  alt={lecture.title}
                  width={760}
                  height={600}
                />
              </div>

              {/* Mobile sidebar */}
              <div className="block lg:hidden">
                <LectureSidebar lecture={lecture} />
              </div>

              {/* Tabs */}
              <div className="z-10 mt-4">
                <nav className="sticky top-20 z-20 flex justify-center border-b border-white/10 bg-black/40 backdrop-blur py-1 font-bold">
                  {[
                    { id: "intro", label: "강의 소개" },
                    { id: "instructor", label: "강사 소개" },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as "intro" | "instructor")}
                      className={`flex-1 p-2 text-sm font-bold transition-all duration-300 sm:text-base ${
                        activeTab === tab.id
                          ? "border-b-2 border-[var(--accent)] text-[var(--accent)]"
                          : "border-b-2 border-transparent text-white/60 hover:text-white"
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </nav>

                <div className="mt-8 min-h-screen pb-12 lg:min-h-screen">
                  {activeTab === "intro" && (
                    <article className="prose prose-invert max-w-none">
                      <h2 className="mb-4 text-2xl font-bold">강의 소개</h2>
                      {lecture.content_text && <p>{lecture.content_text}</p>}

                      {lecture.content_image &&
                        lecture.content_image
                          .split(",")
                          .filter((url) => url.trim())
                          .map((url, index) => (
                            <Image
                              key={index}
                              src={url.trim()}
                              alt={`${lecture.title} content image ${index + 1}`}
                              width={760}
                              height={600}
                              className="h-auto w-full rounded-lg border border-white/10"
                            />
                          ))}

                      {lecture.content_url && (
                        <div className="mt-6 overflow-hidden rounded-lg border border-white/10">
                          <iframe
                            src={lecture.content_url}
                            title="강의 소개"
                            width="100%"
                            height="800"
                            className="min-h-[400px] lg:min-h-[800px]"
                            style={{ border: "none", backgroundColor: "transparent" }}
                          />
                        </div>
                      )}
                    </article>
                  )}

                  {activeTab === "instructor" && (
                    <article className="prose prose-invert max-w-none">
                      <h2 className="mb-4 text-2xl font-bold">강사 소개</h2>
                      <div className="rounded-lg border border-white/10 bg-[#141414] p-6">
                        <h3 className="mb-4 text-xl font-bold">{lecture.coach.name}</h3>

                        {lecture.coach.bio && (
                          <div className="mb-4">
                            <p className="leading-relaxed text-white/80">
                              {lecture.coach.bio}
                            </p>
                          </div>
                        )}

                        {lecture.coach.career && (
                          <div>
                            <h4 className="mb-2 font-semibold">경력</h4>
                            <p className="whitespace-pre-line leading-relaxed text-white/80">
                              {lecture.coach.career}
                            </p>
                          </div>
                        )}
                      </div>
                    </article>
                  )}
                </div>
              </div>
            </div>

            {/* Right sidebar (desktop) */}
            <div className="hidden w-full space-y-6 lg:block lg:w-2/5">
              <LectureSidebar lecture={lecture} />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

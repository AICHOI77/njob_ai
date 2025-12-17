"use client";

import React, { useState, useEffect } from "react";
import { ArrowRight, Sparkles, Target, Zap } from "lucide-react";
import ConsultationModal from "@/components/ConsultationModal";
import Image from "next/image";

export default function LandingPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [timeLeft, setTimeLeft] = useState(300); // 5분 = 300초

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  // 타이머 효과
  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [timeLeft]);

  // 시간을 HH:MM:SS 형식으로 변환
  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  return (
    <div className="min-h-screen gap-y-6 bg-black">
      <section className="flex flex-col items-center space-y-6 bg-black px-4 py-2 sm:space-y-24 sm:px-6 lg:px-32">
        <Image
          src="https://cdn.imweb.me/thumbnail/20240514/05733dc1adcc0.png"
          alt="AI최대표"
          width={1000}
          height={1000}
          className="w-full"
        />
        <div className="relative mb-5 w-full sm:mb-10">
          <div className="h-10 w-full bg-gray-200 sm:h-12">
            <div
              className="h-10 bg-red-500 transition-all duration-1000 ease-out sm:h-12"
              style={{ width: "93%" }}
            />
          </div>
          <span className="absolute inset-0 flex items-center justify-center text-lg font-bold text-white sm:text-xl">
            무료 비밀강의 신청률 (93%)
          </span>
        </div>
        <div className="mb-5 text-center text-2xl text-white sm:mb-10">
          <span className="font-bold">무료 비밀강의 시작까지..</span>
          <br /> (2일간 저녁 7시 30분 시작)
          <br />{" "}
          <span className="text-5xl font-bold">{formatTime(timeLeft)}</span>
        </div>
        <Image
          src="https://cdn.imweb.me/thumbnail/20240514/b2be4d7085610.png"
          alt="AI최대표"
          width={1000}
          height={1000}
          className="w-full"
        />
        <Image
          src="https://cdn.imweb.me/thumbnail/20240514/7493bf79775a9.gif"
          alt="AI최대표"
          width={1000}
          height={1000}
          className="w-full"
        />
        <Image
          src="https://cdn.imweb.me/thumbnail/20240514/72c2ad8e003cf.png"
          alt="AI최대표"
          width={1000}
          height={1000}
          className="w-full"
        />
        <Image
          src="https://cdn.imweb.me/thumbnail/20250623/8acc90af53068.gif"
          alt="AI최대표"
          width={1000}
          height={1000}
          className="w-full"
        />
        <Image
          src="https://cdn.imweb.me/thumbnail/20250623/cb34010e644ba.gif"
          alt="AI최대표"
          width={1000}
          height={1000}
          className="w-full"
        />
        <Image
          src="https://cdn.imweb.me/thumbnail/20240514/d910a931ef3c5.png"
          alt="AI최대표"
          width={1000}
          height={1000}
          className="w-full"
        />
        <Image
          src="https://cdn.imweb.me/thumbnail/20240514/f16054c56addf.gif"
          alt="AI최대표"
          width={1000}
          height={1000}
          className="w-full"
        />
        <div className="relative mb-5 w-full sm:mb-10">
          <div className="h-10 w-full bg-gray-200 sm:h-12">
            <div
              className="h-10 bg-red-500 transition-all duration-1000 ease-out sm:h-12"
              style={{ width: "93%" }}
            />
          </div>
          <span className="absolute inset-0 flex items-center justify-center text-lg font-bold text-white sm:text-xl">
            무료 비밀강의 신청률 (93%)
          </span>
        </div>
        <div className="mb-5 text-center text-2xl text-white sm:mb-10">
          <span className="font-bold">무료 비밀강의 시작까지..</span>
          <br /> (2일간 저녁 7시 30분 시작)
          <br />{" "}
          <span className="text-5xl font-bold">{formatTime(timeLeft)}</span>
        </div>
      </section>

      <section className="relative items-center overflow-hidden bg-gradient-to-br from-[#0D0D2B] via-[#1a1a3a] to-[#0D0D2B] text-white">
        <div className="relative mx-auto space-y-4 px-4 py-10 sm:space-y-10 sm:px-6 sm:py-6 lg:px-32 lg:py-24">
          {/* <div className="mx-auto inline-flex items-center rounded-full border border-[#DC2626]/30 bg-[#DC2626]/20 px-4 py-2 text-sm font-medium text-[#DC2626] backdrop-blur-sm">
            <Sparkles className="mr-2 h-4 w-4" />
            AI최대표의 맞춤형 수익 시스템
          </div> */}
          <h1 className="text-center text-3xl leading-tight font-bold text-white sm:text-5xl">
            딱 1분, <br className="block sm:hidden" />
            수익화는 꿈도 못꾸던{" "}
            <span className="block sm:inline">
              노베이스에 평범한 직장인이
              <br />
            </span>
            1달만에 <span className="text-red-500">월 5,000만원</span> 벌게 된
            비법을 모두 받아가세요!
            <br /> 오직 당신에게만 적용되는{" "}
            <span className="block sm:inline">
              <span className="text-[#DC2626]">월 5000 AI 자동 수익 전략</span>
              <br className="block sm:hidden" />
              까지 <br className="hidden sm:block" />
              무료로 설계해드립니다.
            </span>
          </h1>
          <p className="text-center text-xl leading-relaxed text-white">
            경험 없음, 기술 없음 괜찮습니다.{" "}
            <span className="sm:hidden">
              <br />
            </span>
            당신의 일과 삶을 바탕으로 지금 가장{" "}
            <span className="block sm:inline">
              빠르게 자동화 수익을 만들 수 있는 전략을
            </span>{" "}
            AI 최대표가 직접 제안해드립니다.
          </p>
          <div className="flex flex-row items-center justify-center gap-2 text-center text-sm text-white sm:gap-6">
            <div className="flex items-center gap-1 rounded-lg bg-white/10 px-2 py-2 backdrop-blur-sm sm:px-4">
              <Target className="h-5 w-5 text-[#00BFFF]" />
              <span>PRODUCT 아이템 생성</span>
            </div>
            <div className="flex items-center rounded-lg bg-white/10 px-2 py-2 backdrop-blur-sm sm:px-4">
              <Zap className="h-5 w-5 text-[#00BFFF]" />
              <span>AUTOMATE 자동화 설계</span>
            </div>
            <div className="flex items-center rounded-lg bg-white/10 px-2 py-2 backdrop-blur-sm sm:px-4">
              <ArrowRight className="h-5 w-5 text-[#00BFFF]" />
              <span>TRAFFIC 유입 전략</span>
            </div>
          </div>
        </div>
      </section>
      <section className="flex flex-col items-center space-y-6 bg-black py-6 sm:px-6 sm:py-10 lg:px-32">
        <div className="mx-auto mb-10 text-center sm:mb-24">
          <h2 className="mb-6 text-3xl font-bold text-white sm:text-4xl">
            요즘 AI로 돈 버는 방법,{" "}
            <span className="block text-red-500 sm:inline">
              너무 많아서 혼란스러우시죠?
              <br />
            </span>
            도대체 나에게 맞는{" "}
            <span className="block sm:inline">수익화 방식은 뭘까요?</span>
          </h2>
          <p className="mx-auto text-lg leading-relaxed text-gray-300 sm:text-xl">
            해외 AI 부자들의 수익 시스템 그대로,{" "}
            <span className="block sm:inline">단 2일간 공개됩니다.</span>{" "}
            <span className="block sm:inline">
              이 페이지에서 신청하시면{" "}
              <span className="block sm:inline">
                나만의 월5천 전략까지 무료로 설계해드립니다.
              </span>
            </span>
          </p>
        </div>
        <div className="mx-auto mb-10 text-center sm:mb-24">
          <h2 className="mb-6 text-3xl font-bold text-white sm:text-4xl">
            그동안 국내 내수용 저품질 부업 등에 질리신 분들은{" "}
            <span className="text-red-500">주목!</span>
          </h2>
          <p className="mx-auto text-lg leading-relaxed text-gray-300 sm:text-xl">
            수익을 내지 못하는 진짜 이유는{" "}
            <span className="block sm:inline">
              &apos;시스템&apos;이 없기 때문입니다.
            </span>
          </p>
        </div>
        <div className="mb-10 text-center sm:mb-24">
          <h2 className="mb-4 text-3xl font-bold text-white sm:text-4xl">
            왜 <span className="text-red-500">월5천 아이템 생성기</span>
            인가?
          </h2>
          <p className="mx-auto text-lg text-gray-300 sm:text-xl">
            단순한 아이템 제안이 아닌,{" "}
            <span className="block sm:inline">당신의 현실 상황을 반영한 </span>
            <span className="block sm:inline">
              맞춤형 수익 시스템을 설계합니다.
            </span>
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-3">
          <div className="group rounded-2xl border-2 border-gray-100 bg-white p-8 text-center transition-all duration-300 hover:-translate-y-1 hover:border-[#DC2626] hover:shadow-xl">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-[#DC2626] to-[#FF4444] transition-transform duration-300 group-hover:scale-110">
              <Target className="h-8 w-8 text-white" />
            </div>
            <h3 className="mb-4 text-xl font-bold text-[#0D0D2B]">PRODUCT</h3>
            <p className="leading-relaxed text-gray-600">
              당신의 경험과 관심사를 바탕으로 한 <br />
              개인 맞춤형 수익 아이템 생성.
              <br /> 콘텐츠 없이도 가능한 <br />
              200만원 자동화 수입 구조 설계.
            </p>
          </div>

          <div className="group rounded-2xl border-2 border-gray-100 bg-white p-8 text-center transition-all duration-300 hover:-translate-y-1 hover:border-[#DC2626] hover:shadow-xl">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-[#DC2626] to-[#FF4444] transition-transform duration-300 group-hover:scale-110">
              <Zap className="h-8 w-8 text-white" />
            </div>
            <h3 className="mb-4 text-xl font-bold text-[#0D0D2B]">AUTOMATE</h3>
            <p className="leading-relaxed text-gray-600">
              AI 자동화 툴 기반 설득형 페이지 구축.
              <br /> 시간 없는 직장인도 가능한 <br />
              자동화 루틴과 브랜드 설계까지.
            </p>
          </div>

          <div className="group rounded-2xl border-2 border-gray-100 bg-white p-8 text-center transition-all duration-300 hover:-translate-y-1 hover:border-[#DC2626] hover:shadow-xl">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-[#DC2626] to-[#FF4444] transition-transform duration-300 group-hover:scale-110">
              <ArrowRight className="h-8 w-8 text-white" />
            </div>
            <h3 className="mb-4 text-xl font-bold text-[#0D0D2B]">TRAFFIC</h3>
            <p className="leading-relaxed text-gray-600">
              인스타그램, 유튜브 유입 전략 설계.
              <br />
              인플루언서처럼 수익 내는 <br />
              채널 성장 밀착 컨설팅.
            </p>
          </div>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {[
            { icon: "👤", text: "딱 1명, 당신에게만 맞는 전략입니다" },
            { icon: "💼", text: "지금까지 해온 일을 기반으로만 설계됩니다" },
            { icon: "⚡", text: "신청 즉시 분석 시작 + 결과 리포트 제공" },
          ].map((item, index) => (
            <div key={index} className="flex items-center justify-center">
              <div className="w-full rounded-full border-1 border-gray-400 bg-white px-4 py-3 text-center">
                <span className="mr-2 text-xl">{item.icon}</span>
                <span className="font-bold text-[#0D0D2B]">{item.text}</span>
              </div>
            </div>
          ))}
        </div>
        <div className="mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-10 text-center sm:mb-24">
            <h2 className="mb-4 text-3xl font-bold text-white sm:text-4xl">
              {/* 실제 이용자들의{" "}
                <span className="text-[#DC2626]">성공 후기</span> */}
              무료 강의만 듣고도{" "}
              <span className="block sm:inline">
                <span className="text-red-500">월 1000만원</span> 달성!
              </span>
            </h2>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            {[
              {
                name: "김○○님",
                job: "회사원",
                result: "월 450만원",
                content:
                  "정말 3페이지만 작성했는데 맞춤형 아이템이 나왔어요. 지금은 본업 수익을 넘어섰습니다!",
              },
              {
                name: "박○○님",
                job: "마케터",
                result: "월 320만원",
                content:
                  "AI 자동화 시스템 덕분에 거의 손 안 대고도 수익이 나와요. 강력 추천합니다.",
              },
              {
                name: "이○○님",
                job: "디자이너",
                result: "월 280만원",
                content:
                  "처음엔 반신반의했는데, 정말 제 상황에 딱 맞는 아이템을 제안해줘서 놀랐어요.",
              },
            ].map((testimonial, index) => (
              <div
                key={index}
                className="rounded-2xl border border-gray-100 bg-gray-50 p-6"
              >
                <div className="mb-4 flex items-center">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[#DC2626] to-[#FF4444] text-sm font-bold text-white">
                    {testimonial.name[0]}
                  </div>
                  <div className="ml-3">
                    <div className="font-medium text-[#0D0D2B]">
                      {testimonial.name}
                    </div>
                    <div className="text-sm text-gray-600">
                      {testimonial.job}
                    </div>
                  </div>
                  <div className="ml-auto text-right">
                    <div className="text-lg font-bold text-[#DC2626]">
                      {testimonial.result}
                    </div>
                    <div className="text-xs text-gray-500">달성</div>
                  </div>
                </div>
                <p className="leading-relaxed text-gray-700">
                  &quot;{testimonial.content}&quot;
                </p>
              </div>
            ))}
          </div>
        </div>
        <div className="mx-auto text-center">
          <h2 className="text-3xl font-bold text-white sm:text-4xl">
            수익으로 증명된 <span className="text-[#DC2626]">AI 시스템</span>{" "}
            <span className="block sm:inline">직접 확인하세요!</span>
          </h2>
        </div>
      </section>
      {/* CTA Section - 개선 */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#0D0D2B] via-[#1a1a3a] to-[#0D0D2B] pt-10 pb-20 text-white">
        <div className="relative mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="mb-6 text-3xl font-bold sm:text-4xl">
            &quot;AI최대표&quot;와 함께라면
            <br />
            <span className="bg-gradient-to-r from-[#DC2626] to-[#FF4444] bg-clip-text text-transparent">
              월5천 아이템 로드맵
            </span>{" "}
            <span className="block sm:inline">확보까지</span>
          </h2>
          <p className="mx-auto max-w-2xl text-xl leading-relaxed text-gray-300">
            본업 외 수익을 꿈꾸는{" "}
            <span className="block sm:inline">
              MZ세대를 위한 현실적인 솔루션.
              <br />
            </span>
            AI가 당신만의 최적화된 수익 시스템을
            <span className="block sm:inline">3페이지 만에 제안합니다.</span>
          </p>
        </div>
      </section>

      {/* 플로팅 버튼 */}
      <div className="fixed right-0 bottom-0 left-0 z-50 flex items-center justify-center p-2">
        <button
          onClick={openModal}
          className="relative flex h-16 transform items-center justify-center rounded-lg bg-gradient-to-r from-[#DC2626] to-[#B91C1C] px-12 text-xl font-bold text-white shadow-lg transition-all duration-300 hover:scale-[1.02] hover:from-[#B91C1C] hover:to-[#991B1B] hover:shadow-xl sm:w-1/2"
        >
          <div className="flex-1 text-center">
            무료강의 신청하고{" "}
            <span className="block sm:inline">나만의 월 5천 전략 받기</span>
          </div>
          <ArrowRight className="absolute right-4 h-6 w-6" />
        </button>
      </div>

      {/* Consultation Modal */}
      <ConsultationModal isOpen={isModalOpen} onClose={closeModal} />
    </div>
  );
}

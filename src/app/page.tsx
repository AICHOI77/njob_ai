'use client';

import dynamic from "next/dynamic";
import Link from "next/link";
import NextImage from "next/image";
import { useMemo, useState, useRef } from "react";
import {
  Search,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  Shield,
  Sparkles,
  Menu,
  X,
} from "lucide-react";
import FAQSection from "@/components/FAQSection";
import CoachesSection from "@/components/CoachesSection";
import SuccessStories from "@/components/SuccessStories";
import HeroSection from "@/components/HeroSection";
import LectureSection from "@/components/LectureSection";

type Agent = {
  slug: string;
  title: string;
  pitch: string;
  category: string;
};

const AGENTS: Agent[] = [
  { slug: "real-estate-auction", title: "AI 부동산 경매 에이전트", pitch: "200만원 투자로, 30일 안에 1,000만원의 첫 시세 차익을 경험하십시오.", category: "수익 창출" },
  { slug: "institutional-analyzer", title: "AI 주식/코인 '기관' 정보 분석기", pitch: "기관 투자자들의 움직임을 분석하는 AI와 함께 7일 안에 첫 수익 실현의 기쁨을 맛보십시오.", category: "금융 자동화" },
  { slug: "gov-bidding", title: "AI 정부/기업 입찰 에이전트", pitch: "AI가 발굴한 수천만원짜리 첫 정부 사업을 30일 안에 수주하는 경험을 하십시오.", category: "수익 창출" },
  { slug: "ma-startup-investor", title: "AI M&A/스타트업 투자 에이전트", pitch: "대기업이 인수할 가능성이 높은 비상장 스타트업 정보를 가장 먼저 얻으십시오.", category: "투자" },
  { slug: "luxury-resell", title: "AI 중고 명품 리셀 에이전트", pitch: "AI가 찾아낸 시세보다 50만원 이상 저렴한 첫 명품을 단 7일 안에 손에 넣으십시오.", category: "리셀" },
  { slug: "global-sourcing", title: "AI 해외구매대행 '독점' 상품 발굴기", pitch: "AI가 발굴하고 세팅해 준 '독점' 상품으로 당신의 스토어에서 첫 매출을 경험하십시오.", category: "커머스" },
  { slug: "yt-shorts-affiliate", title: "AI 유튜브 숏폼 제휴 마케터", pitch: "AI가 24시간 운영하는 당신의 채널에서 14일 안에 첫 쿠팡 커미션을 확인하십시오.", category: "마케팅" },
  { slug: "freelance-scanner", title: "AI 외주/프리랜서 '고단가' 프로젝트 스캐너", pitch: "AI가 당신에게 최적화된 300만원 이상의 첫 프로젝트를 14일 안에 자동으로 수주하게 하십시오.", category: "수익 창출" },
  { slug: "blog-adsense", title: "AI 블로그 애드센스 자동화", pitch: "60일 안에 구글 애드센스 승인을 받고, AI 블로그에서 첫 달러 수익을 경험하십시오.", category: "콘텐츠" },
  { slug: "tax-refund-finder", title: "AI '세금 환급' 자동 분석기", pitch: "AI가 당신의 숨겨진 환급금을 찾아, '보너스'를 안겨드립니다.", category: "개인 금융" },
] as const;

const CATEGORIES = ["전체","금융 자동화","수익 창출","개인 금융","투자","리셀","커머스","마케팅","콘텐츠"] as const;

export default function Home() {
  const [query, setQuery] = useState("");
  const [isCompanyInfoOpen, setIsCompanyInfoOpen] = useState(false);
  const [cat, setCat] = useState<typeof CATEGORIES[number]>("전체");

  // navbar (mobile)
  const [menuOpen, setMenuOpen] = useState(false);
  const [showSearch, setShowSearch] = useState(false);

  const filtered = useMemo(() => {
    return AGENTS.filter(a => {
      const hitQ = a.title.includes(query) || a.pitch.includes(query);
      const hitC = cat === "전체" || a.category === cat;
      return hitQ && hitC;
    });
  }, [query, cat]);

  const vaultRef = useRef<HTMLDivElement>(null);
  const scrollToVault = () => vaultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });

  return (
    <main className="min-h-screen w-full bg-black text-white">
      {/* Section 1 - Hook */}
      <section className="relative min-h-[60svh] md:min-h-[62svh] flex items-center isolate overflow-hidden">
        {/* BACKGROUND */}
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <NextImage
            src="/hero-wall.avif"
            alt="월천메이커 배경"
            fill
            priority
            sizes="100vw"
            className="
              pointer-events-none select-none
              object-cover object-center
              brightness-[0.55] md:brightness-[0.55]  /* assombrit directement l'image */
              contrast-[0.90] saturate-[1.2]
              will-change-transform
            "
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/25 via-black/25 to-black/65" />
          <div className="absolute inset-0 [background:radial-gradient(60%_40%_at_50%_0%,rgba(229,9,20,0.10),transparent_65%),radial-gradient(40%_35%_at_10%_80%,rgba(0,123,255,0.12),transparent_70%)]" />
        </div>

        {/* CONTENU */}
        <div className="container-xxl text-center space-y-4 md:space-y-5">
          <h1 className="text-4xl md:text-6xl font-bold leading-tight">
            <span className="text-white">노동의 시대는 끝났습니다.</span>
          </h1>
          <h2 className="text-xl md:text-2xl text-white/80">
            이제, 당신의 아이디어가 돈이 되는 시대입니다.
          </h2>
          <h3 className="text-base md:text-lg text-white/70">
            실행은 AI가, 수익은 당신이.
          </h3>
          <div className="pt-2 md:pt-3 flex justify-center">
            <button
              onClick={scrollToVault}
              className="cta-pulse inline-flex items-center gap-2 px-6 py-2.5 md:py-3 rounded-full bg-[var(--accent)] hover:opacity-90 transition glow"
            >
              나의 첫 AI 자산, 지금 바로 확인하기 <ChevronDown className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>


      {/* Section 2 - Shift */}
      <section className="py-16 border-t border-white/10">
        <div className="container-xxl grid md:grid-cols-12 gap-8 items-start">
          <div className="md:col-span-4">
            <div className="text-3xl md:text-5xl font-semibold text-[var(--accent)]">“월천만원.”</div>
          </div>
          <div className="md:col-span-8 text-white/80 leading-relaxed text-lg">
            이것은 더 이상 소수의 재능이나 끝없는 노력의 결과가 아닙니다. AI 시대에, 이것은 <b className="text-white">“올바른 시스템”</b>을 소유한 자의 당연한 권리입니다. 우리는 당신에게 그 시스템을 제공합니다.
          </div>
        </div>
      </section>

      {/* Section 3 - Vault */}
      <section id="vault" ref={vaultRef} className="py-20 border-t border-white/10">
        <div className="container-xxl space-y-6">
          <h2 className="text-2xl md:text-3xl font-bold">당신의 첫 번째 ‘AI 금융 자산’을 선택하십시오.</h2>
          <p className="text-white/70">카드를 호버하면 핵심 메시지가 나타납니다.</p>

          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {filtered.map(agent => (
              <div key={agent.slug} className="perspective">
                <div className="card-flip relative h-56 rounded-xl border border-white/10 overflow-hidden bg-gradient-to-br from-white/[0.04] to-white/[0.02] hover:shadow-xl hover:shadow-[rgba(229,9,20,0.2)]">
                  <div className="card-inner preserve-3d w-full h-full">
                    {/* Front */}
                    <div className="card-face card-front backface-hidden p-4 flex flex-col justify-between">
                      <div className="flex items-center justify-between">
                        <div className="text-xs uppercase tracking-widest text-white/50">{agent.category}</div>
                        <Sparkles className="w-4 h-4 text-[var(--signature-blue)]" />
                      </div>
                      <div>
                        <div className="text-base font-semibold leading-snug">{agent.title}</div>
                        <div className="mt-2 text-xs text-white/60">자세히 보려면 카드를 넘기세요</div>
                      </div>
                    </div>
                    {/* Back */}
                    <div className="card-face card-back backface-hidden p-4 flex flex-col justify-between bg-black/80">
                      <div className="text-sm text-white/80 leading-relaxed">{agent.pitch}</div>
                      <div className="flex items-center justify-between">
                        <Link href={`/agents/${agent.slug}`} className="inline-flex items-center gap-1 text-[var(--accent)] hover:underline">
                          자세히 보기 <ChevronRight className="w-4 h-4" />
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Section 4 - Proof */}
      <section className="py-20 border-t border-white/10">
        <div className="container-xxl space-y-8">
          <h3 className="text-2xl md:text-3xl font-bold">이 모든 것은 공상이 아닙니다. 세계 최고의 두뇌들이 현실로 만들고 있습니다.</h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {name:"Ankur M.", title:"ex-Google · AI Architect", desc:"Upwork 상위 0.1% · 분산 시스템 · 대규모 ML 파이프라인"},
              {name:"Toan V. D.", title:"Microsoft Alumni · PhD", desc:"시스템 최적화 · 그래프 ML · 데이터 엔지니어링"},
              {name:"Senior Core Dev", title:"ex-Meta · M.S.", desc:"대화형 에이전트 · 프로덕션 인프라"},
              {name:"Research Engineer", title:"ex-FAANG · PhD", desc:"강화학습 · 시뮬레이션 · 자동화"}
            ].map((p, i) => (
              <div key={i} className="rounded-xl border border-white/10 p-4 bg-white/[0.02] hover:bg-white/[0.04] transition">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-white/10 border border-white/10" />
                  <div>
                    <div className="font-semibold">{p.name}</div>
                    <div className="text-xs text-white/60">{p.title}</div>
                  </div>
                </div>
                <div className="mt-3 text-sm text-white/70">{p.desc}</div>
              </div>
            ))}
          </div>
          <p className="text-white/60 text-sm">우리는 한 개인의 주관적인 경험이 아닌, 데이터와 시스템으로 당신의 성공을 설계합니다.</p>
        </div>
      </section>

      {/* Section 5 - Final Offer */}
      <section id="final-offer" className="py-20 border-t border-white/10">
        <div className="container-xxl grid md:grid-cols-12 gap-8 items-center">
          <div className="md:col-span-7 space-y-4">
            <h3 className="text-2xl md:text-4xl font-bold text-[var(--accent)]">경고: 이 시스템은 불공평합니다.</h3>
            <p className="text-white/80 text-lg leading-relaxed">
              당신이 잠든 사이에도, 당신의 AI 파트너는 시장을 분석하고, 기회를 포착하여 당신의 통장에 돈을 입금시킬 것입니다. 이것은 당신의 경쟁자들이 이해할 수 없는, 완전히 새로운 차원의 경쟁 우위입니다.
            </p>
            <p className="text-white/70">당신은 이 ‘불공평한 미래’의 주인이 될 준비가 되셨습니까?</p>
            <div className="flex gap-3">
              <Link href="/webinar" className="cta-pulse inline-flex items-center justify-center px-5 py-3 rounded-md bg-[var(--accent)] hover:opacity-90 transition">
                AI 제국 창립 파트너, 지금 바로 합류하기 (무료 웨비나 신청)
              </Link>
              <a href="#vault" className="inline-flex items-center px-5 py-3 rounded-md border border-white/15 hover:bg-white/5">AI 자산 확인하기</a>
            </div>
          </div>
          <div className="md:col-span-5">
            <div className="rounded-xl border border-white/10 p-6 bg-white/[0.02]">
              <div className="flex items-center gap-3">
                <Shield className="w-5 h-5 text-[var(--signature-blue)]" />
                <div className="font-semibold">우리는 “AI 자산 운용사”입니다.</div>
              </div>
              <p className="mt-3 text-white/70 text-sm leading-relaxed">
                우리는 소프트웨어를 파는 회사가 아닙니다. 고객의 아이디어를 ‘자율 운영되는 금융 자산’으로 만들어 드립니다.
              </p>
            </div>
          </div>
        </div>
      </section>

      <HeroSection />
      <LectureSection />
      <FAQSection />
      <CoachesSection />
      <SuccessStories />

      {/* Footer */}
      <footer className="py-10 border-t border-white/10">
        <div className="container-xxl space-y-6 text-white/60 text-sm">
          {/* 회사 정보 (접기/펼치기) */}
          <div className="md:col-span-2">
            <div className="space-y-2 text-slate-300 text-sm">
              <button
                onClick={() => setIsCompanyInfoOpen(!isCompanyInfoOpen)}
                className="flex items-center space-x-1 w-full text-left hover:text-white transition-colors"
              >
                <span className="font-medium">주식회사 에이아이사스</span>
                {isCompanyInfoOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>

              {isCompanyInfoOpen && (
                <div className="mt-4 p-4 bg-black rounded-lg space-y-1 border border-white/10">
                  <p>대표자: 최서준</p>
                  <p>사업자등록번호: 878-81-03281</p>
                  <p>통신판매업 신고번호: 제 2025-경기김포-0882호</p>
                  <p>주소: 경기도 김포시 김포한강2로 158, 6층 604-C121호(아시동)</p>
                  <p>연락처: 010-2014-2125 | e-mail: cddmh11@gmail.com</p>
                </div>
              )}
            </div>
          </div>

          {/* 저작권 & 정책 */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div>© {new Date().getFullYear()} 월천메이커 AI (wol1000.ai). 모든 권리 보유.</div>
            <div className="flex gap-4">
              <Link href="/privacy">개인정보처리방침</Link>
              <Link href="/terms">이용약관</Link>
            </div>
          </div>
        </div>
      </footer>

      <style jsx global>{`
        .hero-wall {
          position: relative;
          isolation: isolate;
        }
        .hero-wall::after {
          content: "";
          position: absolute;
          inset: 0;
          z-index: -2;
          background-image: url('/hero-wall.avif');
          background-size: cover;        /* pas de zoom excessif */
          background-position: center;   /* bien centré */
          background-repeat: no-repeat;
          filter: contrast(1.05) saturate(1.05) brightness(0.88); /* un poil plus sombre */
        }
        .hero-wall::before {
          content: "";
          position: absolute;
          inset: 0;
          z-index: -1;
          background:
            /* couche noire globale (haut -> bas) */
            linear-gradient(180deg,
              rgba(0,0,0,0.86) 0%,
              rgba(0,0,0,0.86) 45%,
              rgba(0,0,0,0.90) 100%
            ),
            radial-gradient(120% 85% at 50% 20%,
              rgba(0,0,0,0.00) 0%,
              rgba(0,0,0,0.72) 52%,
              rgba(0,0,0,0.90) 100%
            ),
            radial-gradient(65% 120% at 100% 100%,
              rgba(229,9,20,0.18) 0%,
              rgba(229,9,20,0.00) 60%
            ),
            radial-gradient(60% 120% at 0% 100%,
              rgba(121,53,200,0.16) 0%,
              rgba(121,53,200,0.00) 60%
            );
          pointer-events: none;
        }

        @media (min-width: 1024px) {
          .hero-wall::after {
            filter: contrast(1.05) saturate(1.05) brightness(0.90);
          }
          .hero-wall::before {
            background:
              linear-gradient(180deg,
                rgba(0,0,0,0.80) 0%,
                rgba(0,0,0,0.82) 45%,
                rgba(0,0,0,0.88) 100%
              ),
              radial-gradient(110% 80% at 50% 18%,
                rgba(0,0,0,0.00) 0%,
                rgba(0,0,0,0.66) 52%,
                rgba(0,0,0,0.88) 100%
              ),
              radial-gradient(60% 110% at 100% 100%,
                rgba(229,9,20,0.16) 0%,
                rgba(229,9,20,0.00) 60%
              ),
              radial-gradient(55% 110% at 0% 100%,
                rgba(121,53,200,0.14) 0%,
                rgba(121,53,200,0.00) 60%
              );
          }
        }

        .masked-overflow::before,
        .masked-overflow::after {
          content: "";
          position: sticky;
          top: 0;
          bottom: 0;
          width: 16px;
          pointer-events: none;
          z-index: 1;
        }
        .masked-overflow::before {
          left: 0;
          background: linear-gradient(to right, rgba(0,0,0,0.8), transparent);
        }
        .masked-overflow::after {
          float: right;
          background: linear-gradient(to left, rgba(0,0,0,0.8), transparent);
        }
      `}</style>

    </main>
  );
}

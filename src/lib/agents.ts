import { AI_SAAS } from "@/lib/aiSaas";

export type Agent = {
  slug: string;
  title: string;
  short: string;
  courseId: string;
  purchaseUrl?: string;
  openPath?: string;
  lectureId?: number | null;
};

function uuid(i: number) {
  return `00000000-0000-0000-0000-${String(i).padStart(12, "0")}`;
}

export const AGENTS: Agent[] = [
  {
    slug: "ai-saas",
    title: "AI SAAS",
    short: "Système SaaS à 199",
    courseId: AI_SAAS.COURSE_ID,
    purchaseUrl: "https://buy.tosspayments.com/products/OUBlcklySQ?shopId=prYvBlbMPskc",
    openPath: "/me/ai-saas",
  },
  {
    slug: "ai-saju",
    title: "AI 사주",
    short: "사주 분석 & 리딩",
    courseId: "00000000-0000-0000-0000-00000000a1b2",
    openPath: "/me/ai-saju",
    purchaseUrl: "/lecture/19",
    lectureId: 19,
  },
  { slug: "agent-03", title: "Agent 03", short: "Copywriting", courseId: uuid(3), purchaseUrl: "/products" },
  { slug: "agent-04", title: "Agent 04", short: "SEO Booster", courseId: uuid(4), purchaseUrl: "/products" },
  { slug: "agent-05", title: "Agent 05", short: "Sales Funnel", courseId: uuid(5), purchaseUrl: "/products" },
  { slug: "agent-06", title: "Agent 06", short: "CRM Helper", courseId: uuid(6), purchaseUrl: "/products" },
  { slug: "agent-07", title: "Agent 07", short: "Email Drip", courseId: uuid(7), purchaseUrl: "/products" },
  { slug: "agent-08", title: "Agent 08", short: "Market Research", courseId: uuid(8), purchaseUrl: "/products" },
  { slug: "agent-09", title: "Agent 09", short: "Cold Outreach", courseId: uuid(9), purchaseUrl: "/products" },
  { slug: "agent-10", title: "Agent 10", short: "Lead Scoring", courseId: uuid(10), purchaseUrl: "/products" },
  { slug: "agent-11", title: "Agent 11", short: "CS Assistant", courseId: uuid(11), purchaseUrl: "/products" },
  { slug: "agent-12", title: "Agent 12", short: "Docs Summarizer", courseId: uuid(12), purchaseUrl: "/products" },
  { slug: "agent-13", title: "Agent 13", short: "Video Script", courseId: uuid(13), purchaseUrl: "/products" },
  { slug: "agent-14", title: "Agent 14", short: "UGC Maker", courseId: uuid(14), purchaseUrl: "/products" },
  { slug: "agent-15", title: "Agent 15", short: "Creative Ads", courseId: uuid(15), purchaseUrl: "/products" },
  { slug: "agent-16", title: "Agent 16", short: "A/B Testing", courseId: uuid(16), purchaseUrl: "/products" },
  { slug: "agent-17", title: "Agent 17", short: "Pricing Optim", courseId: uuid(17), purchaseUrl: "/products" },
  { slug: "agent-18", title: "Agent 18", short: "Retention", courseId: uuid(18), purchaseUrl: "/products" },
  { slug: "agent-19", title: "Agent 19", short: "Support Bot", courseId: uuid(19), purchaseUrl: "/products" },
  { slug: "agent-20", title: "Agent 20", short: "FAQ Builder", courseId: uuid(20), purchaseUrl: "/products" },
  { slug: "agent-21", title: "Agent 21", short: "Invoices AI", courseId: uuid(21), purchaseUrl: "/products" },
  { slug: "agent-22", title: "Agent 22", short: "Sales Scripts", courseId: uuid(22), purchaseUrl: "/products" },
  { slug: "agent-23", title: "Agent 23", short: "HR Assistant", courseId: uuid(23), purchaseUrl: "/products" },
  { slug: "agent-24", title: "Agent 24", short: "OKR Coach", courseId: uuid(24), purchaseUrl: "/products" },
  { slug: "agent-25", title: "Agent 25", short: "Investor Deck", courseId: uuid(25), purchaseUrl: "/products" },
  { slug: "agent-26", title: "Agent 26", short: "Data Cleaner", courseId: uuid(26), purchaseUrl: "/products" },
  { slug: "agent-27", title: "Agent 27", short: "KPI Alerts", courseId: uuid(27), purchaseUrl: "/products" },
  { slug: "agent-28", title: "Agent 28", short: "Scheduler", courseId: uuid(28), purchaseUrl: "/products" },
  { slug: "agent-29", title: "Agent 29", short: "Docs QA", courseId: uuid(29), purchaseUrl: "/products" },
  { slug: "agent-30", title: "Agent 30", short: "Builder Kit", courseId: uuid(30), purchaseUrl: "/products" },
];

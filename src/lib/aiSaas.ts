
export const AI_SAAS = {
  COURSE_ID: "00000000-0000-0000-0000-000000000199",
  TENANT_ID: "00000000-0000-0000-0000-000000000000",
  AGREEMENT_KEY: "ai-saas",
  WATTSIGN_LINK:
    "https://app.wattsign.com/sign/link/4670c4f079d445d487ef485cf8489646",
  DOC_URL:
    "https://docs.google.com/document/d/1Uq0Vi3mEyj50HbewYuCV_vJ4VUi2tTKqTLkLvzbosKs/edit?usp=sharing",
  PRODUCT_URL:
    "https://buy.tosspayments.com/products/OUBlcklySQ?shopId=prYvBlbMPskc",
  PRICE: {
    list: 5_000_000,   // 정가 500만원
    discount: 3_010_000, // 할인금액 301만원
    pay: 1_990_000,    // 실제 결제금액 199만원
    currency: "KRW",
  },
} as const;

export type AiSaasConfig = typeof AI_SAAS;

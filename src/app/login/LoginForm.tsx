"use client";

import { useEffect, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";


function ErrorModal({
  open,
  title,
  message,
  onClose,
}: {
  open: boolean;
  title: string;
  message: string;
  onClose: () => void;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative w-full max-w-sm rounded-2xl border border-white/10 bg-[#0b0b0b] p-5 text-white shadow-2xl">
        <h2 className="mb-2 text-lg font-semibold">{title}</h2>
        <p className="mb-4 text-sm text-white/80">{message}</p>
        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="rounded-md border border-white/15 px-3 py-1.5 text-sm hover:bg-white/5"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}

// 🔧 Accept null as well to satisfy TS
function mapAuthError(code?: string | null) {
  switch (code) {
    case "CredentialsSignin":
      return "이메일 또는 비밀번호가 올바르지 않습니다.";
    case "OAuthAccountNotLinked":
      return "같은 이메일의 계정이 이미 존재합니다. 비밀번호 로그인을 사용해 주세요.";
    case "OAuthSignin":
    case "OAuthCallback":
      return "외부 로그인 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.";
    default:
      return "로그인에 실패했습니다. 정보를 확인하고 다시 시도해 주세요.";
  }
}

export default function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const callbackUrl = params.get("callbackUrl") || "/";
  const [errMsg, setErrMsg] = useState<string | null>(null);

  useEffect(() => {
    const code = params.get("error");
    if (code) setErrMsg(mapAuthError(code));
  }, [params]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrMsg(null);
    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
      callbackUrl,
    });
    if (res?.ok) {
      router.push(callbackUrl);
    } else {
      // 🔧 Coerce null to undefined for the helper
      setErrMsg(mapAuthError(res?.error ?? undefined));
    }
  }

  function signInKakao() {
    setErrMsg(null);
    signIn("kakao", { callbackUrl });
  }

  return (
    <main className="relative min-h-screen bg-black text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_60%_at_50%_-10%,rgba(229,9,20,0.35),transparent_60%)]" />
      <div className="absolute inset-0 bg-[url('/noise.png')] opacity-20 mix-blend-overlay" aria-hidden />

      <header className="relative z-10 flex items-center justify-center py-8">
        <Link href="/" className="inline-flex items-center gap-3">
          <Image src="/mooncheonmaker_w_ribbon_icon.svg" alt="Logo" width={36} height={36} />
          <span className="text-xl font-semibold tracking-wide">월천메이커 AI</span>
        </Link>
      </header>

      <section className="relative z-10 mx-auto w-full max-w-md px-6 pb-16">
        <div className="rounded-2xl border border-white/10 bg-black/60 p-6 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.7)] backdrop-blur">
          <h1 className="mb-6 text-3xl font-bold">로그인</h1>

          <form onSubmit={onSubmit} className="space-y-4" noValidate>
            <div>
              <input
                className="w-full rounded-md border border-white/20 bg-black/40 px-4 py-3 outline-none placeholder-white/50 focus:border-white/30 focus:ring-2 focus:ring-red-600/70"
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
              />
            </div>
            <div>
              <input
                className="w-full rounded-md border border-white/20 bg-black/40 px-4 py-3 outline-none placeholder-white/50 focus:border-white/30 focus:ring-2 focus:ring-red-600/70"
                type="password"
                placeholder="Mot de passe"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
            </div>

            <button
              className="w-full rounded-md bg-red-600 py-3 font-semibold transition hover:bg-red-700"
              type="submit"
            >
              연결
            </button>

            <p aria-live="polite" className="sr-only">
              {errMsg ? "로그인 오류" : ""}
            </p>
          </form>

          <div className="my-5 h-px w-full bg-white/10" />

          <button
            onClick={signInKakao}
            className="w-full rounded-md bg-[#FEE500] py-3 font-medium text-black transition hover:brightness-95"
          >
            KakaoTalk로 계속하기
          </button>

          <p className="mt-6 text-center text-sm text-white/70">
            계정이 없으신가요?{" "}
            <Link href="/register" className="text-white hover:underline">
              계정 만들기
            </Link>
          </p>
        </div>

        <p className="mt-6 text-center text-xs text-white/40">
          본 서비스 사용 시 약관 및 개인정보 처리방침에 동의하게 됩니다.
        </p>
      </section>

      <ErrorModal
        open={!!errMsg}
        title="로그인 실패"
        message={errMsg ?? ""}
        onClose={() => setErrMsg(null)}
      />
    </main>
  );
}

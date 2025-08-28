"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";
import { supabase } from "@/utils/supabase";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // 1) Auth
      const { data, error: signInErr } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (signInErr) {
        setError(signInErr.message);
        return;
      }
      const user = data.user;
      if (!user) {
        setError("로그인에 실패했습니다.");
        return;
      }

      // 2) Lire le rôle depuis profiles (id == auth.uid)
      const { data: profile, error: profileErr } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();

      if (profileErr) {
        // Optionnel: on peut signOut pour être propre
        await supabase.auth.signOut();
        setError("프로필 조회 중 오류가 발생했습니다.");
        return;
      }

      const role = (profile?.role || "").toString().toUpperCase();

      if (role !== "ADMIN") {
        await supabase.auth.signOut(); // Bloque l'accès si non-admin
        setError("관리자 계정만 로그인할 수 있습니다.");
        return;
      }

      // 3) OK: rediriger vers /admin
      router.push("/admin");
    } catch (err) {
      setError("로그인 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-black px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 rounded-2xl border border-white/10 bg-[#141414] p-8 text-white shadow-sm">
        <div>
          <h2 className="mt-1 text-center text-3xl font-bold text-white">관리자 로그인</h2>
          <p className="mt-2 text-center text-sm text-white/70">N잡 AI 관리자 계정으로 로그인하세요</p>
        </div>

        <form className="mt-6 space-y-6" onSubmit={handleLogin}>
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="sr-only">이메일</label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Mail className="h-5 w-5 text-white/60" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full rounded-lg border border-white/20 bg-white/10 py-3 pr-3 pl-10 text-white placeholder-white/50 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="이메일 주소"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="sr-only">비밀번호</label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Lock className="h-5 w-5 text-white/60" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full rounded-lg border border-white/20 bg-white/10 py-3 pr-10 pl-10 text-white placeholder-white/50 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="비밀번호"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-white/70 hover:text-white"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>
          </div>

          {error && (
            <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={loading || !email || !password}
              className="group relative flex w-full justify-center rounded-lg border border-transparent bg-white px-4 py-3 text-sm font-medium text-black transition-colors hover:bg-white/90 focus:outline-none focus:ring-2 focus:ring-black/30 focus:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? (
                <>
                  <svg className="mr-3 -ml-1 h-5 w-5 animate-spin text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  로그인 중...
                </>
              ) : (
                "로그인"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

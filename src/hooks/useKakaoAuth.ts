import { useState, useEffect, useRef } from "react";
import { User } from "@supabase/supabase-js";
import { supabase } from "@/utils/supabase";

interface KakaoAuthOptions {
  // 추가 쿼리 파라미터 (예: funnel=true)
  additionalParams?: Record<string, string>;
  // 로그인 성공 후 콜백
  onLoginSuccess?: (user: User) => void;
  // sessionStorage에 로그인 시도 저장할 키
  sessionStorageKey?: string;
}

export function useKakaoAuth(options: KakaoAuthOptions = {}) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);

  const handleKakaoLogin = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // 현재 페이지 경로를 저장
      const currentPath = window.location.pathname + window.location.search;

      // 브라우저의 현재 origin을 사용하여 더 안전하게 처리
      const baseURL = window.location.origin;

      // 리다이렉트 URL 생성
      const params = new URLSearchParams({
        next: currentPath,
        ...options.additionalParams,
      });
      const redirectTo = `${baseURL}/api/auth/callback?${params.toString()}`;

      // sessionStorage에 로그인 시도 저장 (옵션)
      if (options.sessionStorageKey) {
        sessionStorage.setItem(options.sessionStorageKey, "true");
      }

      const { error } = await supabase.auth.signInWithOAuth({
        provider: "kakao",
        options: {
          queryParams: {
            scope: "name account_email phone_number",
          },
          redirectTo: redirectTo,
        },
      });

      if (error) {
        console.error("Kakao login error:", error);
        setError("로그인 중 오류가 발생했습니다. 다시 시도해 주세요.");

        // 에러 시 sessionStorage 정리
        if (options.sessionStorageKey) {
          sessionStorage.removeItem(options.sessionStorageKey);
        }
      }
    } catch (err) {
      console.error("Unexpected error:", err);
      setError("로그인 중 오류가 발생했습니다. 다시 시도해 주세요.");

      // 에러 시 sessionStorage 정리
      if (options.sessionStorageKey) {
        sessionStorage.removeItem(options.sessionStorageKey);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // onLoginSuccess를 ref로 관리하여 불필요한 재실행 방지
  const onLoginSuccessRef = useRef(options.onLoginSuccess);
  onLoginSuccessRef.current = options.onLoginSuccess;

  // 이미 콜백이 실행되었는지 추적
  const hasCalledCallbackRef = useRef(false);

  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        setUser(user);
      }
    };

    checkAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        setUser(session.user);

        // SIGNED_IN 이벤트일 때만 로그인 성공 콜백 실행
        // 그리고 한 번만 실행되도록 보장
        if (event === 'SIGNED_IN' && onLoginSuccessRef.current && !hasCalledCallbackRef.current) {
          hasCalledCallbackRef.current = true;
          onLoginSuccessRef.current(session.user);
        }
      } else {
        setUser(null);
        // 로그아웃 시 콜백 상태 초기화
        if (event === 'SIGNED_OUT') {
          hasCalledCallbackRef.current = false;
        }
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []); // dependency를 빈 배열로 변경

  return {
    isLoading,
    error,
    user,
    handleKakaoLogin,
    isKakaoUser: user?.app_metadata?.provider === "kakao",
  };
}

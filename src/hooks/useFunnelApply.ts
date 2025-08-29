import { useCallback, useState } from "react";
import { User } from "@supabase/supabase-js";
import { useKakaoAuth } from "./useKakaoAuth";
import { supabase } from "@/utils/supabase";

const SESSION_STORAGE_KEY = "funnelKakaoLoginAttempt";
const WEBHOOK_TRIGGERED_KEY = "funnelWebhookTriggered";

export function useFunnelApply() {
  const [hasTriggeredWebhook, setHasTriggeredWebhook] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const triggerWebhook = useCallback(async (user: User) => {
    // 세션 스토리지에서 이미 웹훅을 트리거했는지 확인
    const webhookTriggered = sessionStorage.getItem(`${WEBHOOK_TRIGGERED_KEY}_${user.id}`);
    if (hasTriggeredWebhook || webhookTriggered === "true" || isProcessing) return;
    
    setIsProcessing(true);
    
    const { data: profile } = await supabase
      .from("profiles")
      .select("name, email, phone_number")
      .eq("id", user.id)
      .single();

    if (profile?.name && profile?.email && profile?.phone_number) {
      try {
        await fetch("/api/webinar-noti", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: profile.name,
            email: profile.email,
            phone_number: profile.phone_number,
          }),
        });
        setHasTriggeredWebhook(true);
        // 세션 스토리지에 웹훅 트리거 상태 저장
        sessionStorage.setItem(`${WEBHOOK_TRIGGERED_KEY}_${user.id}`, "true");
      } catch (error) {
        // 웹훅 호출 실패는 무시
      } finally {
        setIsProcessing(false);
      }
    }
  }, []);

  const onLoginSuccess = useCallback(
    async (user: User) => {
      const loginAttempt = sessionStorage.getItem(SESSION_STORAGE_KEY);

      if (loginAttempt && user.app_metadata?.provider === "kakao") {
        // 로그인 시도가 있었고, 카카오로 로그인한 경우

        // profiles 테이블에서 사용자 정보 가져오기
        // TODO api 함수 분리
        const { data: profile } = await supabase
          .from("profiles")
          .select("name, email, phone_number")
          .eq("id", user.id)
          .single();

        const userName = profile?.name || user.email?.split("@")[0] || "사용자";
        sessionStorage.setItem("userName", userName);
        sessionStorage.removeItem(SESSION_STORAGE_KEY);

        // n8n 웹훅 트리거
        await triggerWebhook(user);
      }
    },
    [triggerWebhook],
  );

  const { isLoading, error, user, handleKakaoLogin } = useKakaoAuth({
    additionalParams: { next: "/detail", funnel: "true" },
    sessionStorageKey: SESSION_STORAGE_KEY,
    onLoginSuccess,
  });

  // 이미 로그인된 사용자가 버튼을 클릭한 경우 처리
  const handleLoginButtonClick = useCallback(async () => {
    // 이미 로그인된 경우 직접 웹훅 트리거
    if (user) {
      sessionStorage.setItem(SESSION_STORAGE_KEY, "true");
      await triggerWebhook(user);
      sessionStorage.removeItem(SESSION_STORAGE_KEY);
      // 로그인 성공 후 리다이렉트
      window.location.href = "/detail";
    } else {
      // 로그인되지 않은 경우 카카오 로그인
      handleKakaoLogin();
    }
  }, [user, triggerWebhook, handleKakaoLogin]);

  return {
    isLoading,
    error,
    user,
    handleKakaoLogin: handleLoginButtonClick,
  };
}

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";
import { formatPhoneNumberToKorean } from "@/utils/phoneNumber";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next");

  if (code) {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!, // server-only
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options),
              );
            } catch {
              // Called from a Server Component -> ignore
            }
          },
        },
      },
    );

    const { data: sessionData, error } =
      await supabase.auth.exchangeCodeForSession(code);

    if (!error && sessionData?.session) {
      const { session } = sessionData;

      // 1) If Kakao: try to enrich the profile (non-blocking for the rest)
      if (
        session.user.app_metadata?.provider === "kakao" &&
        session.provider_token
      ) {
        try {
          const kakaoResponse = await fetch(
            "https://kapi.kakao.com/v2/user/me",
            {
              headers: {
                Authorization: `Bearer ${session.provider_token}`,
              },
            },
          );

          if (kakaoResponse.ok) {
            const kakaoData = await kakaoResponse.json();

            const updates: { phone_number?: string; name?: string } = {};

            if (kakaoData.kakao_account?.phone_number) {
              updates.phone_number = formatPhoneNumberToKorean(
                kakaoData.kakao_account.phone_number,
              );
            }
            if (kakaoData.kakao_account?.name) {
              updates.name = kakaoData.kakao_account.name;
            }

            if (!updates.name || !updates.phone_number) {
              console.error("Critical: Missing required user info from Kakao:", {
                kakaoAccount: kakaoData.kakao_account,
                properties: kakaoData.properties,
                updates: updates,
              });

              // Redirect to a dedicated error page if missing info
              return NextResponse.redirect(
                `${requestUrl.origin}/error?message=${encodeURIComponent(
                  "카카오 계정에서 필수 정보(이름, 전화번호)를 가져올 수 없습니다. 카카오 계정 설정을 확인해주세요.",
                )}`,
              );
            }

            // Upsert profil
            const profileData = {
              id: session.user.id,
              email: session.user.email || "",
              name: updates.name,
              phone_number: updates.phone_number,
              updated_at: new Date().toISOString(),
            };

            const { data: profileResult, error: profileError } = await supabase
              .from("profiles")
              .upsert(profileData)
              .select();

            if (profileError) {
              console.error("Profile upsert error:", profileError);
            } else {
              console.log("Profile created/updated successfully:", profileResult);
              
              // 웹훅 트리거 (funnel=true 파라미터가 있을 때만)
              const funnel = requestUrl.searchParams.get("funnel");
              if (funnel === "true" && profileData.name && profileData.email && profileData.phone_number) {
                try {
                  const webhookUrl = `${requestUrl.origin}/api/webinar-noti`;
                  await fetch(webhookUrl, {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                      name: profileData.name,
                      email: profileData.email,
                      phone_number: profileData.phone_number,
                    }),
                  });
                  console.log("Webhook triggered successfully");
                } catch (webhookError) {
                  console.error("Failed to trigger webhook:", webhookError);
                }
              }
            }
          }
        } catch (e) {
          console.error("Failed to fetch Kakao user info:", e);
        }
      }

      // 2) Auto-tenant & membership — execute whatever happens after login
      try {
        const { data: hasMember, error: mErr } = await supabase
          .from("tenant_members")
          .select("id")
          .eq("user_id", session.user.id)
          .limit(1);

        const alreadyMember = !!hasMember && hasMember.length > 0;

        if (!mErr && !alreadyMember) {
          // Fallbacks strong for workspace name
          const userMeta: any = session.user.user_metadata || {};
          const workspaceBase =
            (userMeta.name as string) ||
            (userMeta.full_name as string) ||
            (session.user.email?.split("@")[0] as string) ||
            "내";

          const workspaceName = `${workspaceBase} 워크스페이스`;

          // 1) Create a tenant
          const { data: tenant, error: tErr } = await supabase
            .from("tenants")
            .insert({ name: workspaceName })
            .select("id")
            .single();

          if (tErr) throw tErr;

          // 2) Add the member OWNER
          const { error: addErr } = await supabase.from("tenant_members").insert({
            tenant_id: tenant.id,
            user_id: session.user.id,
            email: session.user.email ?? "",
            role: "OWNER",
          });

          if (addErr) throw addErr;

          console.log("Tenant & membership bootstrapped:", {
            user: session.user.id,
            tenant: (tenant as any)?.id,
          });
        }
      } catch (e) {
        console.error("Failed to create tenant/membership:", e);
      }
    }
  }

  // 로그인 후 리디렉션될 URL
  if (next) {
    return NextResponse.redirect(requestUrl.origin + next);
  }
  return NextResponse.redirect(requestUrl.origin);
}

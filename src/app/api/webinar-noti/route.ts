import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, phone_number } = body;

    // 필수 필드 검증
    if (!name || !email || !phone_number) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    // n8n 웹훅으로 전달
    const response = await fetch(
      "https://primary-production-0d400.up.railway.app/webhook/webinar-noti",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          email,
          phone_number,
        }),
      },
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: "Failed to trigger webhook", status: response.status },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      message: "Webhook triggered successfully",
    });
  } catch (error) {
    // 오류 발생 시 무시
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

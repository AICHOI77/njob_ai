import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcryptjs";

function getDb() {
  const url = process.env.SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(url, key, { auth: { persistSession: false } });
}

export async function POST(req: Request) {
  try {
    const { email, password, name } = await req.json();
    if (!email || !password) {
      return NextResponse.json({ message: "이메일 주소와 비밀번호가 필요합니다." }, { status: 400 });
    }

    const emailNorm = String(email).trim().toLowerCase();
    const hash = await bcrypt.hash(String(password), 10);
    const db = getDb();

    const { data: existsAuthUser } = await db
      .from("auth_users")
      .select("id")
      .eq("email", emailNorm)
      .maybeSingle();

    if (existsAuthUser) {
      return NextResponse.json({ message: "이 이메일 주소로 이미 계정이 생성되었습니다." }, { status: 409 });
    }

    let userId: string | null = null;
    const { data: created, error: createErr } = await db.auth.admin.createUser({
      email: emailNorm,
      password: String(password),
      email_confirm: true,
      user_metadata: { name: name || "" },
    });

    if (createErr) {
      const already = /already.*registered/i.test(createErr.message || "");
      if (!already) {
        return NextResponse.json({ message: createErr.message }, { status: 500 });
      }

      let page = 1;
      const perPage = 1000;
      for (;;) {
        const { data: pageData, error: listErr } = await db.auth.admin.listUsers({ page, perPage });
        if (listErr) {
          return NextResponse.json({ message: listErr.message }, { status: 500 });
        }
        const found = pageData.users.find(
          (u) => (u.email || "").toLowerCase() === emailNorm
        );
        if (found) {
          userId = found.id;
          break;
        }
        if (pageData.users.length < perPage) break;
        page += 1;
      }

      if (!userId) {
        return NextResponse.json(
          { message: "A user with this email address has already been registered" },
          { status: 409 }
        );
      }
    } else {
      userId = created?.user?.id ?? null;
    }

    if (!userId) {
      return NextResponse.json({ message: "Impossible de créer ou récupérer l'utilisateur auth." }, { status: 500 });
    }

    const { error: mirrorErr } = await db
      .from("auth_users")
      .upsert(
        {
          id: userId,
          email: emailNorm,
          password_hash: hash,
          name: name || null,
        },
        { onConflict: "id" }
      );
    if (mirrorErr) {
      return NextResponse.json({ message: mirrorErr.message }, { status: 500 });
    }

    const { error: profErr } = await db
      .from("profiles")
      .upsert(
        {
          id: userId,
          email: emailNorm,
          name: name || "",
          phone_number: "",
          role: "USER",
        },
        { onConflict: "id" }
      );
    if (profErr) {
      return NextResponse.json({ message: profErr.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ ok: false, message: e?.message || "Error server" }, { status: 500 });
  }
}

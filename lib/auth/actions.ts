"use server";

/**
 * 관리자 인증 모듈
 * ─────────────────────────────────────────────────────
 * 자격증명은 환경변수로 관리하고, 로그인 성공 시 추측 불가능한
 * 시크릿 토큰(AUTH_SECRET)을 HTTP-only 쿠키로 발급한다.
 * 미들웨어가 이 쿠키 값을 AUTH_SECRET과 대조해 인증을 검증한다.
 *
 * 필요한 환경변수:
 *   ADMIN_ID        관리자 아이디
 *   ADMIN_PASSWORD  관리자 비밀번호
 *   AUTH_SECRET     세션 쿠키에 저장될 시크릿 토큰 (길고 랜덤하게)
 */

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const AUTH_COOKIE_NAME = "ieo_admin_auth";

export async function login(
  prevState: { error: string } | null,
  formData: FormData,
) {
  const id = formData.get("id");
  const password = formData.get("password");

  const expectedId = process.env.ADMIN_ID;
  const expectedPassword = process.env.ADMIN_PASSWORD;
  const sessionToken = process.env.AUTH_SECRET;

  if (!expectedId || !expectedPassword || !sessionToken) {
    return { error: "서버 인증 설정이 누락되었습니다. 관리자에게 문의하세요." };
  }

  if (id === expectedId && password === expectedPassword) {
    const cookieStore = await cookies();
    cookieStore.set(AUTH_COOKIE_NAME, sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 1주일
      path: "/",
    });
    redirect("/admin");
  }

  return { error: "아이디 또는 비밀번호가 올바르지 않습니다." };
}

export async function logout() {
  const cookieStore = await cookies();
  cookieStore.delete(AUTH_COOKIE_NAME);
  redirect("/login");
}

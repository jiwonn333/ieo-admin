"use server";

/**
 * 목업 인증 모듈
 * ─────────────────────────────────────────────────────
 * 현재는 하드코딩 자격증명 + HTTP-only 쿠키 방식으로 구현.
 * 향후 Firebase Auth 또는 별도 관리자 권한 시스템으로 교체 시
 * 이 파일만 수정하면 된다.
 *
 * 교체 포인트:
 *   1. MOCK_CREDENTIALS → Firebase signInWithEmailAndPassword() 등
 *   2. 쿠키 → Firebase ID Token 검증 또는 세션 쿠키
 */

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

// TODO: 실 서비스 전환 시 이 블록을 Firebase Auth로 교체
const MOCK_CREDENTIALS = {
  id: "ieo",
  password: "9999",
} as const;

const AUTH_COOKIE_NAME = "ieo_admin_auth";

export async function login(
  prevState: { error: string } | null,
  formData: FormData,
) {
  const id = formData.get("id");
  const password = formData.get("password");

  if (id === MOCK_CREDENTIALS.id && password === MOCK_CREDENTIALS.password) {
    const cookieStore = await cookies();
    cookieStore.set(AUTH_COOKIE_NAME, "true", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
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

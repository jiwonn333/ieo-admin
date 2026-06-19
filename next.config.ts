import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 상위 디렉터리의 떠돌이 lockfile 때문에 Turbopack 이 워크스페이스 루트를
  // 잘못 추론(→ next 패키지 못 찾아 패닉)하는 문제 방지. 프로젝트 루트로 고정.
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;

// Cloudflare (OpenNext) — 로컬 `next dev`에서 Worker 바인딩/환경변수를 사용할 수 있게 함
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";
initOpenNextCloudflareForDev();

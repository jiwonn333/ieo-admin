import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/**
 * 지연 초기화 Supabase 클라이언트
 * ─────────────────────────────────────────────────────
 * Cloudflare Workers(OpenNext)에서는 런타임 시크릿(SUPABASE_SERVICE_ROLE_KEY 등)이
 * "요청 컨텍스트 안"에서만 process.env에 채워진다. 모듈 최상단에서 createClient를
 * 호출하면 콜드스타트 시점에 키가 undefined라 'Invalid API key'로 깨진다.
 * 따라서 실제 사용 시점(첫 프로퍼티 접근)에 클라이언트를 생성하도록 Proxy로 감싼다.
 * (기존 `supabase`/`supabaseAdmin` import 이름과 사용법은 그대로 유지)
 */

function lazyClient(factory: () => SupabaseClient): SupabaseClient {
  let instance: SupabaseClient | null = null;
  const get = () => (instance ??= factory());

  return new Proxy({} as SupabaseClient, {
    get(_target, prop, receiver) {
      const client = get();
      const value = Reflect.get(client as object, prop, receiver);
      return typeof value === 'function' ? value.bind(client) : value;
    },
  });
}

export const supabase = lazyClient(() =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  ),
);

export const supabaseAdmin = lazyClient(() =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  ),
);

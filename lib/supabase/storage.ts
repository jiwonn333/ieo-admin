import { supabaseAdmin } from './client';
import type { VerificationFile } from '@/features/admin/types';

// 인증서류는 비공개 버킷(verification-documents)에 있어 public URL 로는 못 본다.
// 서버(service_role)에서 임시 서명 URL 을 만들어 클라이언트에 내려준다.
const SIGNED_URL_TTL_SECONDS = 60 * 60; // 1시간

/**
 * 파일 목록 각각에 임시 서명 URL(signed_url)을 부여한다.
 * service_role 키는 서버에만 머물러야 하므로 반드시 서버측에서 호출할 것.
 */
export async function attachSignedUrls(
  files: VerificationFile[] | null | undefined,
): Promise<VerificationFile[]> {
  if (!files || files.length === 0) return files ?? [];

  return Promise.all(
    files.map(async (file) => {
      if (!file.storage_bucket || !file.storage_path) return file;

      const { data, error } = await supabaseAdmin.storage
        .from(file.storage_bucket)
        .createSignedUrl(file.storage_path, SIGNED_URL_TTL_SECONDS);

      if (error || !data) {
        console.error('createSignedUrl failed:', file.storage_path, error?.message);
        return file;
      }

      return { ...file, signed_url: data.signedUrl };
    }),
  );
}

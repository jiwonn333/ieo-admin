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

/**
 * 검토 완료(승인/반려)된 인증의 서류 원본(Storage) + 메타행을 삭제한다.
 * "검토 완료 후 원본 자동 삭제" 개인정보 약속 이행. service_role 필요.
 * profile_photo 는 member_verification_files 가 없어 영향 없음(프로필 사진 보존).
 */
export async function deleteVerificationFiles(verificationId: string): Promise<void> {
  const { data: files, error } = await supabaseAdmin
    .from('member_verification_files')
    .select('storage_bucket, storage_path')
    .eq('verification_id', verificationId);

  if (error) {
    console.error('deleteVerificationFiles: 파일 조회 실패:', error.message);
    return;
  }
  if (!files || files.length === 0) return;

  // 버킷별로 묶어 Storage 원본 삭제
  const byBucket = new Map<string, string[]>();
  for (const f of files) {
    if (!f.storage_bucket || !f.storage_path) continue;
    const paths = byBucket.get(f.storage_bucket) ?? [];
    paths.push(f.storage_path);
    byBucket.set(f.storage_bucket, paths);
  }
  for (const [bucket, paths] of byBucket) {
    const { error: rmError } = await supabaseAdmin.storage.from(bucket).remove(paths);
    if (rmError) console.error('deleteVerificationFiles: Storage 삭제 실패:', bucket, rmError.message);
  }

  // 메타행 삭제
  const { error: delError } = await supabaseAdmin
    .from('member_verification_files')
    .delete()
    .eq('verification_id', verificationId);
  if (delError) console.error('deleteVerificationFiles: 메타행 삭제 실패:', delError.message);
}

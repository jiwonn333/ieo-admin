import { supabaseAdmin } from './client';
import { attachSignedUrls } from './storage';
import type { Member, AppStatus } from '@/features/admin/types';

/**
 * 전체 회원 목록 조회 (인증 정보 포함)
 */
export async function getMembers(): Promise<Member[]> {
  const { data, error } = await supabaseAdmin
    .from('members')
    .select(`
      *,
      member_verifications (
        id,
        member_id,
        verification_type,
        status,
        submitted_at,
        reviewed_at,
        rejection_reason,
        created_at,
        updated_at
      )
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Failed to fetch members:', error);
    return [];
  }

  return data as Member[];
}

/**
 * 단일 회원 조회 (인증 정보 + 파일 포함)
 */
export async function getMemberById(id: string): Promise<Member | null> {
  const { data, error } = await supabaseAdmin
    .from('members')
    .select(`
      *,
      member_verifications (
        id,
        member_id,
        verification_type,
        status,
        submitted_at,
        reviewed_at,
        rejection_reason,
        created_at,
        updated_at,
        member_verification_files (
          id,
          verification_id,
          member_id,
          storage_bucket,
          storage_path,
          original_filename,
          mime_type,
          created_at
        )
      )
    `)
    .eq('id', id)
    .single();

  if (error) {
    console.error('Failed to fetch member:', error);
    return null;
  }

  const member = data as Member;
  // 비공개 버킷 서류에 서명 URL 부여 (미리보기용).
  if (member.member_verifications) {
    await Promise.all(
      member.member_verifications.map(async (v) => {
        if (v.member_verification_files) {
          v.member_verification_files = await attachSignedUrls(v.member_verification_files);
        }
      }),
    );
  }

  return member;
}

/**
 * 회원 앱 상태 변경
 */
export async function updateMemberStatus(id: string, status: AppStatus): Promise<boolean> {
  const { error } = await supabaseAdmin
    .from('members')
    .update({ app_status: status })
    .eq('id', id);

  if (error) {
    console.error('Failed to update member status:', error);
    return false;
  }

  return true;
}

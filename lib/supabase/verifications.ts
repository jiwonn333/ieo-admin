import { supabaseAdmin } from './client';
import type { MemberVerification, VerificationQueueItem, VerificationStatus, VerificationType } from '@/features/admin/types';

/**
 * 인증 심사 큐 조회 (회원 정보 포함)
 */
export async function getVerificationQueue(): Promise<VerificationQueueItem[]> {
  const { data, error } = await supabaseAdmin
    .from('member_verifications')
    .select(`
      id,
      member_id,
      verification_type,
      status,
      submitted_at,
      reviewed_at,
      rejection_reason,
      members!inner (
        real_name,
        app_nickname
      ),
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
    `)
    .order('submitted_at', { ascending: false });

  if (error) {
    console.error('Failed to fetch verification queue:', error);
    return [];
  }

  return (data ?? []).map((row: Record<string, unknown>) => {
    const member = row.members as { real_name: string | null; app_nickname: string | null } | null;
    return {
      id: row.id as string,
      member_id: row.member_id as string,
      member_name: member?.real_name ?? null,
      member_nickname: member?.app_nickname ?? null,
      verification_type: row.verification_type as VerificationType,
      status: row.status as VerificationStatus,
      submitted_at: row.submitted_at as string | null,
      reviewed_at: row.reviewed_at as string | null,
      rejection_reason: row.rejection_reason as string | null,
      files: (row.member_verification_files ?? []) as VerificationQueueItem['files'],
    };
  });
}

/**
 * 인증 상태 업데이트
 * - profile_photo 승인 시 → members.app_status = 'active'
 * - profile_photo 반려 시 → members.app_status = 'rejected'
 * - profile_photo 심사중 복귀 시 → members.app_status = 'pending_review'
 */
export async function updateVerificationStatus(
  verificationId: string,
  status: VerificationStatus,
  rejectionReason?: string,
): Promise<boolean> {
  // 1. 해당 verification 레코드 조회 (verification_type, member_id 확인)
  const { data: verification, error: fetchError } = await supabaseAdmin
    .from('member_verifications')
    .select('verification_type, member_id')
    .eq('id', verificationId)
    .single();

  if (fetchError || !verification) {
    console.error('Failed to fetch verification:', fetchError);
    return false;
  }

  // 2. verification 상태 업데이트
  const updateData: Record<string, unknown> = {
    status,
    reviewed_at: new Date().toISOString(),
  };

  if (status === 'rejected' && rejectionReason) {
    updateData.rejection_reason = rejectionReason;
  }

  if (status === 'approved') {
    updateData.rejection_reason = null;
  }

  const { error } = await supabaseAdmin
    .from('member_verifications')
    .update(updateData)
    .eq('id', verificationId);

  if (error) {
    console.error('Failed to update verification status:', error);
    return false;
  }

  // 3. profile_photo인 경우 members.app_status도 연동
  if (verification.verification_type === 'profile_photo') {
    let newAppStatus: string | null = null;

    if (status === 'approved') {
      newAppStatus = 'active';
    } else if (status === 'rejected') {
      newAppStatus = 'rejected';
    } else if (status === 'pending_review') {
      newAppStatus = 'pending_review';
    }

    if (newAppStatus) {
      const { error: memberError } = await supabaseAdmin
        .from('members')
        .update({ app_status: newAppStatus })
        .eq('id', verification.member_id);

      if (memberError) {
        console.error('Failed to update member app_status:', memberError);
        // verification은 이미 업데이트되었으므로 false 대신 true 반환
        // 하지만 로그에 남겨서 추적 가능하게
      }
    }
  }

  return true;
}

/**
 * 대시보드용 인증 통계 조회
 */
export async function getVerificationStats(): Promise<{
  pendingProfileCount: number;
  suspendedCount: number;
  activeCount: number;
  totalPendingVerifications: number;
}> {
  // 회원 상태별 카운트
  const [pendingRes, suspendedRes, activeRes, pendingVerifRes] = await Promise.all([
    supabaseAdmin.from('members').select('id', { count: 'exact', head: true }).eq('app_status', 'pending_review'),
    supabaseAdmin.from('members').select('id', { count: 'exact', head: true }).eq('app_status', 'suspended'),
    supabaseAdmin.from('members').select('id', { count: 'exact', head: true }).eq('app_status', 'active'),
    supabaseAdmin.from('member_verifications').select('id', { count: 'exact', head: true }).eq('status', 'pending_review'),
  ]);

  return {
    pendingProfileCount: pendingRes.count ?? 0,
    suspendedCount: suspendedRes.count ?? 0,
    activeCount: activeRes.count ?? 0,
    totalPendingVerifications: pendingVerifRes.count ?? 0,
  };
}


/**
 * 프로필 사진 인증 백필
 * - members.profile_image_urls가 존재하지만 member_verifications(profile_photo)가
 *   없거나 'unverified'인 회원을 찾아 'pending_review'로 전환
 * - approved / rejected / pending_review 레코드는 건드리지 않음 (멱등)
 */
export async function backfillProfilePhotoVerifications(): Promise<{
  scanned: number;
  inserted: number;
  updated: number;
  skipped: number;
  errors: Array<{ member_id: string; reason: string }>;
}> {
  const result = {
    scanned: 0,
    inserted: 0,
    updated: 0,
    skipped: 0,
    errors: [] as Array<{ member_id: string; reason: string }>,
  };

  // 1. profile_image_urls가 존재하는 회원 조회
  const { data: members, error: membersError } = await supabaseAdmin
    .from('members')
    .select('id, profile_image_urls')
    .not('profile_image_urls', 'is', null);

  if (membersError) {
    console.error('Failed to fetch members for backfill:', membersError);
    throw new Error(`Failed to fetch members: ${membersError.message}`);
  }

  const candidates = (members ?? []).filter(
    (m) => Array.isArray(m.profile_image_urls) && m.profile_image_urls.length > 0,
  );
  result.scanned = candidates.length;

  if (candidates.length === 0) return result;

  // 2. 해당 회원들의 profile_photo verification 일괄 조회
  const memberIds = candidates.map((m) => m.id as string);
  const { data: verifications, error: verError } = await supabaseAdmin
    .from('member_verifications')
    .select('id, member_id, status')
    .eq('verification_type', 'profile_photo')
    .in('member_id', memberIds);

  if (verError) {
    console.error('Failed to fetch verifications for backfill:', verError);
    throw new Error(`Failed to fetch verifications: ${verError.message}`);
  }

  const verByMember = new Map<string, { id: string; status: VerificationStatus }>();
  for (const v of verifications ?? []) {
    verByMember.set(v.member_id as string, {
      id: v.id as string,
      status: v.status as VerificationStatus,
    });
  }

  const now = new Date().toISOString();

  // 3. 회원별로 insert / update / skip 판정
  for (const member of candidates) {
    const memberId = member.id as string;
    const existing = verByMember.get(memberId);

    try {
      if (!existing) {
        // 3-a. 레코드 없음 → 신규 생성
        const { error: insertError } = await supabaseAdmin
          .from('member_verifications')
          .insert({
            member_id: memberId,
            verification_type: 'profile_photo',
            status: 'pending_review',
            submitted_at: now,
            reviewed_at: null,
            rejection_reason: null,
          });

        if (insertError) {
          result.errors.push({ member_id: memberId, reason: insertError.message });
        } else {
          result.inserted += 1;
        }
      } else if (existing.status === 'unverified') {
        // 3-b. 미제출 → 심사중 전환
        const { error: updateError } = await supabaseAdmin
          .from('member_verifications')
          .update({
            status: 'pending_review',
            submitted_at: now,
            reviewed_at: null,
            rejection_reason: null,
          })
          .eq('id', existing.id);

        if (updateError) {
          result.errors.push({ member_id: memberId, reason: updateError.message });
        } else {
          result.updated += 1;
        }
      } else {
        // 3-c. approved / rejected / pending_review → 보존
        result.skipped += 1;
      }
    } catch (e) {
      result.errors.push({
        member_id: memberId,
        reason: e instanceof Error ? e.message : 'unknown error',
      });
    }
  }

  return result;
}

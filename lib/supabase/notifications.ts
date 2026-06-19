import { supabaseAdmin } from './client';
import { getVerificationTypeLabel } from '@/features/admin/lib/presenters';
import type { VerificationType } from '@/features/admin/types';

/**
 * 인증 심사 결과를 회원에게 통지한다.
 * - 인앱 알림(notifications, type='verification_result') 생성 → 앱 알림함에 노출
 * - FCM 발송(queue_push RPC → send-fcm). 푸시 실패는 무시(인앱 알림은 유지).
 *
 * payload 계약(앱 notifications_screen 이 읽음):
 *   { verification_type: <한글 라벨>, status: 'approved' | 'rejected' }
 */
export async function notifyVerificationResult(
  memberId: string,
  verificationType: VerificationType,
  approved: boolean,
): Promise<void> {
  const payload = {
    verification_type: getVerificationTypeLabel(verificationType),
    status: approved ? 'approved' : 'rejected',
  };

  // 1) 인앱 알림
  const { error: insertError } = await supabaseAdmin.from('notifications').insert({
    user_id: memberId,
    type: 'verification_result',
    payload,
  });
  if (insertError) {
    console.error('notifyVerificationResult: 인앱 알림 생성 실패:', insertError.message);
  }

  // 2) FCM 발송 (vault service_role 시크릿 기반 — 실패해도 무시)
  const { error: pushError } = await supabaseAdmin.rpc('queue_push', {
    p_user_id: memberId,
    p_type: 'verification_result',
    p_payload: payload,
  });
  if (pushError) {
    console.error('notifyVerificationResult: 푸시 발송 실패:', pushError.message);
  }
}

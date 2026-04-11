import { NextResponse } from 'next/server';
import { backfillProfilePhotoVerifications } from '@/lib/supabase/verifications';

/**
 * POST /api/admin/backfill-profile-verifications
 *
 * 일회성/멱등 백필 엔드포인트.
 * members.profile_image_urls가 존재하지만 member_verifications(profile_photo)가
 * 없거나 'unverified'인 회원을 'pending_review'로 전환한다.
 */
export async function POST() {
  try {
    const result = await backfillProfilePhotoVerifications();
    return NextResponse.json(result);
  } catch (e) {
    const message = e instanceof Error ? e.message : 'unknown error';
    console.error('Backfill failed:', e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

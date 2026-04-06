import { NextRequest, NextResponse } from 'next/server';
import { updateVerificationStatus } from '@/lib/supabase/verifications';
import type { VerificationStatus } from '@/features/admin/types';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const status = body.status as VerificationStatus;
  const rejectionReason = body.rejectionReason as string | undefined;
  const success = await updateVerificationStatus(id, status, rejectionReason);
  if (!success) {
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
  }
  return NextResponse.json({ success: true });
}

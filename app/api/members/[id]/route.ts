import { NextRequest, NextResponse } from 'next/server';
import { getMemberById, updateMemberStatus } from '@/lib/supabase/members';
import type { AppStatus } from '@/features/admin/types';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const member = await getMemberById(id);
  if (!member) {
    return NextResponse.json({ error: 'Member not found' }, { status: 404 });
  }
  return NextResponse.json(member);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const status = body.status as AppStatus;
  const rejectionReason = body.rejectionReason as string | undefined;
  const success = await updateMemberStatus(id, status, rejectionReason);
  if (!success) {
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
  }
  return NextResponse.json({ success: true });
}

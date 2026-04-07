import { NextRequest, NextResponse } from 'next/server';
import { getInquiryById, updateInquiryStatus } from '@/lib/supabase/inquiries';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const inquiry = await getInquiryById(id);
  if (!inquiry) {
    return NextResponse.json({ error: 'Inquiry not found' }, { status: 404 });
  }
  return NextResponse.json(inquiry);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const success = await updateInquiryStatus(id, body.status, body.adminReply);
  if (!success) {
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
  }
  return NextResponse.json({ success: true });
}

import { NextRequest, NextResponse } from 'next/server';
import { getReportDetail, setMemberSuspension } from '@/lib/supabase/reports';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const detail = await getReportDetail(id);
  if (!detail) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  return NextResponse.json(detail);
}

// 검토 제재: { suspend: boolean } — true=정지 유지/적용, false=복권(active).
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = await req.json();
  const ok = await setMemberSuspension(id, body.suspend === true);
  if (!ok) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
  return NextResponse.json({ success: true });
}

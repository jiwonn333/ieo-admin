import { NextResponse } from 'next/server';
import { getInquiries } from '@/lib/supabase/inquiries';

export async function GET() {
  const inquiries = await getInquiries();
  return NextResponse.json(inquiries);
}

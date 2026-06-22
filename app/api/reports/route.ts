import { NextResponse } from 'next/server';
import { getReportSummaries } from '@/lib/supabase/reports';

export async function GET() {
  const summaries = await getReportSummaries();
  return NextResponse.json(summaries);
}

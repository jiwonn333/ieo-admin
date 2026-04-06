import { NextResponse } from 'next/server';
import { getVerificationStats } from '@/lib/supabase/verifications';

export async function GET() {
  const stats = await getVerificationStats();
  return NextResponse.json(stats);
}

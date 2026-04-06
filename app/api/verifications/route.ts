import { NextResponse } from 'next/server';
import { getVerificationQueue } from '@/lib/supabase/verifications';

export async function GET() {
  const queue = await getVerificationQueue();
  return NextResponse.json(queue);
}

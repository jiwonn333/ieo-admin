import { supabaseAdmin } from './client';
import { TABLES } from '@/lib/constants/tables';
import { SUPPORT_INQUIRY_COLUMNS } from '@/lib/constants/columns';
import { InquiryStatus } from '@/lib/constants/status';

export interface SupportInquiry {
  id: string;
  member_id: string;
  category: string;
  title: string;
  content: string;
  status: InquiryStatus;
  admin_reply: string | null;
  created_at: string;
  updated_at: string;
  // JOIN
  member_name?: string | null;
  member_nickname?: string | null;
}

/**
 * 전체 문의 목록 조회 (회원 정보 포함)
 */
export async function getInquiries(): Promise<SupportInquiry[]> {
  const { data, error } = await supabaseAdmin
    .from(TABLES.SUPPORT_INQUIRIES)
    .select(`
      *,
      members!inner (
        real_name,
        app_nickname
      )
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Failed to fetch inquiries:', error);
    return [];
  }

  return (data ?? []).map((row: Record<string, unknown>) => {
    const member = row.members as { real_name: string | null; app_nickname: string | null } | null;
    return {
      id: row.id as string,
      member_id: row.member_id as string,
      category: row.category as string,
      title: row.title as string,
      content: row.content as string,
      status: row.status as InquiryStatus,
      admin_reply: (row.admin_reply as string) ?? null,
      created_at: row.created_at as string,
      updated_at: row.updated_at as string,
      member_name: member?.real_name ?? null,
      member_nickname: member?.app_nickname ?? null,
    };
  });
}

/**
 * 단일 문의 조회
 */
export async function getInquiryById(id: string): Promise<SupportInquiry | null> {
  const { data, error } = await supabaseAdmin
    .from(TABLES.SUPPORT_INQUIRIES)
    .select(`
      *,
      members!inner (
        real_name,
        app_nickname
      )
    `)
    .eq(SUPPORT_INQUIRY_COLUMNS.ID, id)
    .single();

  if (error) {
    console.error('Failed to fetch inquiry:', error);
    return null;
  }

  const member = (data as Record<string, unknown>).members as { real_name: string | null; app_nickname: string | null } | null;
  return {
    id: data.id,
    member_id: data.member_id,
    category: data.category,
    title: data.title,
    content: data.content,
    status: data.status,
    admin_reply: data.admin_reply ?? null,
    created_at: data.created_at,
    updated_at: data.updated_at,
    member_name: member?.real_name ?? null,
    member_nickname: member?.app_nickname ?? null,
  };
}

/**
 * 문의 상태 변경
 */
export async function updateInquiryStatus(id: string, status: InquiryStatus, adminReply?: string): Promise<boolean> {
  const updateData: Record<string, unknown> = {
    [SUPPORT_INQUIRY_COLUMNS.STATUS]: status,
    updated_at: new Date().toISOString(),
  };
  if (adminReply !== undefined) {
    updateData[SUPPORT_INQUIRY_COLUMNS.ADMIN_REPLY] = adminReply;
  }

  const { error } = await supabaseAdmin
    .from(TABLES.SUPPORT_INQUIRIES)
    .update(updateData)
    .eq(SUPPORT_INQUIRY_COLUMNS.ID, id);

  if (error) {
    console.error('Failed to update inquiry status:', error);
    return false;
  }

  return true;
}

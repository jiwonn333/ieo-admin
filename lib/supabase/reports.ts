import { supabaseAdmin } from './client';
import { TABLES } from '@/lib/constants/tables';

export interface ReportItem {
  reason: string | null;
  reporterId: string;
  createdAt: string;
}

export interface ReportSummary {
  reportedId: string;
  nickname: string | null;
  realName: string | null;
  appStatus: string | null;
  /** 고유 신고자 수 (자동 정지 임계치 판단 기준) */
  uniqueReporters: number;
  /** 누적 신고 건수 */
  totalReports: number;
  latestReason: string | null;
  latestAt: string;
  reports: ReportItem[];
}

/**
 * 신고 누적 현황 — 신고당한 회원 단위로 집계.
 * service_role 로 조회(RLS 우회). 고유 신고자 수 내림차순, 동률 시 최근순.
 */
export async function getReportSummaries(): Promise<ReportSummary[]> {
  const { data: rows, error } = await supabaseAdmin
    .from(TABLES.REPORTS)
    .select('reporter_id, reported_id, reason, created_at')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Failed to fetch reports:', error);
    return [];
  }
  if (!rows || rows.length === 0) return [];

  // reported_id 단위 그룹핑
  const grouped = new Map<string, ReportItem[]>();
  for (const r of rows as Record<string, unknown>[]) {
    const reportedId = r.reported_id as string;
    const item: ReportItem = {
      reason: (r.reason as string) ?? null,
      reporterId: r.reporter_id as string,
      createdAt: r.created_at as string,
    };
    const list = grouped.get(reportedId);
    if (list) list.push(item);
    else grouped.set(reportedId, [item]);
  }

  // 신고당한 회원 정보
  const reportedIds = [...grouped.keys()];
  const { data: members } = await supabaseAdmin
    .from(TABLES.MEMBERS)
    .select('id, real_name, app_nickname, app_status')
    .in('id', reportedIds);

  const memberById = new Map<string, Record<string, unknown>>();
  for (const m of (members ?? []) as Record<string, unknown>[]) {
    memberById.set(m.id as string, m);
  }

  const summaries: ReportSummary[] = reportedIds.map((id) => {
    const items = grouped.get(id)!; // 최근순(쿼리 order) 유지
    const member = memberById.get(id);
    const uniqueReporters = new Set(items.map((i) => i.reporterId)).size;
    return {
      reportedId: id,
      nickname: (member?.app_nickname as string) ?? null,
      realName: (member?.real_name as string) ?? null,
      appStatus: (member?.app_status as string) ?? null,
      uniqueReporters,
      totalReports: items.length,
      latestReason: items[0]?.reason ?? null,
      latestAt: items[0]?.createdAt ?? '',
      reports: items,
    };
  });

  summaries.sort((a, b) => {
    if (b.uniqueReporters !== a.uniqueReporters) {
      return b.uniqueReporters - a.uniqueReporters;
    }
    return b.latestAt.localeCompare(a.latestAt);
  });

  return summaries;
}

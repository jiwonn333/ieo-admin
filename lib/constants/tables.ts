export const TABLES = {
  SUPPORT_INQUIRIES: 'support_inquiries',
  REPORTS: 'reports',
  MEMBERS: 'members',
} as const;

/** 신고 자동 정지 임계치 (DB 트리거 handle_report_inserted 와 동일). */
export const REPORT_SUSPEND_THRESHOLD = 3;

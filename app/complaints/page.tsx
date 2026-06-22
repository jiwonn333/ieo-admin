'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { MessageSquareWarning, Search, Ban, ShieldAlert, ChevronRight } from 'lucide-react';
import type { ReportSummary } from '@/lib/supabase/reports';
import { REPORT_SUSPEND_THRESHOLD } from '@/lib/constants/tables';
import { formatDate } from '@/lib/utils';

const FILTER_TABS = [
  { id: 'all', label: '전체' },
  { id: 'suspended', label: '정지됨' },
  { id: 'active', label: '활성' },
] as const;

type FilterId = (typeof FILTER_TABS)[number]['id'];

function StatusBadge({ appStatus }: { appStatus: string | null }) {
  if (appStatus === 'suspended') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-1 text-[11px] font-bold text-rose-700 border border-rose-100">
        <Ban size={12} />
        정지됨
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-gray-50 px-2.5 py-1 text-[11px] font-bold text-gray-600 border border-gray-200">
      활성
    </span>
  );
}

export default function ComplaintsPage() {
  const [reports, setReports] = useState<ReportSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterId>('all');
  const [query, setQuery] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/reports');
        const data = await res.json();
        setReports(Array.isArray(data) ? data : []);
      } catch {
        setReports([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = useMemo(() => {
    return reports.filter((r) => {
      if (filter === 'suspended' && r.appStatus !== 'suspended') return false;
      if (filter === 'active' && r.appStatus === 'suspended') return false;
      if (query.trim()) {
        const q = query.trim().toLowerCase();
        const hay = `${r.nickname ?? ''} ${r.realName ?? ''}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [reports, filter, query]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">민원 관리</h1>
        <p className="text-gray-500 text-sm">
          회원들이 접수한 신고 누적 현황입니다. 고유 신고자 {REPORT_SUSPEND_THRESHOLD}명 도달 시 자동 정지됩니다.
        </p>
      </div>

      {/* 필터 + 검색 */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex gap-1.5">
          {FILTER_TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              className={`rounded-full px-3.5 py-1.5 text-sm font-semibold transition ${
                filter === tab.id
                  ? 'bg-gray-900 text-white'
                  : 'bg-white text-gray-500 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="relative flex-1 sm:max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="닉네임·이름 검색"
            className="w-full rounded-full border border-gray-200 bg-white py-2 pl-9 pr-4 text-sm outline-none focus:border-gray-400"
          />
        </div>
      </div>

      {loading ? (
        <div className="bg-white p-12 rounded-2xl border border-gray-100 shadow-sm text-center text-gray-400">
          불러오는 중…
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-gray-100 shadow-sm flex flex-col items-center justify-center gap-4">
          <div className="w-16 h-16 rounded-full bg-neutral-50 flex items-center justify-center">
            <MessageSquareWarning size={32} className="text-neutral-200" />
          </div>
          <div className="text-center">
            <p className="text-neutral-500 font-medium">접수된 신고가 없습니다.</p>
            <p className="text-neutral-400 text-sm mt-1">회원이 신고하면 이곳에 표시됩니다.</p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((r) => (
            <ReportCard key={r.reportedId} report={r} />
          ))}
        </div>
      )}
    </div>
  );
}

function ReportCard({ report }: { report: ReportSummary }) {
  const reachedThreshold = report.uniqueReporters >= REPORT_SUSPEND_THRESHOLD;

  return (
    <Link
      href={`/complaints/${report.reportedId}`}
      className="block bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:border-gray-300 transition"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-bold text-gray-900 truncate">
              {report.nickname ?? '(닉네임 없음)'}
            </span>
            {report.realName && (
              <span className="text-sm text-gray-400 truncate">{report.realName}</span>
            )}
            <StatusBadge appStatus={report.appStatus} />
          </div>
          <p className="text-xs text-gray-400 mt-0.5 font-mono">{report.reportedId}</p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div
            className={`flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-sm font-bold ${
              reachedThreshold
                ? 'bg-rose-50 text-rose-700'
                : 'bg-amber-50 text-amber-700'
            }`}
            title="고유 신고자 수"
          >
            <ShieldAlert size={14} />
            신고자 {report.uniqueReporters}/{REPORT_SUSPEND_THRESHOLD}
          </div>
          <div className="rounded-lg bg-gray-50 px-2.5 py-1.5 text-sm font-semibold text-gray-600">
            누적 {report.totalReports}건
          </div>
          <ChevronRight size={18} className="text-gray-300" />
        </div>
      </div>

      {/* 최근 신고 사유 미리보기 */}
      <div className="mt-4 border-t border-gray-100 pt-3 space-y-1.5">
        {report.reports.slice(0, 3).map((item, i) => (
          <div key={i} className="flex items-center justify-between gap-3 text-sm">
            <span className="text-gray-700 truncate">{item.reason ?? '사유 미입력'}</span>
            <span className="text-xs text-gray-400 shrink-0">{formatDate(item.createdAt)}</span>
          </div>
        ))}
        {report.reports.length > 3 && (
          <p className="text-xs text-gray-400">외 {report.reports.length - 3}건</p>
        )}
      </div>
    </Link>
  );
}

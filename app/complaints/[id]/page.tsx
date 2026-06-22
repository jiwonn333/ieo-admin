'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Ban,
  RotateCcw,
  ShieldAlert,
  MessageSquare,
  ChevronRight,
  ChevronDown,
} from 'lucide-react';
import type { ReportDetail, TranscriptMessage } from '@/lib/supabase/reports';
import { REPORT_SUSPEND_THRESHOLD } from '@/lib/constants/tables';
import { formatDate } from '@/lib/utils';

export default function ComplaintDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [detail, setDetail] = useState<ReportDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch(`/api/reports/${id}`);
      setDetail(res.ok ? await res.json() : null);
    } catch {
      setDetail(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (id) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function act(suspend: boolean) {
    const label = suspend ? '정지' : '복권';
    if (!confirm(`이 회원을 ${label} 처리할까요?`)) return;
    setActing(true);
    try {
      const res = await fetch(`/api/reports/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ suspend }),
      });
      if (res.ok) await load();
      else alert('처리에 실패했어요.');
    } finally {
      setActing(false);
    }
  }

  if (loading) {
    return <div className="p-12 text-center text-gray-400">불러오는 중…</div>;
  }
  if (!detail) {
    return (
      <div className="space-y-4">
        <BackLink />
        <div className="p-12 text-center text-gray-400">신고 정보를 찾을 수 없어요.</div>
      </div>
    );
  }

  const uniqueReporters = new Set(detail.reports.map((r) => r.reporterId)).size;
  const isSuspended = detail.appStatus === 'suspended';
  const matchIds = Object.keys(detail.transcripts);

  return (
    <div className="space-y-6">
      <BackLink />

      {/* 헤더 */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-gray-900">
                {detail.nickname ?? '(닉네임 없음)'}
              </h1>
              {detail.realName && <span className="text-gray-400">{detail.realName}</span>}
              {isSuspended ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-1 text-[11px] font-bold text-rose-700 border border-rose-100">
                  <Ban size={12} /> 정지됨
                </span>
              ) : (
                <span className="rounded-full bg-gray-50 px-2.5 py-1 text-[11px] font-bold text-gray-600 border border-gray-200">
                  활성
                </span>
              )}
            </div>
            <p className="text-xs text-gray-400 mt-1 font-mono">{detail.reportedId}</p>
            <div className="mt-3 flex items-center gap-2 text-sm">
              <span className="inline-flex items-center gap-1 rounded-lg bg-amber-50 px-2.5 py-1.5 font-bold text-amber-700">
                <ShieldAlert size={14} /> 고유 신고자 {uniqueReporters}/{REPORT_SUSPEND_THRESHOLD}
              </span>
              <span className="rounded-lg bg-gray-50 px-2.5 py-1.5 font-semibold text-gray-600">
                누적 {detail.reports.length}건
              </span>
            </div>
          </div>

          {/* 제재 버튼 */}
          <div className="flex flex-col gap-2 shrink-0">
            {isSuspended ? (
              <button
                onClick={() => act(false)}
                disabled={acting}
                className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-50"
              >
                <RotateCcw size={15} /> 복권 (활성화)
              </button>
            ) : (
              <button
                onClick={() => act(true)}
                disabled={acting}
                className="inline-flex items-center gap-1.5 rounded-xl bg-rose-600 px-4 py-2 text-sm font-bold text-white hover:bg-rose-700 disabled:opacity-50"
              >
                <Ban size={15} /> 정지 처리
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 신고 내역 */}
      <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h2 className="font-bold text-gray-900 mb-3">신고 내역</h2>
        <div className="space-y-3">
          {detail.reports.map((r, i) => (
            <div key={i} className="border border-gray-100 rounded-xl p-3">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-gray-800">{r.reason ?? '사유 미입력'}</span>
                <span className="text-xs text-gray-400">{formatDate(r.createdAt)}</span>
              </div>
              {r.detail && <p className="text-sm text-gray-600 mt-1.5">{r.detail}</p>}
              <p className="text-[11px] text-gray-400 mt-1 font-mono">신고자 {r.reporterId}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 대화 전문 */}
      <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h2 className="font-bold text-gray-900 mb-3 flex items-center gap-1.5">
          <MessageSquare size={16} /> 출처 대화 전문
        </h2>
        {matchIds.length === 0 ? (
          <p className="text-sm text-gray-400">채팅 출처가 없는 신고입니다. (프로필 신고 등)</p>
        ) : (
          <div className="space-y-3">
            {matchIds.map((mid) => (
              <TranscriptBlock key={mid} messages={detail.transcripts[mid]} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function TranscriptBlock({ messages }: { messages: TranscriptMessage[] }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border border-gray-100 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50"
      >
        <span className="flex items-center gap-1.5">
          {open ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          대화 보기
          <span className="text-gray-400 font-normal">({messages.length}메시지)</span>
        </span>
      </button>

      {open && (
        <div className="max-h-96 overflow-y-auto border-t border-gray-100 bg-gray-50/50 p-3 space-y-1.5">
          {messages.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">메시지가 없습니다.</p>
          ) : (
            messages.map((m, i) => (
              <div
                key={i}
                className={`flex ${m.fromReported ? 'justify-start' : 'justify-end'}`}
              >
                <div
                  className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm ${
                    m.fromReported
                      ? 'bg-rose-50 text-rose-900 border border-rose-100'
                      : 'bg-white text-gray-800 border border-gray-200'
                  }`}
                >
                  <p className="text-[10px] font-bold opacity-60 mb-0.5">
                    {m.fromReported ? '신고대상' : '상대'}
                  </p>
                  {m.content}
                  <p className="text-[10px] opacity-50 mt-0.5">{formatDate(m.createdAt)}</p>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

function BackLink() {
  return (
    <Link
      href="/complaints"
      className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800"
    >
      <ArrowLeft size={16} /> 민원 목록
    </Link>
  );
}

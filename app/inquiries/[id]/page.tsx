'use client';

import React, { use, useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { SupportInquiry } from '@/lib/supabase/inquiries';
import { InquiryStatus } from '@/lib/constants/status';
import { formatDate } from '@/lib/utils';
import {
  ArrowLeft,
  User,
  ExternalLink,
  MessageSquare,
  CheckCircle2,
  Clock,
} from 'lucide-react';

export default function InquiryDetailPage({
  params: paramsPromise,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(paramsPromise);
  const [inquiry, setInquiry] = useState<SupportInquiry | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [replyText, setReplyText] = useState('');

  useEffect(() => {
    async function fetchData() {
      const res = await fetch(`/api/inquiries/${id}`);
      if (res.ok) {
        const data = await res.json();
        setInquiry(data);
        setReplyText(data.admin_reply ?? '');
      }
      setLoading(false);
    }
    fetchData();
  }, [id]);

  const handleSubmitReply = useCallback(async () => {
    if (!inquiry) return;
    if (!replyText.trim()) {
      alert('답변 내용을 입력해주세요.');
      return;
    }
    setUpdating(true);
    const res = await fetch(`/api/inquiries/${inquiry.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: InquiryStatus.ANSWERED, adminReply: replyText.trim() }),
    });
    if (res.ok) {
      setInquiry((prev) => prev ? { ...prev, status: InquiryStatus.ANSWERED, admin_reply: replyText.trim() } : prev);
    } else {
      alert('답변 등록에 실패했습니다.');
    }
    setUpdating(false);
  }, [inquiry, replyText]);

  const handleReopen = useCallback(async () => {
    if (!inquiry) return;
    setUpdating(true);
    const res = await fetch(`/api/inquiries/${inquiry.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: InquiryStatus.PENDING }),
    });
    if (res.ok) {
      setInquiry((prev) => prev ? { ...prev, status: InquiryStatus.PENDING } : prev);
    } else {
      alert('상태 변경에 실패했습니다.');
    }
    setUpdating(false);
  }, [inquiry]);

  if (loading) {
    return (
      <main className="min-h-screen bg-neutral-50 p-6 md:p-8">
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-500">로딩 중...</p>
        </div>
      </main>
    );
  }

  if (!inquiry) notFound();

  return (
    <main className="min-h-screen bg-neutral-50 p-6 md:p-8">
      <div className="mx-auto flex max-w-4xl flex-col gap-6">
        {/* 헤더 */}
        <div className="flex items-center gap-3">
          <Link
            href="/inquiries"
            className="p-2 rounded-xl border border-neutral-200 hover:bg-neutral-100 transition-colors bg-white shadow-sm"
          >
            <ArrowLeft size={18} className="text-neutral-600" />
          </Link>
          <div>
            <p className="text-sm text-neutral-500">문의 목록으로</p>
            <h1 className="text-2xl font-bold tracking-tight">문의 상세</h1>
          </div>
        </div>

        {/* 상태 + 카테고리 */}
        <section className="rounded-3xl bg-white p-8 shadow-sm border border-neutral-100">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-neutral-100 pb-6 mb-6">
            <div className="flex items-center gap-3">
              <span className="p-3 rounded-2xl bg-amber-50 text-amber-600">
                <MessageSquare size={24} />
              </span>
              <div>
                <h2 className="text-lg font-bold text-neutral-800">{inquiry.title}</h2>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs font-medium text-neutral-500 bg-neutral-100 px-2 py-0.5 rounded-md">
                    {inquiry.category}
                  </span>
                  <span className="text-xs text-neutral-400">
                    {formatDate(inquiry.created_at)}
                  </span>
                </div>
              </div>
            </div>
            <div>
              {inquiry.status === InquiryStatus.ANSWERED ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-4 py-1.5 text-sm font-semibold text-emerald-700 border border-emerald-100">
                  <CheckCircle2 size={16} />
                  답변완료
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-4 py-1.5 text-sm font-semibold text-amber-700 border border-amber-100">
                  <Clock size={16} />
                  대기중
                </span>
              )}
            </div>
          </div>

          {/* 회원 정보 */}
          <div className="rounded-2xl border border-neutral-100 p-4 mb-6 hover:border-amber-200 transition-colors">
            <p className="text-xs text-neutral-400 mb-3 font-medium uppercase tracking-wider">문의자</p>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-400">
                  <User size={20} />
                </div>
                <div>
                  <p className="text-sm font-bold text-neutral-800">{inquiry.member_name ?? '-'}</p>
                  <p className="text-[11px] text-neutral-400">@{inquiry.member_nickname ?? '-'}</p>
                </div>
              </div>
              <Link
                href={`/admin/users/${inquiry.member_id}`}
                className="text-amber-600 p-2 hover:bg-amber-50 rounded-lg transition-colors"
              >
                <ExternalLink size={16} />
              </Link>
            </div>
          </div>

          {/* 문의 내용 */}
          <div>
            <p className="text-sm font-semibold text-neutral-700 mb-2 flex items-center gap-2">
              <MessageSquare size={16} />
              문의 내용
            </p>
            <div className="rounded-2xl bg-neutral-50 p-5 text-sm text-neutral-700 leading-relaxed whitespace-pre-wrap">
              {inquiry.content}
            </div>
          </div>
        </section>

        {/* 관리자 답변 */}
        <section className="rounded-3xl bg-white p-8 shadow-sm border border-neutral-100">
          <h2 className="text-lg font-bold text-neutral-800 mb-1">관리자 답변</h2>
          <p className="text-sm text-neutral-400 mb-4">답변 작성 후 &quot;답변완료 처리&quot;를 누르면 상태가 변경됩니다.</p>

          {/* 이미 답변된 경우 기존 답변 표시 */}
          {inquiry.status === InquiryStatus.ANSWERED && inquiry.admin_reply && (
            <div className="mb-4 rounded-2xl bg-emerald-50 border border-emerald-100 p-5">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 size={14} className="text-emerald-600" />
                <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">등록된 답변</span>
              </div>
              <p className="text-sm text-neutral-700 leading-relaxed whitespace-pre-wrap">
                {inquiry.admin_reply}
              </p>
            </div>
          )}

          <textarea
            className="w-full p-4 bg-neutral-50 border border-neutral-200 rounded-2xl text-sm resize-none focus:ring-2 focus:ring-black focus:outline-none transition-colors"
            placeholder="회원에게 전달할 답변을 작성하세요."
            rows={5}
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
          />

          <div className="mt-4 flex gap-3">
            {inquiry.status === InquiryStatus.ANSWERED && (
              <button
                onClick={handleReopen}
                disabled={updating}
                className="flex items-center gap-2 rounded-2xl border border-neutral-200 px-5 py-2.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50 transition-colors disabled:opacity-30"
              >
                <Clock size={16} />
                대기중으로 변경
              </button>
            )}
            <button
              onClick={handleSubmitReply}
              disabled={updating || !replyText.trim()}
              className="flex items-center gap-2 rounded-2xl bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-emerald-700 transition-colors disabled:opacity-30"
            >
              <CheckCircle2 size={16} />
              {inquiry.status === InquiryStatus.ANSWERED ? '답변 수정' : '답변완료 처리'}
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}

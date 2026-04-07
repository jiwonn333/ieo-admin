'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { SupportInquiry } from '@/lib/supabase/inquiries';
import { formatDate } from '@/lib/utils';
import { Headset, Search, ChevronRight, Clock, CheckCircle2 } from 'lucide-react';

const CATEGORY_TABS = [
  { id: 'all', label: '전체' },
  { id: '프로필 심사', label: '프로필 심사' },
  { id: '매칭 & 채팅', label: '매칭 & 채팅' },
  { id: '결제 & 환불', label: '결제 & 환불' },
  { id: '보안 & 신고', label: '보안 & 신고' },
  { id: '기타', label: '기타' },
];

const STATUS_TABS = [
  { id: 'all', label: '전체' },
  { id: 'pending', label: '대기중' },
  { id: 'resolved', label: '답변완료' },
];

function getStatusBadge(status: string) {
  if (status === 'resolved') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700 border border-emerald-100">
        <CheckCircle2 size={12} />
        답변완료
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-bold text-amber-700 border border-amber-100">
      <Clock size={12} />
      대기중
    </span>
  );
}

export default function InquiriesPage() {
  const [inquiries, setInquiries] = useState<SupportInquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('all');
  const [activeStatus, setActiveStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();

  useEffect(() => {
    async function fetchData() {
      const res = await fetch('/api/inquiries');
      const data = await res.json();
      setInquiries(data);
      setLoading(false);
    }
    fetchData();
  }, []);

  const filtered = useMemo(() => {
    return inquiries.filter((item) => {
      const matchCategory = activeCategory === 'all' || item.category === activeCategory;
      const matchStatus = activeStatus === 'all' || item.status === activeStatus;
      const query = searchQuery.trim().toLowerCase();
      const matchSearch =
        !query ||
        item.title.toLowerCase().includes(query) ||
        (item.member_name ?? '').toLowerCase().includes(query) ||
        (item.member_nickname ?? '').toLowerCase().includes(query);
      return matchCategory && matchStatus && matchSearch;
    });
  }, [inquiries, activeCategory, activeStatus, searchQuery]);

  const pendingCount = inquiries.filter((i) => i.status === 'pending').length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">로딩 중...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">1:1 문의</h1>
          <p className="text-gray-500 mt-1">회원들이 접수한 1:1 문의를 확인하고 답변합니다.</p>
        </div>
        {pendingCount > 0 && (
          <div className="flex items-center gap-2 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-100">
            <Clock size={16} className="text-amber-600" />
            <span className="text-sm font-semibold text-amber-900">
              대기 중: {pendingCount}건
            </span>
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {/* 필터 영역 */}
        <div className="p-4 border-b border-gray-50 flex flex-col gap-4">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
            <div className="flex flex-col gap-3 w-full md:w-auto">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider">카테고리</span>
                <div className="flex flex-wrap gap-1">
                  {CATEGORY_TABS.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveCategory(tab.id)}
                      className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                        activeCategory === tab.id
                          ? 'bg-neutral-900 text-white'
                          : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider">상태</span>
                <div className="flex gap-1">
                  {STATUS_TABS.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveStatus(tab.id)}
                      className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                        activeStatus === tab.id
                          ? 'bg-neutral-900 text-white'
                          : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                placeholder="제목, 회원명 검색"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all"
              />
            </div>
          </div>
        </div>

        {/* 테이블 */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left whitespace-nowrap">
            <thead className="bg-gray-50 text-gray-500 font-medium text-[13px] border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 w-[140px]">카테고리</th>
                <th className="px-6 py-3">제목</th>
                <th className="px-6 py-3 w-[160px]">회원</th>
                <th className="px-6 py-3 w-[140px]">접수일</th>
                <th className="px-6 py-3 w-[100px] text-center">상태</th>
                <th className="px-4 py-3 w-[40px]"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((inquiry) => (
                <tr
                  key={inquiry.id}
                  onClick={() => router.push(`/inquiries/${inquiry.id}`)}
                  className="group cursor-pointer hover:bg-neutral-50/70 transition-colors"
                >
                  <td className="px-6 py-4">
                    <span className="text-xs font-medium text-neutral-500 bg-neutral-100 px-2 py-1 rounded-md">
                      {inquiry.category}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm font-medium text-neutral-800 group-hover:text-black truncate max-w-[300px]">
                      {inquiry.title}
                    </p>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <p className="text-sm font-medium text-neutral-800">{inquiry.member_name ?? '-'}</p>
                      <p className="text-[11px] text-neutral-400">@{inquiry.member_nickname ?? '-'}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-xs text-neutral-500 font-mono">
                    {formatDate(inquiry.created_at)}
                  </td>
                  <td className="px-6 py-4 text-center">
                    {getStatusBadge(inquiry.status)}
                  </td>
                  <td className="px-4 py-4 text-neutral-200 group-hover:text-neutral-400 transition-colors">
                    <ChevronRight size={18} />
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="h-40 text-center">
                    <div className="flex flex-col items-center justify-center gap-2 text-neutral-400">
                      <Headset size={40} className="text-neutral-100" />
                      <p className="text-sm">접수된 문의가 없습니다.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import type { VerificationQueueItem, Member, VerificationType, VerificationStatus } from '@/features/admin/types';
import {
  getVerificationStatusLabel,
  getVerificationStatusClass,
  getVerificationTypeLabel,
  getMaritalStatusLabel,
} from '@/features/admin/lib/presenters';
import { formatDate } from '@/lib/utils';
import { FilterBar } from '@/components/ui/FilterBar';

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import {
  Search,
  CheckCircle2,
  XCircle,
  ChevronRight,
  User,
  Clock,
  ShieldCheck,
  Calendar,
  ExternalLink,
  Info,
} from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

const TYPE_TABS = [
  { id: 'all', label: '전체' },
  { id: 'profile_photo', label: '프로필' },
  { id: 'job', label: '직업' },
  { id: 'education', label: '학력' },
  { id: 'income', label: '소득' },
  { id: 'marriage', label: '혼인' },
];

const STATUS_TABS = [
  { id: 'pending_review', label: '심사중' },
  { id: 'approved', label: '승인됨' },
  { id: 'rejected', label: '반려' },
  { id: 'unverified', label: '미제출' },
  { id: 'all', label: '전체' },
];

function cn(...classes: unknown[]) {
  return classes.filter(Boolean).join(' ');
}

export default function VerificationManagementPage() {
  const searchParams = useSearchParams();
  const initialType = searchParams.get('type') || 'all';
  const initialStatus = searchParams.get('status') || 'pending_review';

  const [activeTypeTab, setActiveTypeTab] = useState(initialType);
  const [activeStatusTab, setActiveStatusTab] = useState(initialStatus);
  const [searchQuery, setSearchQuery] = useState('');
  const [queue, setQueue] = useState<VerificationQueueItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedItem, setSelectedItem] = useState<VerificationQueueItem | null>(null);
  const [fullMember, setFullMember] = useState<Member | null>(null);

  // 데이터 로드
  const loadQueue = useCallback(async () => {
    const res = await fetch('/api/verifications');
    const data = await res.json();
    setQueue(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadQueue();
  }, [loadQueue]);

  // 선택 시 전체 회원 정보 로드
  useEffect(() => {
    if (selectedItem) {
      fetch(`/api/members/${selectedItem.member_id}`)
        .then((res) => res.ok ? res.json() : null)
        .then(setFullMember);
    } else {
      setFullMember(null);
    }
  }, [selectedItem]);

  // URL member_id 파라미터로 자동 선택
  useEffect(() => {
    const memberId = searchParams.get('member_id');
    if (memberId && queue.length > 0) {
      const item = queue.find((i) => i.member_id === memberId);
      if (item) setSelectedItem(item);
    }
  }, [searchParams, queue]);

  // 필터링
  const filteredQueue = useMemo(() => {
    return queue.filter((item) => {
      const matchType = activeTypeTab === 'all' || item.verification_type === activeTypeTab;
      const matchStatus = activeStatusTab === 'all' || item.status === activeStatusTab;
      const matchSearch =
        !searchQuery ||
        (item.member_name ?? '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.member_nickname ?? '').toLowerCase().includes(searchQuery.toLowerCase());

      return matchType && matchStatus && matchSearch;
    });
  }, [queue, activeTypeTab, activeStatusTab, searchQuery]);

  // 승인/반려 핸들러
  const handleAction = async (newStatus: VerificationStatus, reason?: string) => {
    if (!selectedItem) return;
    const res = await fetch(`/api/verifications/${selectedItem.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus, rejectionReason: reason }),
    });
    if (res.ok) {
      setSelectedItem(null);
      await loadQueue(); // 큐 새로고침
    } else {
      alert('처리에 실패했습니다.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">로딩 중...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full gap-6">
      {/* 타이틀 영역 */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">검증 관리</h1>
          <p className="text-gray-500 mt-1">회원들이 제출한 인증 서류와 정보를 검수합니다.</p>
        </div>
        <div className="flex items-center gap-2 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-100">
          <Clock size={16} className="text-amber-600" />
          <span className="text-sm font-semibold text-amber-900">
            대기 중: {queue.filter((i) => i.status === 'pending_review').length}건
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1">
        {/* 왼쪽: 목록 영역 */}
        <div className={cn('flex flex-col gap-4', selectedItem ? 'lg:col-span-12 xl:col-span-8' : 'lg:col-span-12')}>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col overflow-hidden">
            {/* 필터 바 */}
            <div className="p-4 border-b border-gray-50 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
              <div className="flex flex-col gap-4 w-full md:w-auto">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider">유형</span>
                  <FilterBar tabs={TYPE_TABS} activeTab={activeTypeTab} onTabChange={setActiveTypeTab} />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider">상태</span>
                  <FilterBar tabs={STATUS_TABS} activeTab={activeStatusTab} onTabChange={setActiveStatusTab} />
                </div>
              </div>

              <div className="relative w-full md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input
                  type="text"
                  placeholder="회원명 검색"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all"
                />
              </div>
            </div>

            {/* 테이블 */}
            <div className="overflow-x-auto">
              <Table className="min-w-[800px]">
                <TableHeader className="bg-neutral-50/50">
                  <TableRow>
                    <TableHead className="w-[180px] px-6">회원 정보</TableHead>
                    <TableHead className="w-[120px] px-6">인증 종류</TableHead>
                    <TableHead className="px-6">제출일</TableHead>
                    <TableHead className="w-[120px] px-6 text-center">상태</TableHead>
                    <th className="w-[100px] px-6"></th>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredQueue.map((item) => (
                    <TableRow
                      key={item.id}
                      onClick={() => setSelectedItem(item)}
                      className={cn(
                        'cursor-pointer transition-colors',
                        selectedItem?.id === item.id ? 'bg-amber-50/50' : 'hover:bg-neutral-50/50',
                      )}
                    >
                      <TableCell className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-400 shrink-0">
                            <User size={16} />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-neutral-800 truncate">{item.member_name ?? '-'}</p>
                            <p className="text-[11px] text-neutral-400 truncate">@{item.member_nickname ?? '-'}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="px-6 py-4">
                        <span className="text-sm font-medium text-neutral-700">
                          {getVerificationTypeLabel(item.verification_type)}
                        </span>
                      </TableCell>
                      <TableCell className="px-6 py-4 text-sm text-neutral-500 font-mono">
                        {item.submitted_at ? formatDate(item.submitted_at) : '-'}
                      </TableCell>
                      <TableCell className="px-6 py-4 text-center">
                        <span
                          className={cn(
                            'inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold',
                            getVerificationStatusClass(item.status),
                          )}
                        >
                          {getVerificationStatusLabel(item.status)}
                        </span>
                      </TableCell>
                      <TableCell className="px-6 py-4 text-right">
                        <button className="text-neutral-300 group-hover:text-neutral-600">
                          <ChevronRight size={18} />
                        </button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredQueue.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="h-40 text-center">
                        <div className="flex flex-col items-center justify-center gap-2 text-neutral-400">
                          <ShieldCheck size={40} className="text-neutral-100" />
                          <p className="text-sm">현재 조건에 맞는 검증 항목이 없습니다.</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>

        {/* 오른쪽: 상세 패널 */}
        {selectedItem && (
          <div className="lg:col-span-12 xl:col-span-4 h-fit sticky top-6">
            <div className="bg-white rounded-3xl border border-gray-100 shadow-lg flex flex-col overflow-hidden animate-in slide-in-from-right-4 duration-300">
              {/* 패널 헤더 */}
              <div className="p-6 border-b border-neutral-50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheck size={20} className="text-amber-600" />
                  <h3 className="text-lg font-bold">검수 상세</h3>
                </div>
                <button
                  onClick={() => setSelectedItem(null)}
                  className="p-1.5 hover:bg-neutral-100 rounded-lg text-neutral-400"
                >
                  <XCircle size={20} />
                </button>
              </div>

              {/* 패널 내용 */}
              <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
                {/* 회원 카드 */}
                <div className="rounded-2xl bg-neutral-50 p-4 border border-neutral-100 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-neutral-300 border border-neutral-100">
                      <User size={20} />
                    </div>
                    <div>
                      <p className="text-sm font-bold">{selectedItem.member_name ?? '-'}</p>
                      <p className="text-xs text-neutral-400">@{selectedItem.member_nickname ?? '-'}</p>
                    </div>
                  </div>
                  <Link
                    href={`/admin/users/${selectedItem.member_id}`}
                    className="p-2 hover:bg-white rounded-lg transition-colors text-amber-600"
                  >
                    <ExternalLink size={16} />
                  </Link>
                </div>

                {/* 인증 정보 섹션 */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between px-1">
                    <span className="text-sm font-bold text-neutral-800">인증 유형</span>
                    <span className="text-sm font-medium text-amber-600 bg-amber-50 px-2 py-1 rounded-md">
                      {getVerificationTypeLabel(selectedItem.verification_type)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between px-1 border-t border-dashed border-neutral-100 pt-3">
                    <span className="text-xs text-neutral-400">제출 일시</span>
                    <div className="flex items-center gap-1.5 text-xs text-neutral-600 font-medium">
                      <Calendar size={12} />
                      {selectedItem.submitted_at ? formatDate(selectedItem.submitted_at) : '기록 없음'}
                    </div>
                  </div>

                  {/* 항목별 상세 정보 */}
                  <div className="p-4 bg-amber-50/30 rounded-2xl border border-amber-100/50 space-y-3">
                    <div className="flex items-center gap-1.5 mb-2">
                      <Info size={14} className="text-amber-600" />
                      <span className="text-xs font-bold text-amber-800">제출 정보 확인</span>
                    </div>
                    {selectedItem.verification_type === 'profile_photo' && fullMember?.profile_image_urls?.length ? (
                      <div className="space-y-2">
                        <p className="text-[10px] text-neutral-400 font-bold uppercase">프로필 사진</p>
                        <div className="grid grid-cols-2 gap-2">
                          {fullMember.profile_image_urls.map((url, i) => (
                            <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="group relative rounded-xl overflow-hidden aspect-[3/4] bg-neutral-100">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={url} alt={`프로필 ${i + 1}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                              {i === fullMember.primary_photo_index && (
                                <span className="absolute top-1 left-1 bg-black/70 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">대표</span>
                              )}
                            </a>
                          ))}
                        </div>
                      </div>
                    ) : selectedItem.verification_type === 'profile_photo' ? (
                      <div className="space-y-1">
                        <p className="text-[10px] text-neutral-400 font-bold uppercase">내용</p>
                        <p className="text-sm text-neutral-800 leading-relaxed font-medium">프로필 사진 미제출</p>
                      </div>
                    ) : null}
                    {selectedItem.verification_type === 'job' && (
                      <div className="space-y-1">
                        <p className="text-[10px] text-neutral-400 font-bold uppercase">제출 직업</p>
                        <p className="text-sm text-neutral-800 font-bold">{fullMember?.job || '-'}</p>
                      </div>
                    )}
                    {selectedItem.verification_type === 'education' && (
                      <div className="space-y-1">
                        <p className="text-[10px] text-neutral-400 font-bold uppercase">학력</p>
                        <p className="text-sm text-neutral-800 font-bold">{fullMember?.education || '-'}</p>
                      </div>
                    )}
                    {selectedItem.verification_type === 'income' && (
                      <div className="space-y-1">
                        <p className="text-[10px] text-neutral-400 font-bold uppercase">제출 소득구간</p>
                        <p className="text-sm text-neutral-800 font-bold">{fullMember?.income_range || '-'}</p>
                      </div>
                    )}
                    {selectedItem.verification_type === 'marriage' && (
                      <div className="space-y-1">
                        <p className="text-[10px] text-neutral-400 font-bold uppercase">제출 혼인 여부</p>
                        <p className="text-sm text-neutral-800 font-bold">{fullMember ? getMaritalStatusLabel(fullMember.marital_status) : '-'}</p>
                      </div>
                    )}
                  </div>

                  {selectedItem.status === 'rejected' && selectedItem.rejection_reason && (
                    <div className="p-3 bg-rose-50 rounded-xl border border-rose-100">
                      <p className="text-[10px] text-rose-400 font-bold uppercase mb-1">이전 반려 사유</p>
                      <p className="text-xs text-rose-700 leading-relaxed font-medium">
                        {selectedItem.rejection_reason}
                      </p>
                    </div>
                  )}
                </div>

                {/* 증빙 파일 */}
                {selectedItem.verification_type !== 'profile_photo' && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-1.5 px-1">
                      <Info size={14} className="text-neutral-400" />
                      <span className="text-sm font-bold text-neutral-800">증빙 확인</span>
                    </div>

                    {selectedItem.files && selectedItem.files.length > 0 ? (
                      <div className="grid grid-cols-1 gap-2">
                        {selectedItem.files.map((file, i) => {
                          const isImage = file.mime_type?.startsWith('image/');
                          const fileUrl = file.signed_url ?? '';
                          return isImage ? (
                            <a key={file.id} href={fileUrl} target="_blank" rel="noopener noreferrer" className="group rounded-2xl overflow-hidden border border-neutral-100 bg-neutral-100 shadow-sm">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={fileUrl} alt={file.original_filename ?? `증빙 ${i + 1}`} className="w-full object-cover group-hover:scale-105 transition-transform duration-300" />
                              <div className="p-2">
                                <p className="text-[10px] text-neutral-500 truncate">{file.original_filename ?? `파일 ${i + 1}`}</p>
                              </div>
                            </a>
                          ) : (
                            <a key={file.id} href={fileUrl} target="_blank" rel="noopener noreferrer" className="rounded-2xl overflow-hidden border border-neutral-100 bg-neutral-50 shadow-sm p-3 hover:bg-neutral-100 transition-colors">
                              <p className="text-xs text-neutral-600 font-medium truncate">{file.original_filename ?? `파일 ${i + 1}`}</p>
                              <p className="text-[10px] text-neutral-400 mt-0.5">{file.mime_type ?? '-'}</p>
                            </a>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="h-24 rounded-2xl bg-neutral-50 border border-dashed border-neutral-200 flex items-center justify-center text-neutral-400 text-sm">
                        제출된 증빙 파일이 없습니다.
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* 액션 버튼 영역 */}
              <div className="p-6 mt-auto border-t border-neutral-50 bg-neutral-50/50 flex flex-col gap-2">
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      const reason = window.prompt('반려 사유를 입력하세요');
                      if (reason) handleAction('rejected', reason);
                    }}
                    className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl border border-neutral-200 bg-white text-sm font-bold text-rose-600 hover:bg-rose-50 hover:border-rose-200 transition-all shadow-sm"
                  >
                    <XCircle size={18} />
                    반려 처리
                  </button>
                  <button
                    onClick={() => {
                      if (window.confirm('해당 인증을 승인하시겠습니까?')) {
                        handleAction('approved');
                      }
                    }}
                    className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-black text-white text-sm font-bold hover:bg-neutral-800 transition-all shadow-lg active:scale-95"
                  >
                    <CheckCircle2 size={18} />
                    승인 완료
                  </button>
                </div>
                <p className="text-[10px] text-center text-neutral-400 mt-2">
                  승인 즉시 회원에게 안내 메시지가 발송되며 인증 뱃지가 부여됩니다.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

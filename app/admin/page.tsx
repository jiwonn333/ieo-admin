'use client';

import React, { use, useEffect, useState } from 'react';
import Link from 'next/link';
import type { Member, AppStatus, VerificationStatus, VerificationType } from '@/features/admin/types';
import {
  getAppStatusLabel,
  getAppStatusClass,
  getVerificationStatusLabel,
  getVerificationStatusColor,
  getVerificationTypeLabel,
  calcAge,
  getGenderLabel,
} from '@/features/admin/lib/presenters';
import { formatDate } from '@/lib/utils';
import { Search, RotateCcw } from 'lucide-react';

const PAGE_SIZE = 20;

const VERIFICATION_TYPES: VerificationType[] = ['profile_photo', 'job', 'education', 'income', 'marriage'];

type SearchParams = {
  page?: string;
  status?: AppStatus | 'ALL';
  profile_photo?: VerificationStatus | 'ALL';
  job?: VerificationStatus | 'ALL';
  education?: VerificationStatus | 'ALL';
  income?: VerificationStatus | 'ALL';
  marriage?: VerificationStatus | 'ALL';
  keyword?: string;
};

function getVerificationStatus(member: Member, type: VerificationType): VerificationStatus {
  const v = member.member_verifications?.find((v) => v.verification_type === type);
  return v?.status ?? 'unverified';
}

function applyFilters(members: Member[], params: SearchParams) {
  return members.filter((member) => {
    const byStatus = !params.status || params.status === 'ALL' || member.app_status === params.status;

    const byVerifications = VERIFICATION_TYPES.every((type) => {
      const filterValue = (params as Record<string, string>)[type];
      if (!filterValue || filterValue === 'ALL') return true;
      return getVerificationStatus(member, type) === filterValue;
    });

    const query = params.keyword?.trim().toLowerCase();
    const byKeyword =
      !query ||
      [member.real_name, member.app_nickname, member.id, member.job]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(query);

    return byStatus && byVerifications && byKeyword;
  });
}

function buildPageHref(page: number, params: SearchParams) {
  const search = new URLSearchParams();
  search.set('page', String(page));
  if (params.status) search.set('status', params.status);
  VERIFICATION_TYPES.forEach((type) => {
    const val = (params as Record<string, string>)[type];
    if (val) search.set(type, val);
  });
  if (params.keyword) search.set('keyword', params.keyword);
  return `/admin?${search.toString()}`;
}

export default function AdminPage({
  searchParams: searchParamsPromise,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = use(searchParamsPromise);
  const [members, setMembers] = useState<Member[]>([]);
  const [statsData, setStatsData] = useState({ pendingProfileCount: 0, suspendedCount: 0, activeCount: 0, totalPendingVerifications: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      const [membersRes, statsRes] = await Promise.all([
        fetch('/api/members'),
        fetch('/api/verifications/stats'),
      ]);
      const [membersData, stats] = await Promise.all([
        membersRes.json(),
        statsRes.json(),
      ]);
      setMembers(membersData);
      setStatsData(stats);
      setLoading(false);
    }
    fetchData();
  }, []);

  const filteredMembers = applyFilters(members, params);

  const currentPage = Math.max(1, Number(params.page || '1'));
  const totalPages = Math.max(1, Math.ceil(filteredMembers.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);

  const startIndex = (safePage - 1) * PAGE_SIZE;
  const pagedMembers = filteredMembers.slice(startIndex, startIndex + PAGE_SIZE);

  const verificationFilterOptions: { value: VerificationStatus | 'ALL'; label: string }[] = [
    { value: 'ALL', label: '전체' },
    { value: 'pending_review', label: '심사중' },
    { value: 'approved', label: '승인됨' },
    { value: 'rejected', label: '반려' },
    { value: 'unverified', label: '미제출' },
  ];

  if (loading) {
    return (
      <main className="min-h-screen bg-neutral-50 p-6 md:p-8">
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-500">로딩 중...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-neutral-50 p-6 md:p-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">

        {/* 헤더 & 요약 */}
        <header className="rounded-xl bg-white p-6 shadow-sm border border-gray-100 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">회원 관리</h1>
            <p className="mt-1 text-sm text-gray-500">
              신규 회원 검수, 상태 관리, 승인 여부를 확인합니다.
            </p>
          </div>

          <div className="flex gap-3">
            <div className="rounded-lg bg-gray-50 px-4 py-2 border border-gray-100">
              <div className="text-[11px] font-medium text-gray-500">전체 회원</div>
              <div className="mt-0.5 text-lg font-bold text-gray-900">{members.length}</div>
            </div>
            <Link href="/admin/verifications?type=profile_photo&status=pending_review" className="rounded-lg bg-blue-50 px-4 py-2 border border-blue-100 hover:bg-blue-100/50 transition-colors">
              <div className="text-[11px] font-medium text-blue-700">프로필 대기</div>
              <div className="mt-0.5 text-lg font-bold text-blue-800">{statsData.pendingProfileCount}</div>
            </Link>
            <div className="rounded-lg bg-emerald-50 px-4 py-2 border border-emerald-100">
              <div className="text-[11px] font-medium text-emerald-700">정상 회원</div>
              <div className="mt-0.5 text-lg font-bold text-emerald-800">{statsData.activeCount}</div>
            </div>
            <div className="rounded-lg bg-rose-50 px-4 py-2 border border-rose-100">
              <div className="text-[11px] font-medium text-rose-700">정지 회원</div>
              <div className="mt-0.5 text-lg font-bold text-rose-800">{statsData.suspendedCount}</div>
            </div>
          </div>
        </header>

        <section className="rounded-xl shadow-sm border border-gray-200 bg-white overflow-hidden">
          {/* 테이블 컨트롤 영역 (검색, 필터) */}
          <div className="border-b border-gray-200 bg-white p-4">
            <form className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
              <div className="flex-1 flex flex-wrap items-center gap-2">
                <div className="relative w-full max-w-xs">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    name="keyword"
                    placeholder="이름, 닉네임, ID 검색"
                    defaultValue={params.keyword ?? ''}
                    className="w-full pl-9 pr-3 py-1.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900 bg-gray-50 hover:bg-white transition-colors"
                  />
                </div>

                <div className="h-5 w-px bg-gray-200 hidden md:block mx-1"></div>

                <select
                  name="status"
                  defaultValue={params.status ?? 'ALL'}
                  className="py-1.5 px-3 text-sm border border-gray-200 rounded-md bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-900 text-gray-700 font-medium"
                >
                  <option value="ALL">상태: 전체</option>
                  <option value="signup_in_progress">가입진행중</option>
                  <option value="pending_review">프로필 승인대기</option>
                  <option value="active">정상</option>
                  <option value="suspended">정지</option>
                  <option value="rejected">거절</option>
                </select>

                {VERIFICATION_TYPES.map((type) => {
                  const labelStr = getVerificationTypeLabel(type);
                  return (
                    <select
                      key={type}
                      name={type}
                      defaultValue={(params as Record<string, string>)[type] ?? 'ALL'}
                      className="py-1.5 px-2 text-sm border border-gray-200 rounded-md bg-transparent focus:outline-none focus:ring-2 focus:ring-gray-900 text-gray-600"
                    >
                      {verificationFilterOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {labelStr}: {opt.label}
                        </option>
                      ))}
                    </select>
                  );
                })}
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <Link
                  href="/admin"
                  className="flex items-center justify-center p-2 text-gray-500 hover:bg-gray-100 rounded-md transition-colors"
                  title="필터 초기화"
                >
                  <RotateCcw size={16} />
                </Link>
                <button
                  type="submit"
                  className="rounded-md bg-gray-900 px-4 py-1.5 text-sm font-medium text-white hover:bg-gray-800 transition-colors"
                >
                  조회
                </button>
              </div>
            </form>
          </div>

          {/* 테이블 영역 */}
          <div className="overflow-x-auto w-full">
            <table className="w-full text-sm text-left whitespace-nowrap">
              <thead className="bg-gray-50 text-gray-500 font-medium text-[13px] border-b border-gray-200">
                <tr>
                  <th className="px-5 py-3 w-10">No</th>
                  <th className="px-5 py-3">회원 정보</th>
                  <th className="px-5 py-3">기본 정보</th>
                  <th className="px-5 py-3">가입 상태</th>
                  <th className="px-5 py-3">인증 현황</th>
                  <th className="px-5 py-3">가입일</th>
                  <th className="px-5 py-3 text-right">관리</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {pagedMembers.map((member, idx) => {
                  const profileUrl = member.profile_image_urls?.[member.primary_photo_index] ?? member.profile_image_urls?.[0];
                  const age = calcAge(member.birth_date);

                  return (
                    <tr key={member.id} className="hover:bg-gray-50/50 transition-colors group">
                      <td className="px-5 py-4 text-gray-400 text-xs text-center">
                        {startIndex + idx + 1}
                      </td>

                      {/* 회원 정보 */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          {profileUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={profileUrl}
                              alt=""
                              className="w-10 h-10 rounded-full object-cover shadow-sm border border-gray-100 bg-white"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center text-[10px] text-gray-400 font-medium">
                              없음
                            </div>
                          )}
                          <div>
                            <div className="font-semibold text-gray-900 flex items-center gap-1.5">
                              {member.real_name ?? '-'}
                              <span className="font-normal text-gray-400 text-xs">@{member.app_nickname ?? '-'}</span>
                            </div>
                            <div className="text-[11px] text-gray-400 mt-0.5 font-mono">
                              {member.id.slice(0, 8)}...
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* 기본 정보 */}
                      <td className="px-5 py-4 text-[13px] text-gray-600">
                        <div>
                          {age != null && <span className="font-medium text-gray-700">{age}세</span>}
                          {age != null && member.gender && ' · '}
                          {member.gender && getGenderLabel(member.gender)}
                        </div>
                        {member.job && (
                          <div className="text-gray-400 mt-0.5">{member.job}</div>
                        )}
                      </td>

                      {/* 회원 상태 */}
                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold ${getAppStatusClass(member.app_status)}`}
                        >
                          {getAppStatusLabel(member.app_status)}
                        </span>
                      </td>

                      {/* 인증 상태 요약 */}
                      <td className="px-5 py-4">
                        <div className="flex flex-wrap gap-1.5 max-w-[200px]">
                          {VERIFICATION_TYPES.map((type) => {
                            const vStatus = getVerificationStatus(member, type);
                            const color = getVerificationStatusColor(vStatus);
                            const typeLabel = getVerificationTypeLabel(type);
                            const opacityCls = vStatus === 'unverified' ? 'opacity-60' : 'font-medium';

                            return (
                              <div
                                key={type}
                                className={`flex items-center gap-1.5 bg-white border border-gray-200 rounded px-1.5 py-0.5 text-[11px] text-gray-600 shadow-sm ${opacityCls}`}
                                title={`${typeLabel}: ${getVerificationStatusLabel(vStatus)}`}
                              >
                                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }}></span>
                                {typeLabel}
                              </div>
                            );
                          })}
                        </div>
                      </td>

                      {/* 가입일 */}
                      <td className="px-5 py-4 text-xs font-mono">
                        <div className="text-gray-600 text-[11px]">
                          {formatDate(member.created_at).split(' ')[0]}
                        </div>
                      </td>

                      {/* 관리 액션 */}
                      <td className="px-5 py-4 text-right">
                        <Link
                          href={`/admin/users/${member.id}`}
                          className="inline-flex items-center justify-center rounded-md text-xs font-medium transition-colors border border-gray-200 bg-white hover:bg-gray-50 hover:text-gray-900 h-8 px-3 shadow-sm"
                        >
                          상세보기
                        </Link>
                      </td>
                    </tr>
                  );
                })}

                {pagedMembers.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-6 py-16 text-center text-gray-500">
                      조건에 맞는 회원이 없습니다.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* 페이지네이션 */}
          <div className="flex items-center justify-between border-t border-gray-100 bg-gray-50 px-6 py-3">
            <div className="text-sm text-gray-500 font-medium">
              {safePage} / {totalPages} <span className="font-normal text-gray-400">페이지</span>
            </div>
            <div className="flex gap-2">
              <Link
                href={buildPageHref(Math.max(1, safePage - 1), params)}
                className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                  safePage === 1
                    ? 'pointer-events-none bg-transparent text-gray-400'
                    : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 shadow-sm'
                }`}
              >
                이전
              </Link>
              <Link
                href={buildPageHref(Math.min(totalPages, safePage + 1), params)}
                className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                  safePage === totalPages
                    ? 'pointer-events-none bg-transparent text-gray-400'
                    : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 shadow-sm'
                }`}
              >
                다음
              </Link>
            </div>
          </div>
        </section>

      </div>
    </main>
  );
}

'use client';

import React, { use, useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Member, AppStatus, VerificationType, VerificationStatus } from '@/features/admin/types';
import {
  getAppStatusLabel,
  getAppStatusClass,
  getVerificationStatusLabel,
  getVerificationStatusClass,
  getVerificationTypeLabel,
  isVerificationRequired,
  isReSubmissionRequired,
  canActivateMember,
  calcAge,
  getGenderLabel,
  getMaritalStatusLabel,
  VERIFICATION_TYPES,
} from '@/features/admin/lib/presenters';
import { formatDate } from '@/lib/utils';
import { ArrowLeft, ClipboardCheck } from 'lucide-react';

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[120px_1fr] gap-4 border-b border-neutral-100 py-3 last:border-b-0">
      <div className="text-sm font-medium text-neutral-500">{label}</div>
      <div className="text-sm text-neutral-900">{value}</div>
    </div>
  );
}

function getVerificationStatus(member: Member, type: VerificationType): VerificationStatus {
  const v = member.member_verifications?.find((v) => v.verification_type === type);
  return v?.status ?? 'unverified';
}

function getVerificationSubmittedAt(member: Member, type: VerificationType): string | null {
  const v = member.member_verifications?.find((v) => v.verification_type === type);
  return v?.submitted_at ?? null;
}

export default function AdminUserDetailPage({
  params: paramsPromise,
}: {
  params: Promise<{ uid: string }>;
}) {
  const { uid } = use(paramsPromise);
  const [member, setMember] = useState<Member | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      const res = await fetch(`/api/members/${uid}`);
      if (res.ok) {
        const data = await res.json();
        setMember(data);
      }
      setLoading(false);
    }
    fetchData();
  }, [uid]);

  const handleStatusChange = useCallback(async (newStatus: AppStatus) => {
    if (!member) return;

    // 심사 거절은 검증관리와 동일하게 반려 사유를 입력받는다.
    let rejectionReason: string | undefined;
    if (newStatus === 'rejected') {
      const reason = window.prompt('반려 사유를 입력하세요');
      if (!reason) return; // 취소하거나 비우면 중단
      rejectionReason = reason;
    } else if (!confirm(`회원 상태를 "${getAppStatusLabel(newStatus)}"(으)로 변경하시겠습니까?`)) {
      return;
    }

    const res = await fetch(`/api/members/${member.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus, rejectionReason }),
    });
    if (res.ok) {
      setMember((prev) => prev ? { ...prev, app_status: newStatus } : prev);
    } else {
      alert('상태 변경에 실패했습니다.');
    }
  }, [member]);

  if (loading) {
    return (
      <main className="min-h-screen bg-neutral-50 p-6 md:p-8">
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-500">로딩 중...</p>
        </div>
      </main>
    );
  }

  if (!member) notFound();

  const profilePhotoStatus = getVerificationStatus(member, 'profile_photo');
  const canActivate = canActivateMember(profilePhotoStatus);

  const resubmitCount = VERIFICATION_TYPES.filter((type) =>
    isReSubmissionRequired(getVerificationStatus(member, type)),
  ).length;

  const age = calcAge(member.birth_date);
  const profileUrl = member.profile_image_urls?.[member.primary_photo_index] ?? member.profile_image_urls?.[0];

  return (
    <main className="min-h-screen bg-neutral-50 p-6 md:p-8">
      <div className="mx-auto flex max-w-5xl flex-col gap-6">

        {/* 헤더 */}
        <div className="flex items-center gap-3">
          <Link href="/admin" className="p-2 rounded-xl border border-neutral-200 hover:bg-neutral-100 transition-colors">
            <ArrowLeft size={18} className="text-neutral-600" />
          </Link>
          <div>
            <p className="text-sm text-neutral-500">회원 목록으로</p>
            <h1 className="text-2xl font-bold tracking-tight">회원 상세</h1>
          </div>
        </div>

        {/* 회원 요약 카드 */}
        <section className="rounded-3xl bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-6 md:flex-row">
            {/* 프로필 사진 */}
            <div className="shrink-0 w-full md:w-[180px]">
              {profileUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={profileUrl}
                  alt={member.real_name ?? ''}
                  className="aspect-[3/4] w-full rounded-2xl object-cover"
                />
              ) : (
                <div className="aspect-[3/4] w-full rounded-2xl bg-neutral-100 flex items-center justify-center text-neutral-400 text-sm">
                  사진 없음
                </div>
              )}
            </div>

            {/* 기본 정보 */}
            <div className="flex-1">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h2 className="text-xl font-bold">
                    {member.real_name ?? '-'}
                    <span className="text-neutral-400 font-normal text-base ml-2">@{member.app_nickname ?? '-'}</span>
                  </h2>
                  <p className="text-sm text-neutral-500 mt-0.5">ID: {member.id.slice(0, 8)}...</p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`inline-flex rounded-full px-3 py-1 text-sm font-medium ${getAppStatusClass(member.app_status)}`}>
                    {getAppStatusLabel(member.app_status)}
                  </span>
                  <span className={`inline-flex rounded-full px-3 py-1 text-sm font-medium ${canActivate ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                    {canActivate ? '앱 활성 가능' : '앱 활성 불가'}
                  </span>
                </div>
              </div>

              <div className="mt-4 rounded-2xl bg-neutral-50 p-4">
                <InfoRow label="나이/성별" value={`${age != null ? `${age}세` : '-'} · ${getGenderLabel(member.gender)}`} />
                <InfoRow label="키" value={member.height_cm ? `${member.height_cm}cm` : '-'} />
                <InfoRow label="직업" value={member.job ?? '-'} />
                <InfoRow label="학력" value={member.education ?? '-'} />
                <InfoRow label="소득" value={member.income_range ?? '-'} />
                <InfoRow label="혼인여부" value={getMaritalStatusLabel(member.marital_status)} />
                <InfoRow label="종교" value={member.religion ?? '-'} />
                <InfoRow label="흡연/음주" value={`${member.smoking ?? '-'} / ${member.drinking ?? '-'}`} />
                <InfoRow label="가입일" value={formatDate(member.created_at)} />
                {member.introduction && (
                  <InfoRow label="자기소개" value={member.introduction} />
                )}
              </div>
            </div>
          </div>
        </section>

        {/* 인증 현황 요약 + 검수 관리 링크 */}
        <section className="rounded-3xl bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold">인증 현황</h2>
              <p className="text-sm text-neutral-500 mt-0.5">
                각 항목의 현재 상태를 확인합니다. 승인/반려 처리는 검수 관리에서 진행하세요.
              </p>
            </div>
            <Link
              href={`/admin/users/${uid}/verifications`}
              className="flex items-center gap-2 rounded-2xl bg-black px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 transition-colors"
            >
              <ClipboardCheck size={16} />
              검수 관리
              {resubmitCount > 0 && (
                <span className="ml-1 bg-rose-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {resubmitCount}
                </span>
              )}
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {VERIFICATION_TYPES.map((type) => {
              const status = getVerificationStatus(member, type);
              const required = isVerificationRequired(type);
              const needsResubmit = isReSubmissionRequired(status);
              const submittedAt = getVerificationSubmittedAt(member, type);

              return (
                <div
                  key={type}
                  className={`rounded-2xl p-4 border ${needsResubmit ? 'border-rose-200 bg-rose-50/30' : 'border-neutral-100 bg-neutral-50'}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-neutral-700">
                      {getVerificationTypeLabel(type)}
                    </span>
                    {required && (
                      <span className="text-[10px] bg-black text-white rounded-full px-1.5 py-0.5 font-bold">
                        필수
                      </span>
                    )}
                  </div>
                  <span
                    className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${getVerificationStatusClass(status)}`}
                  >
                    {getVerificationStatusLabel(status)}
                  </span>
                  {needsResubmit && (
                    <p className="mt-2 text-xs text-rose-500">재제출 안내 필요</p>
                  )}
                  {submittedAt && (
                    <p className="mt-1 text-xs text-neutral-400">
                      {formatDate(submittedAt)}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* 상태 변경 */}
        <section className="rounded-3xl bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold">회원 상태 변경</h2>
          <p className="mt-1 text-sm text-neutral-500">
            상태를 변경하면 Supabase에 즉시 반영됩니다.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {(
              [
                { s: 'active' as AppStatus,    label: '정상 처리',  cls: 'bg-emerald-600' },
                { s: 'suspended' as AppStatus, label: '정지 처리',  cls: 'bg-rose-600' },
                { s: 'rejected' as AppStatus,  label: '심사 거절',  cls: 'bg-gray-600' },
              ]
            ).map(({ s, label, cls }) => (
              <button
                key={s}
                type="button"
                disabled={member.app_status === s}
                onClick={() => handleStatusChange(s)}
                className={`rounded-2xl px-4 py-2 text-sm font-medium text-white transition-opacity ${cls} disabled:opacity-30`}
              >
                {label}
              </button>
            ))}
          </div>
        </section>

        {/* 메모 + 민원 */}
        <div className="grid gap-6 lg:grid-cols-2">
          <section className="rounded-3xl bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold mb-4">관리자 메모</h2>
            <p className="text-sm text-neutral-400">등록된 메모가 없습니다.</p>
          </section>

          <section className="rounded-3xl bg-white p-6 shadow-sm flex flex-col">
            <h2 className="text-lg font-semibold mb-4">관련 민원/신고</h2>
            <div className="flex items-center justify-center p-8 rounded-2xl border border-dashed border-neutral-200 bg-neutral-50/50 flex-1">
              <p className="text-sm text-neutral-400">등록된 관련 민원/신고가 없습니다.</p>
            </div>
          </section>
        </div>

      </div>
    </main>
  );
}

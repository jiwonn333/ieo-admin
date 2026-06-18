'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import type { Member, VerificationType, VerificationStatus, MemberVerification } from '@/features/admin/types';
import {
  getVerificationTypeLabel,
  getVerificationStatusLabel,
  getVerificationStatusClass,
  isVerificationRequired,
  isReSubmissionRequired,
  VERIFICATION_TYPES,
} from '@/features/admin/lib/presenters';
import { formatDate } from '@/lib/utils';
import { ArrowLeft, Check, X, RotateCcw, AlertCircle, ImageIcon } from 'lucide-react';


function getVerification(member: Member, type: VerificationType): MemberVerification | null {
  return member.member_verifications?.find((v) => v.verification_type === type) ?? null;
}

export default function VerificationsPage() {
  const { uid } = useParams<{ uid: string }>();
  const [member, setMember] = useState<Member | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeType, setActiveType] = useState<VerificationType>('profile_photo');
  const [rejectReasons, setRejectReasons] = useState<Record<VerificationType, string>>({
    profile_photo: '',
    job: '',
    education: '',
    income: '',
    marriage: '',
  });
  const [actionMsg, setActionMsg] = useState('');

  const loadMember = useCallback(async () => {
    const res = await fetch(`/api/members/${uid}`);
    const data = res.ok ? await res.json() : null;
    setMember(data);
    setLoading(false);

    // 반려 사유 초기화
    if (data?.member_verifications) {
      const reasons: Record<string, string> = {};
      for (const v of data.member_verifications) {
        reasons[v.verification_type] = v.rejection_reason ?? '';
      }
      setRejectReasons((prev) => ({ ...prev, ...reasons }));
    }
  }, [uid]);

  useEffect(() => {
    loadMember();
  }, [loadMember]);

  const handleAction = useCallback(async (type: VerificationType, nextStatus: VerificationStatus) => {
    if (!member) return;
    const verification = getVerification(member, type);
    if (!verification) return;

    const res = await fetch(`/api/verifications/${verification.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: nextStatus,
        rejectionReason: nextStatus === 'rejected' ? rejectReasons[type] : undefined,
      }),
    });

    if (res.ok) {
      const label = getVerificationStatusLabel(nextStatus);
      setActionMsg(`${getVerificationTypeLabel(type)} 항목이 "${label}"(으)로 변경되었습니다.`);
      setTimeout(() => setActionMsg(''), 3000);
      await loadMember(); // 새로고침
    } else {
      alert('처리에 실패했습니다.');
    }
  }, [member, rejectReasons, loadMember]);

  if (loading) {
    return (
      <main className="min-h-screen bg-neutral-50 p-6 md:p-8">
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-500">로딩 중...</p>
        </div>
      </main>
    );
  }

  if (!member) {
    return (
      <div className="p-12 text-center text-neutral-500">
        회원을 찾을 수 없습니다.
      </div>
    );
  }

  const activeVerification = getVerification(member, activeType);
  const activeStatus: VerificationStatus = activeVerification?.status ?? 'unverified';
  const activeFiles = activeVerification?.member_verification_files ?? [];

  return (
    <main className="min-h-screen bg-neutral-50 p-6 md:p-8">
      <div className="mx-auto flex max-w-5xl flex-col gap-6">

        {/* 헤더 */}
        <div className="flex items-center gap-3">
          <Link
            href={`/admin/users/${uid}`}
            className="p-2 rounded-xl border border-neutral-200 hover:bg-neutral-100 transition-colors"
          >
            <ArrowLeft size={18} className="text-neutral-600" />
          </Link>
          <div>
            <p className="text-sm text-neutral-500">
              {member.real_name ?? '-'} ({member.app_nickname ?? '-'}) 님의 인증 검수
            </p>
            <h1 className="text-2xl font-bold tracking-tight">인증 검수 관리</h1>
          </div>
        </div>

        {/* 토스트 메시지 */}
        {actionMsg && (
          <div className="rounded-2xl bg-emerald-50 border border-emerald-200 px-5 py-3 text-sm text-emerald-700 font-medium">
            {actionMsg}
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
          {/* 사이드 탭 — 항목 선택 */}
          <div className="flex flex-col gap-2">
            {VERIFICATION_TYPES.map((type) => {
              const v = getVerification(member, type);
              const status = v?.status ?? 'unverified';
              const required = isVerificationRequired(type);
              const needsResubmit = isReSubmissionRequired(status);

              return (
                <button
                  key={type}
                  onClick={() => setActiveType(type)}
                  className={`text-left rounded-2xl px-4 py-3.5 border transition-colors ${
                    activeType === type
                      ? 'border-black bg-white shadow-sm'
                      : 'border-neutral-200 bg-white hover:bg-neutral-50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-semibold text-neutral-800">
                      {getVerificationTypeLabel(type)}
                    </span>
                    {required && (
                      <span className="text-[10px] bg-black text-white rounded-full px-1.5 py-0.5 font-bold">
                        필수
                      </span>
                    )}
                  </div>
                  <span
                    className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${getVerificationStatusClass(status)}`}
                  >
                    {getVerificationStatusLabel(status)}
                  </span>
                  {needsResubmit && (
                    <div className="mt-1 flex items-center gap-1 text-[11px] text-rose-500">
                      <AlertCircle size={11} />
                      재제출 안내 필요
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* 검수 상세 패널 */}
          <div className="rounded-3xl bg-white p-6 shadow-sm">
            <div className="flex items-start justify-between mb-5">
              <div>
                <h2 className="text-lg font-semibold">
                  {getVerificationTypeLabel(activeType)} 인증
                </h2>
                <p className="text-sm text-neutral-500 mt-0.5">
                  현재 상태:&nbsp;
                  <span
                    className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${getVerificationStatusClass(activeStatus)}`}
                  >
                    {getVerificationStatusLabel(activeStatus)}
                  </span>
                </p>
              </div>

              {/* 제출 정보 */}
              <div className="text-right text-xs text-neutral-400">
                {activeVerification?.submitted_at ? (
                  <>
                    <div>제출일: {formatDate(activeVerification.submitted_at)}</div>
                    {activeVerification.reviewed_at && <div>검수일: {formatDate(activeVerification.reviewed_at)}</div>}
                  </>
                ) : (
                  <div>미제출</div>
                )}
              </div>
            </div>

            {/* 재제출 안내 배너 */}
            {isReSubmissionRequired(activeStatus) && (
              <div className="mb-5 flex items-start gap-3 rounded-2xl bg-rose-50 border border-rose-200 p-4 text-sm text-rose-700">
                <AlertCircle size={16} className="mt-0.5 shrink-0" />
                <div>
                  <p className="font-semibold">반려된 항목입니다.</p>
                  <p className="mt-0.5">
                    회원이 재제출하면 자동으로 <strong>심사중</strong> 상태로 변경됩니다.
                    반려 사유를 명확히 기재해주세요.
                  </p>
                </div>
              </div>
            )}

            {/* 제출된 이미지/파일 */}
            {(() => {
              // 프로필 사진인 경우 member.profile_image_urls 사용
              if (activeType === 'profile_photo' && member.profile_image_urls?.length > 0) {
                return (
                  <div className="mb-5">
                    <p className="text-sm font-medium text-neutral-700 mb-3">프로필 사진</p>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {member.profile_image_urls.map((url, i) => (
                        <a
                          key={i}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="group relative rounded-2xl border border-neutral-100 overflow-hidden bg-neutral-50 aspect-[3/4]"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={url}
                            alt={`프로필 사진 ${i + 1}`}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          {i === member.primary_photo_index && (
                            <span className="absolute top-2 left-2 bg-black/70 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                              대표
                            </span>
                          )}
                        </a>
                      ))}
                    </div>
                  </div>
                );
              }

              // 다른 인증 타입: verification_files에서 이미지 표시
              if (activeFiles.length > 0) {
                return (
                  <div className="mb-5">
                    <p className="text-sm font-medium text-neutral-700 mb-3">제출된 증빙 자료</p>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {activeFiles.map((file, i) => {
                        const isImage = file.mime_type?.startsWith('image/');
                        const fileUrl = file.signed_url ?? '';
                        return isImage ? (
                          <a
                            key={file.id}
                            href={fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group relative rounded-2xl border border-neutral-100 overflow-hidden bg-neutral-50 aspect-[4/3]"
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={fileUrl}
                              alt={file.original_filename ?? `증빙 ${i + 1}`}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                            <span className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                              <p className="text-[10px] text-white truncate">{file.original_filename ?? `파일 ${i + 1}`}</p>
                            </span>
                          </a>
                        ) : (
                          <a
                            key={file.id}
                            href={fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="rounded-2xl border border-neutral-100 p-4 bg-neutral-50 hover:bg-neutral-100 transition-colors flex flex-col items-center justify-center gap-2 aspect-[4/3]"
                          >
                            <ImageIcon size={24} className="text-neutral-300" />
                            <p className="text-xs font-medium text-neutral-700 truncate max-w-full">{file.original_filename ?? '파일'}</p>
                            <p className="text-[10px] text-neutral-400">{file.mime_type ?? '-'}</p>
                          </a>
                        );
                      })}
                    </div>
                  </div>
                );
              }

              // 파일 없음
              if (activeStatus === 'unverified') {
                return (
                  <div className="mb-5 flex items-center justify-center h-36 rounded-2xl bg-neutral-50 border border-dashed border-neutral-200 text-sm text-neutral-400">
                    회원이 아직 제출하지 않았습니다.
                  </div>
                );
              }

              return (
                <div className="mb-5 flex items-center justify-center h-36 rounded-2xl bg-neutral-50 border border-dashed border-neutral-200 text-sm text-neutral-400">
                  제출된 서류가 없습니다.
                </div>
              );
            })()}

            {/* 반려 사유 입력 */}
            <div className="mb-5">
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                반려 사유 <span className="text-xs text-neutral-400 font-normal">(반려 시 필수, 승인 시 생략 가능)</span>
              </label>
              <textarea
                className="w-full p-3 bg-neutral-50 border border-neutral-200 rounded-2xl text-sm resize-none focus:ring-2 focus:ring-black focus:outline-none transition-colors"
                placeholder="반려/재제출 요청 사유를 입력하세요."
                rows={3}
                value={rejectReasons[activeType]}
                onChange={(e) =>
                  setRejectReasons((prev) => ({ ...prev, [activeType]: e.target.value }))
                }
              />
              {activeVerification?.rejection_reason && (
                <p className="mt-1 text-xs text-rose-500">
                  이전 반려 사유: {activeVerification.rejection_reason}
                </p>
              )}
            </div>

            {/* 액션 버튼 */}
            <div className="flex gap-3 flex-wrap">
              <button
                onClick={() => handleAction(activeType, 'approved')}
                disabled={activeStatus === 'unverified' || activeStatus === 'approved'}
                className="flex items-center gap-2 rounded-2xl bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-emerald-700 transition-colors disabled:opacity-30"
              >
                <Check size={16} />
                승인
              </button>
              <button
                onClick={() => handleAction(activeType, 'rejected')}
                disabled={activeStatus === 'unverified' || activeStatus === 'rejected'}
                className="flex items-center gap-2 rounded-2xl bg-rose-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-rose-700 transition-colors disabled:opacity-30"
              >
                <X size={16} />
                반려
              </button>
              <button
                onClick={() => handleAction(activeType, 'pending_review')}
                disabled={activeStatus === 'unverified' || activeStatus === 'pending_review'}
                className="flex items-center gap-2 rounded-2xl border border-neutral-300 px-5 py-2.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50 transition-colors disabled:opacity-30"
              >
                <RotateCcw size={16} />
                심사중으로 복귀
              </button>
            </div>

            {/* 상태 흐름 안내 */}
            <div className="mt-6 rounded-2xl bg-neutral-50 p-4 text-xs text-neutral-500 space-y-1">
              <p className="font-semibold text-neutral-600 mb-2">인증 상태 흐름</p>
              <p>- <strong>미제출</strong> → 회원 제출 시 → <strong>심사중</strong></p>
              <p>- <strong>심사중</strong> → 승인 → <strong>승인됨</strong></p>
              <p>- <strong>심사중</strong> → 반려 → <strong>반려</strong> (재제출 안내 필요)</p>
              <p>- <strong>반려</strong> → 회원 재제출 시 → <strong>심사중</strong> (자동 변경)</p>
              <p className="text-rose-500 mt-2">※ 프로필 사진 승인 완료 시에만 회원 상태를 ACTIVE로 변경할 수 있습니다.</p>
            </div>
          </div>
        </div>

      </div>
    </main>
  );
}

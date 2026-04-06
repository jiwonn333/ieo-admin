import { AppStatus, VerificationStatus, VerificationType, ComplaintCategory, ComplaintStatus } from '../types';

// ─── AppStatus (기존 MemberStatus) ────────────────────────────────────────

export function getAppStatusLabel(status: AppStatus): string {
  switch (status) {
    case 'signup_in_progress': return '가입진행중';
    case 'pending_review':     return '프로필 승인대기';
    case 'active':             return '정상';
    case 'suspended':          return '정지';
    case 'rejected':           return '거절';
  }
}

export function getAppStatusClass(status: AppStatus): string {
  switch (status) {
    case 'signup_in_progress': return 'bg-neutral-200 text-neutral-600';
    case 'pending_review':     return 'bg-amber-100 text-amber-700';
    case 'active':             return 'bg-emerald-100 text-emerald-700';
    case 'suspended':          return 'bg-rose-100 text-rose-700';
    case 'rejected':           return 'bg-gray-200 text-gray-600';
  }
}

// ─── VerificationStatus ────────────────────────────────────────────────────

export function getVerificationStatusLabel(status: VerificationStatus): string {
  switch (status) {
    case 'unverified':     return '미제출';
    case 'pending_review': return '심사중';
    case 'approved':       return '승인됨';
    case 'rejected':       return '반려';
  }
}

export function getVerificationStatusClass(status: VerificationStatus): string {
  switch (status) {
    case 'unverified':     return 'bg-gray-100 text-gray-400 border border-gray-200';
    case 'pending_review': return 'bg-blue-100 text-blue-700';
    case 'approved':       return 'bg-emerald-100 text-emerald-700';
    case 'rejected':       return 'bg-rose-100 text-rose-700';
  }
}

export function getVerificationStatusColor(status: VerificationStatus): string {
  switch (status) {
    case 'unverified':     return '#9ca3af'; // gray-400
    case 'pending_review': return '#3b82f6'; // blue-500
    case 'approved':       return '#10b981'; // emerald-500
    case 'rejected':       return '#f43f5e'; // rose-500
  }
}

export function isReSubmissionRequired(status: VerificationStatus): boolean {
  return status === 'rejected';
}

// ─── VerificationType (기존 VerificationKey) ───────────────────────────────

export function getVerificationTypeLabel(type: VerificationType): string {
  switch (type) {
    case 'profile_photo': return '프로필 사진';
    case 'job':           return '직업';
    case 'education':     return '학력';
    case 'income':        return '소득';
    case 'marriage':      return '혼인여부';
  }
}

export function isVerificationRequired(type: VerificationType): boolean {
  return type === 'profile_photo';
}

// ─── 비즈니스 규칙 ─────────────────────────────────────────────────────────

export function canActivateMember(profilePhotoStatus: VerificationStatus): boolean {
  return profilePhotoStatus === 'approved';
}

// ─── 성별 라벨 ─────────────────────────────────────────────────────────────

export function getGenderLabel(gender: string | null): string {
  switch (gender) {
    case 'male':    return '남';
    case 'female':  return '여';
    case 'other':   return '기타';
    case 'unknown': return '미정';
    default:        return '-';
  }
}

// ─── 혼인상태 라벨 ─────────────────────────────────────────────────────────

export function getMaritalStatusLabel(status: string): string {
  switch (status) {
    case 'single':   return '미혼';
    case 'married':  return '기혼';
    case 'divorced': return '돌싱';
    case 'unknown':  return '미정';
    default:         return '-';
  }
}

// ─── 나이 계산 ─────────────────────────────────────────────────────────────

export function calcAge(birthDate: string | null): number | null {
  if (!birthDate) return null;
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

// ─── Complaint (목데이터 유지) ─────────────────────────────────────────────

export const complaintCategoryLabelMap: Record<ComplaintCategory, string> = {
  PROFILE: '프로필 신고',
  PHOTO: '부적절한 사진',
  FALSE_INFO: '허위 정보',
  ABUSE: '욕설/비매너',
  SCAM: '사기/금전 유도',
  HARASSMENT: '성희롱/불쾌 표현',
  OTHER: '기타',
};

export function getComplaintCategoryLabel(category: ComplaintCategory): string {
  return complaintCategoryLabelMap[category] || '알 수 없음';
}

export function getComplaintStatusLabel(status: ComplaintStatus): string {
  switch (status) {
    case 'RECEIVED': return '접수됨';
    case 'IN_PROGRESS': return '처리중';
    case 'RESOLVED': return '처리완료';
  }
}

export function getComplaintStatusClass(status: ComplaintStatus): string {
  switch (status) {
    case 'RECEIVED': return 'bg-rose-100 text-rose-700';
    case 'IN_PROGRESS': return 'bg-amber-100 text-amber-700';
    case 'RESOLVED': return 'bg-emerald-100 text-emerald-700';
  }
}

// ─── 인증 타입 목록 (UI 필터 등에서 사용) ──────────────────────────────────

export const VERIFICATION_TYPES: VerificationType[] = [
  'profile_photo', 'job', 'education', 'income', 'marriage',
];

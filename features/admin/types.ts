// ─── 회원 앱 상태 (Supabase members.app_status) ────────────────────────────
export type AppStatus =
  | 'signup_in_progress' // 가입 진행 중
  | 'pending_review'     // 프로필 심사 대기
  | 'active'             // 정상 활성 회원
  | 'suspended'          // 정지 처리된 회원
  | 'rejected';          // 심사 거절 처리된 회원

// ─── 인증 항목 상태 (Supabase member_verifications.status) ─────────────────
export type VerificationStatus =
  | 'unverified'     // 미제출 (기존 NOT_SUBMITTED)
  | 'pending_review' // 제출 완료, 검수 대기 (기존 PENDING)
  | 'approved'       // 승인
  | 'rejected';      // 거절

// ─── 인증 항목 종류 (Supabase member_verifications.verification_type) ──────
export type VerificationType =
  | 'profile_photo'  // 프로필 사진 (필수)
  | 'job'            // 직업
  | 'education'      // 학력
  | 'income'         // 소득 (기존 salary)
  | 'marriage';      // 혼인여부 (기존 maritalStatus)

// ─── Supabase member_verification_files 테이블 ────────────────────────────
export interface VerificationFile {
  id: string;
  verification_id: string;
  member_id: string;
  storage_bucket: string;
  storage_path: string;
  original_filename: string | null;
  mime_type: string | null;
  created_at: string;
  // 비공개 버킷(verification-documents) 조회용 임시 서명 URL. 서버에서 주입.
  signed_url?: string | null;
}

// ─── Supabase member_verifications 테이블 ──────────────────────────────────
export interface MemberVerification {
  id: string;
  member_id: string;
  verification_type: VerificationType;
  status: VerificationStatus;
  submitted_at: string | null;
  reviewed_at: string | null;
  rejection_reason: string | null;
  created_at: string;
  updated_at: string;
  // JOIN으로 가져올 파일 목록
  member_verification_files?: VerificationFile[];
}

// ─── Supabase members 테이블 + verifications JOIN ──────────────────────────
export interface Member {
  id: string;
  kakao_id: string | null;
  real_name: string | null;
  birth_date: string | null;
  gender: 'male' | 'female' | 'other' | 'unknown' | null;
  app_nickname: string | null;
  introduction: string | null;
  height_cm: number | null;
  religion: string | null;
  smoking: string | null;
  drinking: string | null;
  marital_status: 'single' | 'married' | 'divorced' | 'unknown';
  job: string | null;
  education: string | null;
  income_range: string | null;
  profile_image_urls: string[];
  primary_photo_index: number;
  app_status: AppStatus;
  created_at: string;
  updated_at: string;
  // JOIN으로 가져올 인증 목록
  member_verifications?: MemberVerification[];
}

// ─── 인증 심사 큐 아이템 (verifications + member 정보 조합) ─────────────────
export interface VerificationQueueItem {
  id: string;               // member_verifications.id
  member_id: string;
  member_name: string | null;
  member_nickname: string | null;
  verification_type: VerificationType;
  status: VerificationStatus;
  submitted_at: string | null;
  reviewed_at: string | null;
  rejection_reason: string | null;
  files: VerificationFile[];
}

// ─── 민원 (아직 Supabase 테이블 없음 — 목데이터 유지) ─────────────────────
export type ComplaintCategory =
  | 'PROFILE'
  | 'PHOTO'
  | 'FALSE_INFO'
  | 'ABUSE'
  | 'SCAM'
  | 'HARASSMENT'
  | 'OTHER';

export type ComplaintStatus = 'RECEIVED' | 'IN_PROGRESS' | 'RESOLVED';

export interface Complaint {
  id: string;
  reporterId: string;
  reportedMemberId?: string;
  category: ComplaintCategory;
  description: string;
  status: ComplaintStatus;
  createdAt: string;
  adminNotes?: string;
}

// ─── 관리자 메모 (아직 Supabase 테이블 없음 — 목데이터 유지) ────────────────
export interface AdminNote {
  id: string;
  memberId: string;
  content: string;
  authorId: string;
  createdAt: string;
  isPinned: boolean;
}

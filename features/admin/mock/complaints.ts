import { Complaint, ComplaintStatus } from '../types';

export const mockComplaints: Complaint[] = [
  {
    id: 'c1',
    reporterId: 'user_manual_2',
    reportedMemberId: 'user_manual_3',
    category: 'ABUSE',
    description: '사용자가 불쾌한 메시지를 반복적으로 보냅니다.',
    status: 'RECEIVED',
    createdAt: '2026-03-24T10:00:00Z',
  },
  {
    id: 'c2',
    reporterId: 'user_manual_1',
    reportedMemberId: undefined,
    category: 'OTHER',
    description: '앱 실행 시 계속 오류가 발생합니다.',
    status: 'RESOLVED',
    createdAt: '2026-03-20T12:00:00Z',
    adminNotes: '안내 메일 발송 및 캐시 삭제 가이드 제공',
  },
  {
    id: 'c3',
    reporterId: 'user_manual_4',
    reportedMemberId: 'user_manual_3',
    category: 'PHOTO',
    description: '상대방 프로필 사진이 인터넷에서 도용된 것 같습니다. 화질이 너무 좋고 모델 사진같음.',
    status: 'IN_PROGRESS',
    createdAt: '2026-03-22T09:00:00Z',
  },
  {
    id: 'c4',
    reporterId: 'user_manual_5',
    reportedMemberId: 'user_manual_2',
    category: 'SCAM',
    description: '채팅방 입장 후 계속해서 외부 메신저로 유도하고 가상화폐 투자를 권유합니다.',
    status: 'RECEIVED',
    createdAt: '2026-03-25T01:05:00Z',
  },
  {
    id: 'c5',
    reporterId: 'user_manual_3',
    reportedMemberId: 'user_manual_4',
    category: 'HARASSMENT',
    description: '성적인 농담을 계속 하며 만남을 강요합니다.',
    status: 'IN_PROGRESS',
    createdAt: '2026-03-24T15:30:00Z',
  },
];

export function getMockComplaints(): Complaint[] {
  // 세션 내 상태 유지를 위해 직접 참조 반환 (Mock 서버 시뮬레이션)
  return mockComplaints;
}

export function getMockComplaintById(id: string): Complaint | undefined {
  return mockComplaints.find((c) => c.id === id);
}

/**
 * 전역 Mock 데이터 상태 업데이트 (세션 내 유지용)
 */
export function updateMockComplaintStatus(id: string, newStatus: ComplaintStatus) {
  const index = mockComplaints.findIndex(c => c.id === id);
  if (index !== -1) {
    mockComplaints[index] = {
      ...mockComplaints[index],
      status: newStatus
    };
  }
}

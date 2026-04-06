import { AdminNote } from '../types';

export const mockNotes: AdminNote[] = [
  {
    id: 'note1',
    memberId: 'user_manual_3',
    content: '블랙리스트 경고 누적으로 계정 정지 처리됨. 재가입 시 주의 요망.',
    authorId: 'admin_ieo',
    createdAt: '2026-02-16T09:00:00Z',
    isPinned: true,
  },
  {
    id: 'note2',
    memberId: 'user_manual_2',
    content: 'VIP 회원, 서비스 만족도 높음. 프리미엄 전환 후보.',
    authorId: 'admin_ieo',
    createdAt: '2026-01-20T14:30:00Z',
    isPinned: false,
  },
  {
    id: 'note3',
    memberId: 'user_manual_6',
    content: '프로필 사진 도용 의심 케이스. 향후 재가입 시 강화 심사 필요.',
    authorId: 'admin_ieo',
    createdAt: '2026-03-19T11:00:00Z',
    isPinned: true,
  },
];

export function getMockNotes(): AdminNote[] {
  return mockNotes;
}

export function getMockNotesByMemberId(uid: string): AdminNote[] {
  return mockNotes.filter((n) => n.memberId === uid);
}

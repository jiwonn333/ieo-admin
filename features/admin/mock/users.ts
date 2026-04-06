/**
 * ⚠️ DEPRECATED: 실제 회원 데이터는 이제 Supabase(`lib/supabase/members.ts`)에서 가져옵니다.
 *
 * 이 파일은 아직 Supabase로 마이그레이션되지 않은 complaints/notes 페이지에서
 * 회원명 조회 용도로만 남겨둔 stub입니다. 해당 테이블이 Supabase에 추가되면 제거됩니다.
 */

export interface MockUserStub {
  uid: string;
  name: string;
  appNickname: string;
}

// 빈 stub — complaints/notes 페이지는 회원명 조회 실패 시 uid를 그대로 표시합니다.
export const mockUsers: MockUserStub[] = [];

export function getMockUsers(): MockUserStub[] {
  return mockUsers;
}

export function getMockUserByUid(uid: string): MockUserStub | undefined {
  return mockUsers.find((u) => u.uid === uid);
}

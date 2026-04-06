/**
 * Firebase 초기화 모듈
 * ─────────────────────────────────────────────────────
 * 향후 Firestore 연동 시 db, auth 인스턴스를 이 파일에서 import해서 사용.
 *
 * 예상 컬렉션 구조:
 *   - members            (AdminUser 문서)
 *   - memberVerifications (VerificationItem 서브컬렉션 또는 별도 컬렉션)
 *   - adminNotes         (AdminNote 문서)
 *   - complaints         (Complaint 문서)
 *   - adminLogs          (변경 이력)
 */

import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey:            process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain:        process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId:         process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket:     process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId:             process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const db   = getFirestore(app);
export const auth = getAuth(app);

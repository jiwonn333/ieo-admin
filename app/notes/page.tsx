'use client';

import React from 'react';
import { StickyNote } from 'lucide-react';

export default function MemosPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">관리자 메모</h1>
          <p className="text-gray-500 mt-1">회원별로 작성된 중요한 관리자 메모를 한눈에 모아봅니다.</p>
        </div>
      </div>

      <div className="bg-white p-12 rounded-2xl border border-gray-100 shadow-sm flex flex-col items-center justify-center gap-4">
        <div className="w-16 h-16 rounded-full bg-neutral-50 flex items-center justify-center">
          <StickyNote size={32} className="text-neutral-200" />
        </div>
        <div className="text-center">
          <p className="text-neutral-500 font-medium">등록된 메모가 없습니다.</p>
          <p className="text-neutral-400 text-sm mt-1">회원 상세 페이지에서 메모를 작성하면 이곳에 표시됩니다.</p>
        </div>
      </div>
    </div>
  );
}

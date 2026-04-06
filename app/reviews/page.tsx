'use client';

import React from 'react';
import { UserRoundSearch } from 'lucide-react';

export default function ReviewsPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">익명평가</h1>
        <p className="text-gray-500 text-sm">회원 간 익명 평가 내역을 조회하고 관리합니다.</p>
      </div>

      <div className="bg-white p-12 rounded-2xl border border-gray-100 shadow-sm flex flex-col items-center justify-center gap-4">
        <div className="w-16 h-16 rounded-full bg-neutral-50 flex items-center justify-center">
          <UserRoundSearch size={32} className="text-neutral-200" />
        </div>
        <div className="text-center">
          <p className="text-neutral-500 font-medium">등록된 익명평가가 없습니다.</p>
          <p className="text-neutral-400 text-sm mt-1">회원 간 평가가 접수되면 이곳에 표시됩니다.</p>
        </div>
      </div>
    </div>
  );
}

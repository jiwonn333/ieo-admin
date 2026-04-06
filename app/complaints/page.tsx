'use client';

import React from 'react';
import { MessageSquareWarning } from 'lucide-react';

export default function ComplaintsPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">민원 관리</h1>
        <p className="text-gray-500 text-sm">회원들이 접수한 민원과 신고 내역을 통합 조회하고 처리합니다.</p>
      </div>

      <div className="bg-white p-12 rounded-2xl border border-gray-100 shadow-sm flex flex-col items-center justify-center gap-4">
        <div className="w-16 h-16 rounded-full bg-neutral-50 flex items-center justify-center">
          <MessageSquareWarning size={32} className="text-neutral-200" />
        </div>
        <div className="text-center">
          <p className="text-neutral-500 font-medium">접수된 민원이 없습니다.</p>
          <p className="text-neutral-400 text-sm mt-1">회원이 신고하면 이곳에 표시됩니다.</p>
        </div>
      </div>
    </div>
  );
}

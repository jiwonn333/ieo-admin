'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import type { Member } from '@/features/admin/types';
import { Users, UserPlus, ShieldAlert, ShieldCheck } from 'lucide-react';

export default function DashboardPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [statsData, setStatsData] = useState({ pendingProfileCount: 0, suspendedCount: 0, activeCount: 0, totalPendingVerifications: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      const [membersRes, statsRes] = await Promise.all([
        fetch('/api/members'),
        fetch('/api/verifications/stats'),
      ]);
      const [membersData, stats] = await Promise.all([
        membersRes.json(),
        statsRes.json(),
      ]);
      setMembers(membersData);
      setStatsData(stats);
      setLoading(false);
    }
    fetchData();
  }, []);

  const pendingProfileMembers = members.filter((m) =>
    m.app_status === 'pending_review' ||
    m.member_verifications?.some(
      (v) => v.verification_type === 'profile_photo' && v.status === 'pending_review'
    )
  );

  const stats = [
    {
      title: '프로필 승인 대기',
      value: statsData.pendingProfileCount,
      icon: UserPlus,
      color: 'text-amber-600',
      bg: 'bg-amber-100',
      href: '/admin/verifications?type=profile_photo&status=pending_review',
    },
    {
      title: '전체 인증 대기',
      value: statsData.totalPendingVerifications,
      icon: ShieldCheck,
      color: 'text-blue-600',
      bg: 'bg-blue-100',
      href: '/admin/verifications?status=pending_review',
    },
    {
      title: '정지 회원',
      value: statsData.suspendedCount,
      icon: ShieldAlert,
      color: 'text-rose-600',
      bg: 'bg-rose-100',
      href: '/admin?status=suspended',
    },
    {
      title: '활성 회원 수',
      value: statsData.activeCount,
      icon: Users,
      color: 'text-emerald-600',
      bg: 'bg-emerald-100',
      href: '/admin?status=active',
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">로딩 중...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">대시보드</h1>
        <p className="text-gray-500 mt-1">오늘의 주요 운영 지표를 확인하세요.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <Link key={i} href={stat.href}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-500">{stat.title}</p>
                      <p className="text-3xl font-bold mt-2 text-gray-900">{stat.value}</p>
                    </div>
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${stat.bg} ${stat.color}`}>
                      <Icon size={24} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>프로필 승인 대기 회원</CardTitle>
              {pendingProfileMembers.length > 0 && (
                <Link
                  href="/admin/verifications?type=profile_photo&status=pending_review"
                  className="text-sm text-amber-600 hover:text-amber-700 font-medium"
                >
                  전체보기
                </Link>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pendingProfileMembers
                .slice(0, 5)
                .map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div>
                      <p className="font-medium text-gray-900">{member.real_name ?? '-'}</p>
                      <p className="text-sm text-gray-500">@{member.app_nickname ?? '-'}</p>
                    </div>
                    <Link
                      href={`/admin/users/${member.id}/verifications`}
                      className="text-sm font-medium text-amber-600 hover:text-amber-700"
                    >
                      검수하기
                    </Link>
                  </div>
                ))}
              {pendingProfileMembers.length === 0 && (
                <p className="text-gray-500 text-sm py-4 text-center">대기 중인 회원이 없습니다.</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>최근 가입 회원</CardTitle>
              <Link
                href="/admin"
                className="text-sm text-gray-500 hover:text-gray-700 font-medium"
              >
                전체보기
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {members
                .slice(0, 5)
                .map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div>
                      <p className="font-medium text-gray-900">{member.real_name ?? '-'}</p>
                      <p className="text-sm text-gray-500">@{member.app_nickname ?? '-'}</p>
                    </div>
                    <Link
                      href={`/admin/users/${member.id}`}
                      className="text-sm font-medium text-gray-600 hover:text-gray-900"
                    >
                      상세보기
                    </Link>
                  </div>
                ))}
              {members.length === 0 && (
                <p className="text-gray-500 text-sm py-4 text-center">가입된 회원이 없습니다.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

'use client';
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { logout } from '@/lib/auth/actions';
import {
  Users,
  MessageSquareWarning,
  StickyNote,
  LayoutDashboard,
  Settings,
  LogOut,
  ShieldCheck,
  UserRoundSearch,
} from 'lucide-react';

const navItems = [
  { href: '/dashboard', label: '대시보드', icon: LayoutDashboard },
  { href: '/admin',     label: '회원관리',  icon: Users },
  { href: '/admin/verifications', label: '검증관리', icon: ShieldCheck },
  { href: '/reviews',   label: '익명평가',  icon: UserRoundSearch },
  { href: '/complaints', label: '민원관리', icon: MessageSquareWarning },
  { href: '/notes',     label: '관리자 메모', icon: StickyNote },
  { href: '/settings',  label: '설정',      icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 w-64 bg-white border-r border-gray-100 z-50 shadow-sm flex flex-col">
      <div className="flex h-16 shrink-0 items-center px-6 border-b border-gray-50">
        <div className="flex items-center gap-2 text-xl font-bold tracking-tight text-gray-900">
          <span className="text-amber-500">IEO</span>
          <span>Admin</span>
        </div>
      </div>

      <nav className="flex flex-1 flex-col p-4 gap-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== '/' && item.href !== '/admin' && pathname.startsWith(item.href)) ||
            (item.href === '/admin' && (pathname === '/admin' || pathname.startsWith('/admin/users')));
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-amber-50 text-amber-900'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
              )}
            >
              <Icon
                size={18}
                className={cn(
                  isActive ? 'text-amber-600' : 'text-gray-400 group-hover:text-gray-600',
                )}
              />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-gray-50">
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-sm font-medium text-gray-600">
            A
          </div>
          <div className="flex flex-col flex-1 min-w-0">
            <span className="text-sm font-medium text-gray-900 truncate">Admin User</span>
            <span className="text-xs text-gray-500 truncate">admin@ieo.kr</span>
          </div>
          <form action={logout}>
            <button
              type="submit"
              title="로그아웃"
              className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <LogOut size={16} />
            </button>
          </form>
        </div>
      </div>
    </aside>
  );
}

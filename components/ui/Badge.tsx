import { cn } from '@/lib/utils';
import { AppStatus, VerificationStatus, ComplaintStatus } from '@/features/admin/types';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  status: AppStatus | VerificationStatus | ComplaintStatus;
  className?: string;
}

export function StatusBadge({ status, className, ...props }: BadgeProps) {
  let bgColors = 'bg-gray-100 text-gray-600';
  let label = status as string;

  switch (status) {
    // ─── AppStatus ──────────────────────────────────────────────────
    case 'signup_in_progress':
      bgColors = 'bg-neutral-200 text-neutral-600';
      label = '가입진행중';
      break;
    case 'pending_review':
      // AppStatus + VerificationStatus 공용 — 여기서는 심사중으로 표시
      bgColors = 'bg-blue-100 text-blue-700';
      label = '심사중';
      break;
    case 'active':
      bgColors = 'bg-emerald-100 text-emerald-700';
      label = '정상';
      break;
    case 'suspended':
      bgColors = 'bg-rose-100 text-rose-700';
      label = '정지';
      break;
    case 'rejected':
      bgColors = 'bg-rose-100 text-rose-700';
      label = '거절/반려';
      break;

    // ─── VerificationStatus ─────────────────────────────────────────
    case 'unverified':
      bgColors = 'bg-gray-100 text-gray-400 border border-gray-200';
      label = '미제출';
      break;
    case 'approved':
      bgColors = 'bg-emerald-100 text-emerald-700';
      label = '승인됨';
      break;

    // ─── ComplaintStatus ────────────────────────────────────────────
    case 'RECEIVED':
      bgColors = 'bg-rose-100 text-rose-700';
      label = '접수됨';
      break;
    case 'IN_PROGRESS':
      bgColors = 'bg-amber-100 text-amber-700';
      label = '처리중';
      break;
    case 'RESOLVED':
      bgColors = 'bg-emerald-100 text-emerald-700';
      label = '해결됨';
      break;
  }

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        bgColors,
        className,
      )}
      {...props}
    >
      {label}
    </span>
  );
}

/**
 * VerificationBadge — VerificationStatus 전용 뱃지.
 */
export function VerificationBadge({
  status,
  className,
  ...props
}: {
  status: VerificationStatus;
  className?: string;
} & React.HTMLAttributes<HTMLSpanElement>) {
  const map: Record<VerificationStatus, { cls: string; label: string }> = {
    unverified:     { cls: 'bg-gray-100 text-gray-400 border border-gray-200', label: '미제출' },
    pending_review: { cls: 'bg-blue-100 text-blue-700',                        label: '심사중' },
    approved:       { cls: 'bg-emerald-100 text-emerald-700',                  label: '승인됨' },
    rejected:       { cls: 'bg-rose-100 text-rose-700',                        label: '반려'   },
  };

  const { cls, label } = map[status];

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        cls,
        className,
      )}
      {...props}
    >
      {label}
    </span>
  );
}

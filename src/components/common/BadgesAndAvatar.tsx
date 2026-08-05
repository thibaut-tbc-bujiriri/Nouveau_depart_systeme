import { cn } from '@/lib/cn';
import { roleLabels } from '@/utils/permissions';

interface BranchBadgeProps {
  branchName: string;
}

export function BranchBadge({ branchName }: BranchBadgeProps) {
  return (
    <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
      {branchName}
    </span>
  );
}

interface DepartmentBadgeProps {
  name: string;
}

export function DepartmentBadge({ name }: DepartmentBadgeProps) {
  return (
    <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
      {name}
    </span>
  );
}

interface AvatarProps {
  name: string;
  avatarUrl?: string | null;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function Avatar({ name, avatarUrl, size = 'md', className }: AvatarProps) {
  const sizeClasses = {
    sm: 'size-7 text-xs',
    md: 'size-9 text-xs',
    lg: 'size-12 text-sm',
  };

  const safeName = name || '';
  const initials = safeName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase())
    .join('') || '?';

  return (
    <div
      className={cn(
        'grid place-items-center rounded-full bg-slate-900 font-bold text-white overflow-hidden shrink-0 border border-slate-700/10',
        sizeClasses[size],
        className,
      )}
    >
      {avatarUrl ? (
        <img src={avatarUrl} alt={safeName} className="h-full w-full object-cover" />
      ) : (
        <span>{initials}</span>
      )}
    </div>
  );
}

interface UserAvatarProps {
  name: string;
  role: keyof typeof roleLabels;
  avatarUrl?: string | null;
}

export function UserAvatar({ name, role, avatarUrl }: UserAvatarProps) {
  return (
    <div className="inline-flex items-center gap-2">
      <Avatar name={name} avatarUrl={avatarUrl} size="md" />
      <div className="hidden min-w-0 sm:block text-left">
        <p className="truncate text-sm font-semibold text-slate-800">{name}</p>
        <p className="truncate text-xs text-slate-500">{roleLabels[role]}</p>
      </div>
    </div>
  );
}

interface BranchAvatarProps {
  name: string;
  avatarUrl?: string | null;
  size?: 'sm' | 'md' | 'lg';
}

export function BranchAvatar({ name, avatarUrl, size = 'md' }: BranchAvatarProps) {
  return (
    <div className="inline-flex items-center gap-2">
      <Avatar name={name} avatarUrl={avatarUrl} size={size} />
      <span className="text-sm font-medium text-slate-800">{name}</span>
    </div>
  );
}



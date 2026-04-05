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

interface UserAvatarProps {
  name: string;
  role: keyof typeof roleLabels;
}

export function UserAvatar({ name, role }: UserAvatarProps) {
  const initials = name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase())
    .join('');

  return (
    <div className="inline-flex items-center gap-2">
      <div className="grid size-9 place-items-center rounded-full bg-slate-900 text-xs font-semibold text-white">
        {initials}
      </div>
      <div className="hidden min-w-0 sm:block">
        <p className="truncate text-sm font-semibold text-slate-800">{name}</p>
        <p className="truncate text-xs text-slate-500">{roleLabels[role]}</p>
      </div>
    </div>
  );
}


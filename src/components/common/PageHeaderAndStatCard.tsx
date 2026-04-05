import { cn } from '@/lib/cn';
import type { PropsWithChildren } from 'react';

interface PageHeaderProps extends PropsWithChildren {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}

export function PageHeader({ title, description, actions, children }: PageHeaderProps) {
  return (
    <div className="mb-5 space-y-3">
      <div className={cn('flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between')}>
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 sm:text-3xl">{title}</h1>
          {description ? <p className="mt-1 text-sm text-slate-600">{description}</p> : null}
        </div>
        {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
      </div>
      {children}
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: string;
  helperText?: string;
  trend?: 'up' | 'down' | 'neutral';
}

const trendColor: Record<NonNullable<StatCardProps['trend']>, string> = {
  up: 'text-emerald-600',
  down: 'text-rose-600',
  neutral: 'text-slate-500',
};

export function StatCard({ label, value, helperText, trend = 'neutral' }: StatCardProps) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3 h-1 w-12 rounded-full bg-gradient-to-r from-cyan-500 to-emerald-500" />
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-slate-900">{value}</p>
      {helperText ? <p className={cn('mt-2 text-xs', trendColor[trend])}>{helperText}</p> : null}
    </article>
  );
}


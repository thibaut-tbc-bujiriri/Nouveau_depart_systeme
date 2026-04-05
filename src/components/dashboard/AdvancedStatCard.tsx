import { SectionCard } from '@/components/dashboard/SectionCard';
import { TrendIndicator } from '@/components/dashboard/TrendIndicator';
import { cn } from '@/lib/cn';
import type { LucideIcon } from 'lucide-react';

interface AdvancedStatCardProps {
  label: string;
  value: string;
  subtitle?: string;
  trend?: number;
  icon: LucideIcon;
  tone?: 'default' | 'success' | 'warning';
}

const toneClasses: Record<NonNullable<AdvancedStatCardProps['tone']>, string> = {
  default: 'bg-slate-900 text-white',
  success: 'bg-emerald-600 text-white',
  warning: 'bg-amber-500 text-white',
};

export function AdvancedStatCard({
  label,
  value,
  subtitle,
  trend,
  icon: Icon,
  tone = 'default',
}: AdvancedStatCardProps) {
  return (
    <SectionCard className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-slate-500">{label}</p>
          <p className="mt-2 text-3xl font-semibold text-slate-900">{value}</p>
          {subtitle ? <p className="mt-1 text-xs text-slate-500">{subtitle}</p> : null}
        </div>
        <div className={cn('grid size-10 place-items-center rounded-xl', toneClasses[tone])}>
          <Icon className="size-5" />
        </div>
      </div>
      {typeof trend === 'number' ? <TrendIndicator value={trend} className="mt-4" /> : null}
    </SectionCard>
  );
}


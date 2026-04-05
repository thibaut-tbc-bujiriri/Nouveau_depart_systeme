import { DashboardSectionHeader } from '@/components/dashboard/DashboardSectionHeader';
import { SectionCard } from '@/components/dashboard/SectionCard';
import type { WeeklyProgramItem } from '@/features/dashboard/types';
import { CalendarClock } from 'lucide-react';

interface WeeklyProgramCardProps {
  items: WeeklyProgramItem[];
}

export function WeeklyProgramCard({ items }: WeeklyProgramCardProps) {
  return (
    <SectionCard>
      <DashboardSectionHeader title="Planning hebdomadaire ECND" />
      <ul className="space-y-2">
        {items.map((item) => (
          <li key={`${item.day}-${item.title}`} className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 px-3 py-2">
            <div>
              <p className="text-sm font-semibold text-slate-800">{item.day}</p>
              <p className="text-sm text-slate-600">{item.title}</p>
            </div>
            <div className="text-right">
              <p className="inline-flex items-center gap-1 text-xs text-slate-500">
                <CalendarClock className="size-3.5" />
                {item.startTime}
              </p>
              <p className="text-xs text-slate-400">{item.location}</p>
            </div>
          </li>
        ))}
      </ul>
    </SectionCard>
  );
}


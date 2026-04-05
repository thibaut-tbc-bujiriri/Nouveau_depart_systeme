import { DashboardSectionHeader } from '@/components/dashboard/DashboardSectionHeader';
import { SectionCard } from '@/components/dashboard/SectionCard';
import { formatDate } from '@/utils/format';
import type { ActivityItem } from '@/features/dashboard/types';
import { Bell, CheckCircle2, CircleAlert } from 'lucide-react';

interface ActivityFeedProps {
  title?: string;
  activities: ActivityItem[];
}

const levelIconMap = {
  info: Bell,
  success: CheckCircle2,
  warning: CircleAlert,
};

const levelColorMap = {
  info: 'text-blue-600 bg-blue-50',
  success: 'text-emerald-600 bg-emerald-50',
  warning: 'text-amber-600 bg-amber-50',
};

const statusStyleMap = {
  planifie: 'bg-slate-100 text-slate-700',
  en_cours: 'bg-blue-100 text-blue-700',
  termine: 'bg-emerald-100 text-emerald-700',
};

export function ActivityFeed({ title = 'Activites recentes', activities }: ActivityFeedProps) {
  return (
    <SectionCard>
      <DashboardSectionHeader title={title} />
      <ul className="space-y-3">
        {activities.map((activity) => {
          const Icon = levelIconMap[activity.level];
          return (
            <li key={activity.id} className="flex items-start gap-3 rounded-xl bg-slate-50 p-3">
              <span className={`mt-0.5 rounded-lg p-1.5 ${levelColorMap[activity.level]}`}>
                <Icon className="size-4" />
              </span>
              <div className="min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-slate-800">{activity.title}</p>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${statusStyleMap[activity.status]}`}>
                    {activity.status.replace('_', ' ')}
                  </span>
                </div>
                <p className="text-sm text-slate-600">{activity.description}</p>
                <p className="mt-1 text-xs text-slate-400">{formatDate(activity.date)}</p>
              </div>
            </li>
          );
        })}
      </ul>
    </SectionCard>
  );
}


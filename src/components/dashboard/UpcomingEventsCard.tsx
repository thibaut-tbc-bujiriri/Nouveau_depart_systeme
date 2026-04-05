import { DashboardSectionHeader } from '@/components/dashboard/DashboardSectionHeader';
import { EmptyState } from '@/components/common';
import { SectionCard } from '@/components/dashboard/SectionCard';
import type { UpcomingEventItem } from '@/features/dashboard/types';
import { formatDate } from '@/utils/format';

interface UpcomingEventsCardProps {
  events: UpcomingEventItem[];
  title?: string;
}

export function UpcomingEventsCard({ events, title = 'Evenements a venir' }: UpcomingEventsCardProps) {
  return (
    <SectionCard>
      <DashboardSectionHeader title={title} />
      {events.length === 0 ? (
        <EmptyState title="Aucun evenement" description="Le calendrier est vide pour le moment." />
      ) : (
        <ul className="space-y-2">
          {events.map((event) => (
            <li key={event.id} className="rounded-xl border border-slate-200 px-3 py-2">
              <p className="text-sm font-semibold text-slate-800">{event.title}</p>
              <p className="text-xs text-slate-500">
                {formatDate(event.date)} - {event.location}
              </p>
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  );
}


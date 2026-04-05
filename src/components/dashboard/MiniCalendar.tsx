import { startOfMonth, endOfMonth, eachDayOfInterval, format, isSameDay, parseISO } from 'date-fns';
import type { UpcomingEventItem } from '@/features/dashboard/types';

interface MiniCalendarProps {
  events: UpcomingEventItem[];
}

export function MiniCalendar({ events }: MiniCalendarProps) {
  const now = new Date();
  const days = eachDayOfInterval({ start: startOfMonth(now), end: endOfMonth(now) });

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">{format(now, 'MMMM yyyy')}</p>
      <div className="grid grid-cols-7 gap-1 text-center text-xs">
        {days.map((day) => {
          const hasEvent = events.some((event) => isSameDay(parseISO(event.date), day));
          return (
            <div
              key={day.toISOString()}
              className={`grid h-8 place-items-center rounded-md ${hasEvent ? 'bg-emerald-100 text-emerald-700' : 'text-slate-500'}`}
            >
              {format(day, 'd')}
            </div>
          );
        })}
      </div>
    </div>
  );
}


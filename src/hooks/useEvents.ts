import { useDashboardStats } from '@/hooks/useDashboardStats';
import type { Profile } from '@/types';

export function useEvents(user: Profile) {
  const { upcomingEvents, isLoading, error, source } = useDashboardStats(user);

  return {
    events: upcomingEvents,
    isLoading,
    error,
    source,
  };
}


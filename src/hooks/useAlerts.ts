import { useDashboardStats } from '@/hooks/useDashboardStats';
import type { Profile } from '@/types';

export function useAlerts(user: Profile) {
  const { openAlerts, isLoading, error, source } = useDashboardStats(user);

  return {
    alerts: openAlerts,
    isLoading,
    error,
    source,
  };
}


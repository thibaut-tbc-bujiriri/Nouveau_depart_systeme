import { services as mockServices } from '@/data';
import { createService, deleteService, getServices, type ServiceUpsertInput, updateService } from '@/services/services.service';
import { pickNumber, pickString } from '@/services/normalizers';
import type { Service } from '@/types';
import { useCallback, useEffect, useState } from 'react';

export function normalizeServiceRow(row: Record<string, unknown>): Service {
  const typeRaw = pickString(row, ['service_type', 'type'], 'sunday').toLowerCase();
  const type: Service['type'] =
    typeRaw === 'sunday' || typeRaw === 'midweek' || typeRaw === 'prayer' || typeRaw === 'special'
      ? typeRaw
      : 'special';

  return {
    id: pickString(row, ['id']),
    branchId: pickString(row, ['branch_id', 'branchId']),
    title: pickString(row, ['title', 'name'], 'Service'),
    date: pickString(row, ['service_date', 'date'], new Date().toISOString().slice(0, 10)),
    startTime: pickString(row, ['start_time', 'startTime'], '--:--'),
    endTime: pickString(row, ['end_time', 'endTime'], '--:--'),
    preacher: pickString(row, ['preacher', 'speaker'], 'N/A'),
    attendance: pickNumber(row, ['attendance', 'participants_count'], 0),
    type,
  };
}

export function useServicesData() {
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isMutating, setIsMutating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [source, setSource] = useState<'supabase' | 'mock'>('supabase');

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const rows = await getServices();
      setServices((rows as Record<string, unknown>[]).map(normalizeServiceRow));
      setSource('supabase');
    } catch (err) {
      setServices(mockServices);
      setSource('mock');
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement des services.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const runMutation = useCallback(
    async (action: () => Promise<void>) => {
      setIsMutating(true);
      setError(null);
      try {
        await action();
        await load();
        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Operation impossible.');
        return false;
      } finally {
        setIsMutating(false);
      }
    },
    [load],
  );

  return {
    services,
    isLoading,
    isMutating,
    error,
    source,
    reload: load,
    createService: (payload: ServiceUpsertInput) => runMutation(() => createService(payload)),
    updateService: (serviceId: string, payload: ServiceUpsertInput) => runMutation(() => updateService(serviceId, payload)),
    deleteService: (serviceId: string) => runMutation(() => deleteService(serviceId)),
  };
}

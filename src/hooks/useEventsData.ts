import { events as mockEvents } from '@/data';
import { createEvent, deleteEvent, getEvents, type EventUpsertInput, updateEvent } from '@/services/events.service';
import { pickNullableString, pickNumber, pickString } from '@/services/normalizers';
import type { Event } from '@/types';
import { useCallback, useEffect, useState } from 'react';

export function normalizeEventRow(row: Record<string, unknown>): Event {
  const statusRaw = pickString(row, ['status'], 'scheduled').toLowerCase();
  const status: Event['status'] = statusRaw === 'completed' ? 'completed' : statusRaw === 'draft' ? 'draft' : 'scheduled';

  return {
    id: pickString(row, ['id']),
    branchId: pickString(row, ['branch_id', 'branchId']),
    title: pickString(row, ['title', 'name'], 'Evenement'),
    date: pickString(row, ['event_date', 'date', 'start_date'], new Date().toISOString().slice(0, 10)),
    location: pickString(row, ['location', 'venue'], '-'),
    organizerDepartmentId: pickNullableString(row, ['organizer_department_id', 'department_id', 'organizerDepartmentId']),
    status,
    expectedParticipants: pickNumber(row, ['expected_participants', 'expectedParticipants', 'participants_count'], 0),
  };
}

export function useEventsData() {
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isMutating, setIsMutating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [source, setSource] = useState<'supabase' | 'mock'>('supabase');

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const rows = await getEvents();
      setEvents((rows as Record<string, unknown>[]).map(normalizeEventRow));
      setSource('supabase');
    } catch (err) {
      setEvents(mockEvents);
      setSource('mock');
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement des evenements.');
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
    events,
    isLoading,
    isMutating,
    error,
    source,
    reload: load,
    createEvent: (payload: EventUpsertInput) => runMutation(() => createEvent(payload)),
    updateEvent: (eventId: string, payload: EventUpsertInput) => runMutation(() => updateEvent(eventId, payload)),
    deleteEvent: (eventId: string) => runMutation(() => deleteEvent(eventId)),
  };
}

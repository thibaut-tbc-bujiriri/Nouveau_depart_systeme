import { supabase } from '@/lib/supabaseClient';

export interface EventUpsertInput {
  branchId: string;
  title: string;
  date: string;
  location: string;
  status: 'draft' | 'scheduled' | 'completed';
  expectedParticipants: number;
  organizerDepartmentId?: string;
}

interface EventColumnMap {
  date: string;
  location: string | null;
  status: string;
  expectedParticipants: string | null;
  organizerDepartmentId: string | null;
}

let eventColumnMapPromise: Promise<EventColumnMap> | null = null;

async function firstSupportedColumn(candidates: string[]): Promise<string> {
  for (const column of candidates) {
    const probe = await supabase.from('events').select(column).limit(1);
    if (!probe.error) {
      return column;
    }
  }

  throw new Error(`Aucune colonne supportee trouvee parmi: ${candidates.join(', ')}`);
}

async function firstSupportedOptionalColumn(candidates: string[]): Promise<string | null> {
  for (const column of candidates) {
    const probe = await supabase.from('events').select(column).limit(1);
    if (!probe.error) {
      return column;
    }
  }
  return null;
}

async function getEventColumnMap(): Promise<EventColumnMap> {
  if (!eventColumnMapPromise) {
    eventColumnMapPromise = Promise.all([
      firstSupportedColumn(['event_date', 'date', 'start_date']),
      firstSupportedOptionalColumn(['location', 'venue', 'place']),
      firstSupportedColumn(['status', 'event_status', 'state']),
      firstSupportedOptionalColumn(['expected_participants', 'participants_count', 'expected_attendance', 'target_participants']),
      firstSupportedOptionalColumn(['organizer_department_id', 'department_id', 'organizerDepartmentId']),
    ]).then(([date, location, status, expectedParticipants, organizerDepartmentId]) => ({
      date,
      location,
      status,
      expectedParticipants,
      organizerDepartmentId,
    }));
  }

  return eventColumnMapPromise;
}

function normalizeDateInput(value: string) {
  const trimmed = value.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return trimmed;
  }

  const match = trimmed.match(/^:?\s*(\d{2})\/(\d{2})\/(\d{4})$/);
  if (match) {
    const [, dd, mm, yyyy] = match;
    return `${yyyy}-${mm}-${dd}`;
  }

  return trimmed;
}

export async function getEvents() {
  const columnMap = await getEventColumnMap();
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .order(columnMap.date, { ascending: true });

  if (error || !data) {
    throw error ?? new Error('Impossible de charger les evenements.');
  }

  return data;
}

export async function createEvent(payload: EventUpsertInput): Promise<void> {
  const columnMap = await getEventColumnMap();
  const insertPayload: Record<string, unknown> = {
    branch_id: payload.branchId,
    title: payload.title,
    [columnMap.date]: normalizeDateInput(payload.date),
    [columnMap.status]: payload.status,
  };
  if (columnMap.location) {
    insertPayload[columnMap.location] = payload.location;
  }
  if (columnMap.expectedParticipants) {
    insertPayload[columnMap.expectedParticipants] = payload.expectedParticipants;
  }
  if (columnMap.organizerDepartmentId) {
    insertPayload[columnMap.organizerDepartmentId] = payload.organizerDepartmentId || null;
  }

  const { error } = await supabase.from('events').insert(insertPayload);

  if (error) {
    throw new Error(error.message || "Impossible d'ajouter l'evenement.");
  }
}

export async function updateEvent(eventId: string, payload: EventUpsertInput): Promise<void> {
  const columnMap = await getEventColumnMap();
  const updatePayload: Record<string, unknown> = {
    branch_id: payload.branchId,
    title: payload.title,
    [columnMap.date]: normalizeDateInput(payload.date),
    [columnMap.status]: payload.status,
  };
  if (columnMap.location) {
    updatePayload[columnMap.location] = payload.location;
  }
  if (columnMap.expectedParticipants) {
    updatePayload[columnMap.expectedParticipants] = payload.expectedParticipants;
  }
  if (columnMap.organizerDepartmentId) {
    updatePayload[columnMap.organizerDepartmentId] = payload.organizerDepartmentId || null;
  }

  const { error } = await supabase
    .from('events')
    .update(updatePayload)
    .eq('id', eventId);

  if (error) {
    throw new Error(error.message || "Impossible de modifier l'evenement.");
  }
}

export async function deleteEvent(eventId: string): Promise<void> {
  const { error } = await supabase.from('events').delete().eq('id', eventId);

  if (error) {
    throw error;
  }
}

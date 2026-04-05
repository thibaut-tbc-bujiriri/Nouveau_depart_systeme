import { supabase } from '@/lib/supabase';

export interface EventUpsertInput {
  branchId: string;
  title: string;
  date: string;
  location: string;
  status: 'draft' | 'scheduled' | 'completed';
  expectedParticipants: number;
  organizerDepartmentId?: string;
}

export async function getEvents() {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .order('event_date', { ascending: true });

  if (error || !data) {
    throw error ?? new Error('Impossible de charger les evenements.');
  }

  return data;
}

export async function createEvent(payload: EventUpsertInput): Promise<void> {
  const { error } = await supabase.from('events').insert({
    branch_id: payload.branchId,
    title: payload.title,
    event_date: payload.date,
    location: payload.location,
    status: payload.status,
    expected_participants: payload.expectedParticipants,
    organizer_department_id: payload.organizerDepartmentId || null,
  });

  if (error) {
    throw error;
  }
}

export async function updateEvent(eventId: string, payload: EventUpsertInput): Promise<void> {
  const { error } = await supabase
    .from('events')
    .update({
      branch_id: payload.branchId,
      title: payload.title,
      event_date: payload.date,
      location: payload.location,
      status: payload.status,
      expected_participants: payload.expectedParticipants,
      organizer_department_id: payload.organizerDepartmentId || null,
    })
    .eq('id', eventId);

  if (error) {
    throw error;
  }
}

export async function deleteEvent(eventId: string): Promise<void> {
  const { error } = await supabase.from('events').delete().eq('id', eventId);

  if (error) {
    throw error;
  }
}

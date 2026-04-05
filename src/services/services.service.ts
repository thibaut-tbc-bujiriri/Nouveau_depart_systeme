import { supabase } from '@/lib/supabase';

export interface ServiceUpsertInput {
  branchId: string;
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  preacher: string;
  attendance: number;
  type: 'sunday' | 'midweek' | 'prayer' | 'special';
}

export async function getServices() {
  const { data, error } = await supabase
    .from('services')
    .select('*')
    .order('service_date', { ascending: false });

  if (error || !data) {
    throw error ?? new Error('Impossible de charger les services.');
  }

  return data;
}

export async function createService(payload: ServiceUpsertInput): Promise<void> {
  const { error } = await supabase.from('services').insert({
    branch_id: payload.branchId,
    title: payload.title,
    service_date: payload.date,
    start_time: payload.startTime,
    end_time: payload.endTime,
    speaker: payload.preacher,
    participants_count: payload.attendance,
    service_type: payload.type,
  });

  if (error) {
    throw error;
  }
}

export async function updateService(serviceId: string, payload: ServiceUpsertInput): Promise<void> {
  const { error } = await supabase
    .from('services')
    .update({
      branch_id: payload.branchId,
      title: payload.title,
      service_date: payload.date,
      start_time: payload.startTime,
      end_time: payload.endTime,
      speaker: payload.preacher,
      participants_count: payload.attendance,
      service_type: payload.type,
    })
    .eq('id', serviceId);

  if (error) {
    throw error;
  }
}

export async function deleteService(serviceId: string): Promise<void> {
  const { error } = await supabase.from('services').delete().eq('id', serviceId);

  if (error) {
    throw error;
  }
}

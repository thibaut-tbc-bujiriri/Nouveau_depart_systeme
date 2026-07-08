import { supabase } from '@/lib/supabaseClient';
import { createNotification } from '@/services/notificationsService';

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

interface ServiceColumnMap {
  date: string;
  startTime: string;
  endTime: string;
  speaker: string;
  attendance: string | null;
  serviceType: string;
}

let serviceColumnMapPromise: Promise<ServiceColumnMap> | null = null;

async function firstSupportedColumn(candidates: string[]): Promise<string> {
  for (const column of candidates) {
    const probe = await supabase.from('services').select(column).limit(1);
    if (!probe.error) {
      return column;
    }
  }

  throw new Error(`Aucune colonne supportee trouvee parmi: ${candidates.join(', ')}`);
}

async function firstSupportedOptionalColumn(candidates: string[]): Promise<string | null> {
  for (const column of candidates) {
    const probe = await supabase.from('services').select(column).limit(1);
    if (!probe.error) {
      return column;
    }
  }

  return null;
}

async function getServiceColumnMap(): Promise<ServiceColumnMap> {
  if (!serviceColumnMapPromise) {
    serviceColumnMapPromise = Promise.all([
      firstSupportedColumn(['service_date', 'date']),
      firstSupportedColumn(['start_time', 'startTime']),
      firstSupportedColumn(['end_time', 'endTime']),
      firstSupportedColumn(['speaker', 'preacher']),
      firstSupportedOptionalColumn([
        'actual_attendance',
        'expected_attendance',
        'participants_count',
        'attendance',
        'participants',
        'attendance_count',
        'participant_count',
        'frequentation',
        'frequency',
      ]),
      firstSupportedColumn(['service_type', 'type']),
    ]).then(([date, startTime, endTime, speaker, attendance, serviceType]) => ({
      date,
      startTime,
      endTime,
      speaker,
      attendance,
      serviceType,
    }));
  }

  return serviceColumnMapPromise;
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

export async function getServices() {
  const columnMap = await getServiceColumnMap();
  const { data, error } = await supabase
    .from('services')
    .select('*')
    .order(columnMap.date, { ascending: false });

  if (error || !data) {
    throw error ?? new Error('Impossible de charger les services.');
  }

  return data;
}

export async function createService(payload: ServiceUpsertInput): Promise<void> {
  const columnMap = await getServiceColumnMap();
  const insertPayload: Record<string, unknown> = {
    branch_id: payload.branchId,
    title: payload.title,
    [columnMap.date]: normalizeDateInput(payload.date),
    [columnMap.startTime]: payload.startTime,
    [columnMap.endTime]: payload.endTime,
    [columnMap.speaker]: payload.preacher,
    [columnMap.serviceType]: payload.type,
  };
  if (columnMap.attendance) {
    insertPayload[columnMap.attendance] = payload.attendance;
  }

  const { error } = await supabase.from('services').insert(insertPayload);

  if (error) {
    throw new Error(error.message || "Impossible d'ajouter le programme.");
  }

  try {
    await createNotification({
      title: "Nouveau service programmé",
      message: `Le service "${payload.title}" a été programmé le ${payload.date} de ${payload.startTime} à ${payload.endTime}.`,
      type: "service_created",
      priority: "normal",
      targetExtensionId: payload.branchId,
      link: "/services"
    });
  } catch (err) {
    console.error("Failed to create service_created notification:", err);
  }

  try {
    const { createActivityLog } = await import('@/services/activityLogService');
    await createActivityLog({
      actionType: 'service_created',
      module: 'services',
      title: 'Planification d\'un culte',
      description: `Le culte "${payload.title}" a été planifié pour le ${payload.date}.`,
      status: 'success',
      extensionId: payload.branchId
    });
  } catch (err) {
    console.error("Log service creation error:", err);
  }
}

export async function updateService(serviceId: string, payload: ServiceUpsertInput): Promise<void> {
  const columnMap = await getServiceColumnMap();
  const updatePayload: Record<string, unknown> = {
    branch_id: payload.branchId,
    title: payload.title,
    [columnMap.date]: normalizeDateInput(payload.date),
    [columnMap.startTime]: payload.startTime,
    [columnMap.endTime]: payload.endTime,
    [columnMap.speaker]: payload.preacher,
    [columnMap.serviceType]: payload.type,
  };
  if (columnMap.attendance) {
    updatePayload[columnMap.attendance] = payload.attendance;
  }

  const { error } = await supabase
    .from('services')
    .update(updatePayload)
    .eq('id', serviceId);

  if (error) {
    throw new Error(error.message || 'Impossible de modifier le programme.');
  }
}

export async function deleteService(serviceId: string): Promise<void> {
  const { error } = await supabase.from('services').delete().eq('id', serviceId);

  if (error) {
    throw error;
  }
}

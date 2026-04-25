import { supabase } from '@/lib/supabaseClient';

export interface ReportUpsertInput {
  branchId: string;
  departmentId?: string;
  title: string;
  type: 'finance' | 'attendance' | 'department' | 'members';
  period: string;
  summary: string;
  generatedAt: string;
}

interface ReportColumnMap {
  title: string;
  branchId: string | null;
  departmentId: string | null;
  type: string | null;
  period: string | null;
  periodStart: string | null;
  periodEnd: string | null;
  summary: string | null;
  generatedAt: string | null;
}

let reportColumnMapPromise: Promise<ReportColumnMap> | null = null;

async function firstSupportedColumn(candidates: string[]): Promise<string> {
  for (const column of candidates) {
    const probe = await supabase.from('reports').select(column).limit(1);
    if (!probe.error) {
      return column;
    }
  }

  throw new Error(`Aucune colonne supportee trouvee parmi: ${candidates.join(', ')}`);
}

async function firstSupportedOptionalColumn(candidates: string[]): Promise<string | null> {
  for (const column of candidates) {
    const probe = await supabase.from('reports').select(column).limit(1);
    if (!probe.error) {
      return column;
    }
  }
  return null;
}

async function getReportColumnMap(): Promise<ReportColumnMap> {
  if (!reportColumnMapPromise) {
    reportColumnMapPromise = Promise.all([
      firstSupportedColumn(['title', 'name']),
      firstSupportedOptionalColumn(['branch_id', 'branchId', 'extension_id']),
      firstSupportedOptionalColumn(['department_id', 'organizer_department_id']),
      firstSupportedOptionalColumn(['type', 'report_type', 'category']),
      firstSupportedOptionalColumn(['period', 'period_label', 'reporting_period']),
      firstSupportedOptionalColumn(['period_start', 'start_period']),
      firstSupportedOptionalColumn(['period_end', 'end_period']),
      firstSupportedOptionalColumn(['summary', 'description', 'notes', 'content']),
      firstSupportedOptionalColumn(['generated_at', 'report_date', 'date', 'created_at']),
    ]).then(([title, branchId, departmentId, type, period, periodStart, periodEnd, summary, generatedAt]) => ({
      title,
      branchId,
      departmentId,
      type,
      period,
      periodStart,
      periodEnd,
      summary,
      generatedAt,
    }));
  }

  return reportColumnMapPromise;
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

function toMonthDateRange(period: string) {
  const trimmed = period.trim();
  const monthMatch = trimmed.match(/^(\d{4})-(\d{2})$/);
  if (!monthMatch) {
    return null;
  }

  const [, yearRaw, monthRaw] = monthMatch;
  const year = Number(yearRaw);
  const month = Number(monthRaw);
  if (!Number.isFinite(year) || !Number.isFinite(month) || month < 1 || month > 12) {
    return null;
  }

  const start = `${yearRaw}-${monthRaw}-01`;
  const endDate = new Date(year, month, 0);
  const end = `${yearRaw}-${monthRaw}-${String(endDate.getDate()).padStart(2, '0')}`;
  return { start, end };
}

function resolvePeriodForDateColumn(period: string, fallbackDay: 'first' | 'last') {
  const normalized = normalizeDateInput(period);
  if (/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
    return normalized;
  }

  const monthRange = toMonthDateRange(period);
  if (monthRange) {
    return fallbackDay === 'first' ? monthRange.start : monthRange.end;
  }

  return normalized;
}

export async function getReports() {
  const columnMap = await getReportColumnMap();
  const orderColumn = columnMap.generatedAt ?? 'id';
  const { data, error } = await supabase
    .from('reports')
    .select('*')
    .order(orderColumn, { ascending: false });

  if (error || !data) {
    throw error ?? new Error('Impossible de charger les rapports.');
  }

  return data;
}

export async function createReport(payload: ReportUpsertInput): Promise<void> {
  const columnMap = await getReportColumnMap();
  const insertPayload: Record<string, unknown> = {
    [columnMap.title]: payload.title,
  };
  if (columnMap.branchId) {
    insertPayload[columnMap.branchId] = payload.branchId;
  }
  if (columnMap.departmentId) {
    insertPayload[columnMap.departmentId] = payload.departmentId || null;
  }
  if (columnMap.type) {
    insertPayload[columnMap.type] = payload.type;
  }
  if (columnMap.period) {
    insertPayload[columnMap.period] = resolvePeriodForDateColumn(payload.period, 'first');
  } else {
    if (columnMap.periodStart) {
      insertPayload[columnMap.periodStart] = resolvePeriodForDateColumn(payload.period, 'first');
    }
    if (columnMap.periodEnd) {
      insertPayload[columnMap.periodEnd] = resolvePeriodForDateColumn(payload.period, 'last');
    }
  }
  if (columnMap.summary) {
    insertPayload[columnMap.summary] = payload.summary;
  }
  if (columnMap.generatedAt) {
    insertPayload[columnMap.generatedAt] = normalizeDateInput(payload.generatedAt);
  }

  const { error } = await supabase.from('reports').insert(insertPayload);

  if (error) {
    throw new Error(error.message || "Impossible d'enregistrer le rapport.");
  }
}

export async function updateReport(reportId: string, payload: ReportUpsertInput): Promise<void> {
  const columnMap = await getReportColumnMap();
  const updatePayload: Record<string, unknown> = {
    [columnMap.title]: payload.title,
  };
  if (columnMap.branchId) {
    updatePayload[columnMap.branchId] = payload.branchId;
  }
  if (columnMap.departmentId) {
    updatePayload[columnMap.departmentId] = payload.departmentId || null;
  }
  if (columnMap.type) {
    updatePayload[columnMap.type] = payload.type;
  }
  if (columnMap.period) {
    updatePayload[columnMap.period] = resolvePeriodForDateColumn(payload.period, 'first');
  } else {
    if (columnMap.periodStart) {
      updatePayload[columnMap.periodStart] = resolvePeriodForDateColumn(payload.period, 'first');
    }
    if (columnMap.periodEnd) {
      updatePayload[columnMap.periodEnd] = resolvePeriodForDateColumn(payload.period, 'last');
    }
  }
  if (columnMap.summary) {
    updatePayload[columnMap.summary] = payload.summary;
  }
  if (columnMap.generatedAt) {
    updatePayload[columnMap.generatedAt] = normalizeDateInput(payload.generatedAt);
  }

  const { error } = await supabase
    .from('reports')
    .update(updatePayload)
    .eq('id', reportId);

  if (error) {
    throw new Error(error.message || 'Impossible de modifier le rapport.');
  }
}

export async function deleteReport(reportId: string): Promise<void> {
  const { error } = await supabase.from('reports').delete().eq('id', reportId);

  if (error) {
    throw error;
  }
}

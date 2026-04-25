import { createReport, deleteReport, getReports, type ReportUpsertInput, updateReport } from '@/services/reports.service';
import { pickString } from '@/services/normalizers';
import type { Report } from '@/types';
import { useCallback, useEffect, useState } from 'react';

export function normalizeReportRow(row: Record<string, unknown>): Report {
  const typeRaw = pickString(row, ['type', 'report_type'], 'department').toLowerCase();
  const type: Report['type'] =
    typeRaw === 'finance' || typeRaw === 'attendance' || typeRaw === 'department' || typeRaw === 'members'
      ? typeRaw
      : 'department';

  const periodStart = pickString(row, ['period_start', 'start_period'], '');
  const periodEnd = pickString(row, ['period_end', 'end_period'], '');
  const fallbackPeriod = periodStart && periodEnd ? `${periodStart} - ${periodEnd}` : periodStart || periodEnd;

  return {
    id: pickString(row, ['id']),
    branchId: pickString(row, ['branch_id', 'branchId', 'extension_id']),
    title: pickString(row, ['title', 'name'], 'Rapport'),
    type,
    period: pickString(row, ['period', 'period_label', 'reporting_period'], fallbackPeriod || 'Periode non definie'),
    summary: pickString(row, ['summary', 'description', 'notes', 'content'], '-'),
    generatedAt: pickString(row, ['generated_at', 'report_date', 'date', 'created_at'], new Date().toISOString()),
  };
}

export function useReportsData() {
  const [reports, setReports] = useState<Report[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isMutating, setIsMutating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const source = 'supabase' as const;

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const rows = await getReports();
      setReports((rows as Record<string, unknown>[]).map(normalizeReportRow));
    } catch (err) {
      setReports([]);
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement des rapports.');
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
    reports,
    isLoading,
    isMutating,
    error,
    source,
    reload: load,
    createReport: (payload: ReportUpsertInput) => runMutation(() => createReport(payload)),
    updateReport: (reportId: string, payload: ReportUpsertInput) => runMutation(() => updateReport(reportId, payload)),
    deleteReport: (reportId: string) => runMutation(() => deleteReport(reportId)),
  };
}

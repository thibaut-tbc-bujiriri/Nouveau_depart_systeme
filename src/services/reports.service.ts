import { supabase } from '@/lib/supabase';

export interface ReportUpsertInput {
  branchId: string;
  title: string;
  type: 'finance' | 'attendance' | 'department' | 'members';
  period: string;
  summary: string;
  generatedAt: string;
}

export async function getReports() {
  const { data, error } = await supabase
    .from('reports')
    .select('*')
    .order('generated_at', { ascending: false });

  if (error || !data) {
    throw error ?? new Error('Impossible de charger les rapports.');
  }

  return data;
}

export async function createReport(payload: ReportUpsertInput): Promise<void> {
  const { error } = await supabase.from('reports').insert({
    branch_id: payload.branchId,
    title: payload.title,
    type: payload.type,
    period: payload.period,
    summary: payload.summary,
    generated_at: payload.generatedAt,
  });

  if (error) {
    throw error;
  }
}

export async function updateReport(reportId: string, payload: ReportUpsertInput): Promise<void> {
  const { error } = await supabase
    .from('reports')
    .update({
      branch_id: payload.branchId,
      title: payload.title,
      type: payload.type,
      period: payload.period,
      summary: payload.summary,
      generated_at: payload.generatedAt,
    })
    .eq('id', reportId);

  if (error) {
    throw error;
  }
}

export async function deleteReport(reportId: string): Promise<void> {
  const { error } = await supabase.from('reports').delete().eq('id', reportId);

  if (error) {
    throw error;
  }
}

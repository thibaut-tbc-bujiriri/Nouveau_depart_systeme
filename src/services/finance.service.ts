import { supabase } from '@/lib/supabaseClient';
import { createNotification } from '@/services/notificationsService';

export interface FinanceUpsertInput {
  branchId: string;
  departmentId?: string;
  type: 'income' | 'expense';
  category: string;
  amount: number;
  description: string;
  recordedAt: string;
}

function mapFinanceRow(row: Record<string, any>) {
  return {
    id: String(row.id),
    branchId: String(row.branch_id ?? row.extension_id ?? ''),
    departmentId: row.department_id ?? null,
    type: (row.record_type ?? row.type ?? 'expense') as 'income' | 'expense',
    category: row.category ?? 'other',
    amount: Number(row.amount ?? 0),
    currency: row.currency ?? 'USD',
    description: row.description ?? 'Non renseigné',
    recordedAt: row.record_date ?? row.recorded_at ?? row.created_at ?? null,
  };
}

export async function getFinanceRecords() {
  const { data, error } = await supabase.from('finance_records').select('*').order('record_date', { ascending: false });
  if (error || !data) throw error ?? new Error('Impossible de charger les finances.');
  return (data as Array<Record<string, any>>).map(mapFinanceRow);
}

export async function createFinanceRecord(payload: FinanceUpsertInput): Promise<void> {
  const { error } = await supabase.from('finance_records').insert({
    branch_id: payload.branchId,
    department_id: payload.departmentId || null,
    record_type: payload.type,
    category: payload.category,
    amount: payload.amount,
    currency: 'USD',
    description: payload.description,
    record_date: payload.recordedAt,
  });

  if (error) throw error;

  try {
    await createNotification({
      title: 'Transaction financière enregistrée',
      message: `Une opération de ${payload.amount}$ (${payload.type === 'income' ? 'recette' : 'dépense'} - ${payload.category}) a été enregistrée : ${payload.description}.`,
      type: 'finance_created',
      priority: 'normal',
      targetRole: 'department_manager',
      targetExtensionId: payload.branchId,
      targetDepartmentId: payload.departmentId || null,
      link: '/finances',
    });
  } catch (err) {
    console.error('Failed to create finance_created notification:', err);
  }
}

export async function updateFinanceRecord(recordId: string, payload: FinanceUpsertInput): Promise<void> {
  const { error } = await supabase.from('finance_records').update({
    branch_id: payload.branchId,
    department_id: payload.departmentId || null,
    record_type: payload.type,
    category: payload.category,
    amount: payload.amount,
    description: payload.description,
    record_date: payload.recordedAt,
  }).eq('id', recordId);

  if (error) throw error;
}

export async function deleteFinanceRecord(recordId: string): Promise<void> {
  const { error } = await supabase.from('finance_records').delete().eq('id', recordId);
  if (error) throw error;
}

import { supabase } from '@/lib/supabaseClient';

export interface FinanceUpsertInput {
  branchId: string;
  departmentId?: string;
  type: 'income' | 'expense';
  category: string;
  amount: number;
  description: string;
  recordedAt: string;
}

export async function getFinanceRecords() {
  const { data, error } = await supabase.from('finance_records').select('*').order('record_date', { ascending: false });
  if (error || !data) {
    throw error ?? new Error('Impossible de charger les finances.');
  }

  return data;
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

  if (error) {
    throw error;
  }
}

export async function updateFinanceRecord(recordId: string, payload: FinanceUpsertInput): Promise<void> {
  const { error } = await supabase
    .from('finance_records')
    .update({
      branch_id: payload.branchId,
      department_id: payload.departmentId || null,
      record_type: payload.type,
      category: payload.category,
      amount: payload.amount,
      description: payload.description,
      record_date: payload.recordedAt,
    })
    .eq('id', recordId);

  if (error) {
    throw error;
  }
}

export async function deleteFinanceRecord(recordId: string): Promise<void> {
  const { error } = await supabase.from('finance_records').delete().eq('id', recordId);

  if (error) {
    throw error;
  }
}

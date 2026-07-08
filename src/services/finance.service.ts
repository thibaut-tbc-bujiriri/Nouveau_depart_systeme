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

  try {
    await createNotification({
      title: "Transaction financière enregistrée",
      message: `Une opération de ${payload.amount}$ (${payload.type === 'income' ? 'recette' : 'dépense'} - ${payload.category}) a été enregistrée : ${payload.description}.`,
      type: "finance_created",
      priority: "normal",
      targetRole: "department_manager",
      targetExtensionId: payload.branchId,
      targetDepartmentId: payload.departmentId || null,
      link: "/finances"
    });
  } catch (err) {
    console.error("Failed to create finance_created notification:", err);
  }

  try {
    const { createActivityLog } = await import('@/services/activityLogService');
    await createActivityLog({
      actionType: 'finance_created',
      module: 'finances',
      title: payload.type === 'income' ? 'Enregistrement d\'une recette' : 'Enregistrement d\'une dépense',
      description: `Une transaction de ${payload.amount}$ (${payload.category}) a été enregistrée : ${payload.description}`,
      status: 'success',
      extensionId: payload.branchId,
      departmentId: payload.departmentId || undefined,
      metadata: { amount: payload.amount, type: payload.type, category: payload.category }
    });
  } catch (err) {
    console.error("Log finance creation error:", err);
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

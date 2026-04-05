import { finances as mockFinances } from '@/data';
import {
  createFinanceRecord,
  deleteFinanceRecord,
  getFinanceRecords,
  type FinanceUpsertInput,
  updateFinanceRecord,
} from '@/services/finance.service';
import { pickNumber, pickString } from '@/services/normalizers';
import type { FinanceRecord } from '@/types';
import { useCallback, useEffect, useState } from 'react';

export function normalizeFinanceRow(row: Record<string, unknown>): FinanceRecord {
  const typeRaw = pickString(row, ['record_type', 'type'], 'income').toLowerCase();
  const type: FinanceRecord['type'] = typeRaw === 'expense' ? 'expense' : 'income';

  const categoryRaw = pickString(row, ['category', 'category_code'], 'other').toLowerCase();
  const categoryMap: Record<string, FinanceRecord['category']> = {
    offering: 'offering',
    offrande: 'offering',
    tithe: 'tithe',
    dime: 'tithe',
    donation: 'donation',
    contribution: 'donation',
    salary: 'salary',
    logistics: 'logistics',
    logistique: 'logistics',
    maintenance: 'maintenance',
    other: 'other',
  };

  return {
    id: pickString(row, ['id']),
    branchId: pickString(row, ['branch_id', 'branchId']),
    departmentId: pickString(row, ['department_id', 'departmentId'], '') || undefined,
    type,
    category: categoryMap[categoryRaw] ?? 'other',
    amount: pickNumber(row, ['amount']),
    currency: 'USD',
    description: pickString(row, ['description'], '-'),
    recordedAt: pickString(row, ['record_date', 'recorded_at', 'created_at'], new Date().toISOString()),
    createdBy: pickString(row, ['created_by', 'createdBy'], 'system'),
  };
}

export function useFinancesData() {
  const [finances, setFinances] = useState<FinanceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isMutating, setIsMutating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [source, setSource] = useState<'supabase' | 'mock'>('supabase');

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const rows = await getFinanceRecords();
      setFinances((rows as Record<string, unknown>[]).map(normalizeFinanceRow));
      setSource('supabase');
    } catch (err) {
      setFinances(mockFinances);
      setSource('mock');
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement des finances.');
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
    finances,
    isLoading,
    isMutating,
    error,
    source,
    reload: load,
    createFinanceRecord: (payload: FinanceUpsertInput) => runMutation(() => createFinanceRecord(payload)),
    updateFinanceRecord: (recordId: string, payload: FinanceUpsertInput) => runMutation(() => updateFinanceRecord(recordId, payload)),
    deleteFinanceRecord: (recordId: string) => runMutation(() => deleteFinanceRecord(recordId)),
  };
}

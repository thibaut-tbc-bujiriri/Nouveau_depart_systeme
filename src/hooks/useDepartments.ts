import { branches as mockBranches, departments as mockDepartments } from '@/data';
import {
  createDepartment,
  deleteDepartment,
  getDepartments,
  type DepartmentResolved,
  type DepartmentUpsertInput,
  updateDepartment,
} from '@/services/departments.service';
import type { Department } from '@/types';
import { useCallback, useEffect, useMemo, useState } from 'react';

export function useDepartments() {
  const [departments, setDepartments] = useState<DepartmentResolved[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isMutating, setIsMutating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [source, setSource] = useState<'supabase' | 'mock'>('supabase');

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const rows = await getDepartments();
      setDepartments(rows);
      setSource('supabase');
    } catch (err) {
      setDepartments(mockDepartments.map((item) => ({ ...item, responsibleName: undefined })));
      setSource('mock');
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement des departements.');
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

  const branchMap = useMemo(() => new Map(mockBranches.map((branch) => [branch.id, branch.name])), []);

  return {
    departments,
    branchMap,
    isLoading,
    isMutating,
    error,
    source,
    reload: load,
    createDepartment: (payload: DepartmentUpsertInput) => runMutation(() => createDepartment(payload)),
    updateDepartment: (departmentId: string, payload: DepartmentUpsertInput) =>
      runMutation(() => updateDepartment(departmentId, payload)),
    deleteDepartment: (departmentId: string) => runMutation(() => deleteDepartment(departmentId)),
  };
}

export function toBaseDepartment(department: DepartmentResolved): Department {
  return {
    id: department.id,
    branchId: department.branchId,
    name: department.name,
    managerId: department.managerId,
    memberCount: department.memberCount,
    monthlyBudget: department.monthlyBudget,
    isActive: department.isActive,
  };
}

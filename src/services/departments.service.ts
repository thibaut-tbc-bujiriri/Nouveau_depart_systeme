import { supabase } from '@/lib/supabase';
import { mapDepartmentRowToDepartment } from '@/services/mappers';
import type { DepartmentRow } from '@/services/types';
import type { Department } from '@/types';

export interface DepartmentResolved extends Department {
  responsibleName?: string;
}

export interface DepartmentUpsertInput {
  branchId: string;
  name: string;
  managerId?: string;
  monthlyBudget: number;
  isActive: boolean;
}

export async function getDepartments(): Promise<DepartmentResolved[]> {
  const { data: rows, error } = await supabase.from('departments').select('*').order('name', { ascending: true });

  if (error || !rows) {
    throw error ?? new Error('Impossible de charger les departements.');
  }

  const { data: memberLinks } = await supabase.from('church_member_departments').select('department_id');

  const memberCountByDepartment = (memberLinks ?? []).reduce<Record<string, number>>((acc, row) => {
    const departmentId = (row as { department_id: string }).department_id;
    acc[departmentId] = (acc[departmentId] ?? 0) + 1;
    return acc;
  }, {});

  const profilesById: Record<string, string> = {};
  const managerIds = (rows as DepartmentRow[])
    .map((row) => row.manager_profile_id ?? row.manager_id)
    .filter((value): value is string => Boolean(value));

  if (managerIds.length > 0) {
    const { data: managers } = await supabase.from('profiles').select('id, full_name').in('id', managerIds);
    (managers ?? []).forEach((item) => {
      const manager = item as { id: string; full_name: string | null };
      profilesById[manager.id] = manager.full_name ?? 'Responsable';
    });
  }

  return (rows as DepartmentRow[]).map((row) => {
    const mapped = mapDepartmentRowToDepartment(row, memberCountByDepartment[row.id] ?? 0);
    const managerId = row.manager_profile_id ?? row.manager_id;
    return {
      ...mapped,
      responsibleName: managerId ? profilesById[managerId] : undefined,
    };
  });
}

export async function getDepartmentById(departmentId: string): Promise<DepartmentResolved | null> {
  const departments = await getDepartments();
  return departments.find((department) => department.id === departmentId) ?? null;
}

export async function createDepartment(payload: DepartmentUpsertInput): Promise<void> {
  const { error } = await supabase.from('departments').insert({
    branch_id: payload.branchId,
    name: payload.name,
    manager_profile_id: payload.managerId || null,
    monthly_budget: payload.monthlyBudget,
    is_active: payload.isActive,
  });

  if (error) {
    throw error;
  }
}

export async function updateDepartment(departmentId: string, payload: DepartmentUpsertInput): Promise<void> {
  const { error } = await supabase
    .from('departments')
    .update({
      branch_id: payload.branchId,
      name: payload.name,
      manager_profile_id: payload.managerId || null,
      monthly_budget: payload.monthlyBudget,
      is_active: payload.isActive,
    })
    .eq('id', departmentId);

  if (error) {
    throw error;
  }
}

export async function deleteDepartment(departmentId: string): Promise<void> {
  const { error } = await supabase.from('departments').delete().eq('id', departmentId);

  if (error) {
    throw error;
  }
}

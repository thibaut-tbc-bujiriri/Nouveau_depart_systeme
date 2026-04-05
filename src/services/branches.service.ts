import { supabase } from '@/lib/supabase';
import { mapBranchRowToBranch } from '@/services/mappers';
import type { BranchRow } from '@/services/types';
import type { Branch } from '@/types';

export interface BranchUpsertInput {
  code: string;
  name: string;
  city: string;
  country: string;
  pastorName: string;
  isActive: boolean;
}

export async function getBranches(): Promise<Branch[]> {
  const { data: branchRows, error } = await supabase
    .from('branches')
    .select('*')
    .order('name', { ascending: true });

  if (error || !branchRows) {
    throw error ?? new Error('Impossible de charger les extensions.');
  }

  const { data: membersRows } = await supabase.from('church_members').select('branch_id');
  const { data: departmentsRows } = await supabase.from('departments').select('branch_id');

  const memberCountByBranch = (membersRows ?? []).reduce<Record<string, number>>((acc, item) => {
    const branchId = (item as { branch_id: string }).branch_id;
    acc[branchId] = (acc[branchId] ?? 0) + 1;
    return acc;
  }, {});

  const departmentCountByBranch = (departmentsRows ?? []).reduce<Record<string, number>>((acc, item) => {
    const branchId = (item as { branch_id: string }).branch_id;
    acc[branchId] = (acc[branchId] ?? 0) + 1;
    return acc;
  }, {});

  return (branchRows as BranchRow[]).map((row) =>
    mapBranchRowToBranch(row, memberCountByBranch[row.id] ?? 0, departmentCountByBranch[row.id] ?? 0),
  );
}

export async function createBranch(payload: BranchUpsertInput): Promise<void> {
  const { error } = await supabase.from('branches').insert({
    code: payload.code,
    name: payload.name,
    city: payload.city,
    country: payload.country,
    pastor_name: payload.pastorName,
    is_active: payload.isActive,
  });

  if (error) {
    throw error;
  }
}

export async function updateBranch(branchId: string, payload: BranchUpsertInput): Promise<void> {
  const { error } = await supabase
    .from('branches')
    .update({
      code: payload.code,
      name: payload.name,
      city: payload.city,
      country: payload.country,
      pastor_name: payload.pastorName,
      is_active: payload.isActive,
    })
    .eq('id', branchId);

  if (error) {
    throw error;
  }
}

export async function deleteBranch(branchId: string): Promise<void> {
  const { error } = await supabase.from('branches').delete().eq('id', branchId);

  if (error) {
    throw error;
  }
}

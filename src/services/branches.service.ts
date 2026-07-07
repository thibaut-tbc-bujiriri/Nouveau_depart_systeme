import { supabase } from '@/lib/supabaseClient';
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
  avatarUrl?: string | null;
  pastorId?: string | null;
}

export interface ActiveUserOption {
  id: string;
  fullName: string;
  role: string;
  email: string;
}

export async function getActiveUsers(): Promise<ActiveUserOption[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, email, role, status')
    .eq('status', 'active')
    .order('full_name', { ascending: true });

  if (error) {
    throw error ?? new Error('Impossible de charger les utilisateurs.');
  }

  return (data || []).map((row) => ({
    id: row.id,
    fullName: row.full_name ?? 'Sans nom',
    role: row.role,
    email: row.email ?? '',
  }));
}

export async function getBranches(): Promise<Branch[]> {
  const { data: branchRows, error } = await supabase
    .from('branches')
    .select('*, profiles:pastor_id(full_name, email, role)')
    .order('name', { ascending: true });

  if (error || !branchRows) {
    throw error ?? new Error('Impossible de charger les extensions.');
  }

  const { data: membersRows } = await supabase.from('church_members').select('branch_id');
  const { data: profileRows } = await supabase.from('profiles').select('branch_id, role');
  const { data: departmentsRows } = await supabase.from('departments').select('branch_id');

  const memberCountByBranch = (membersRows ?? []).reduce<Record<string, number>>((acc, item) => {
    const branchId = (item as { branch_id: string }).branch_id;
    acc[branchId] = (acc[branchId] ?? 0) + 1;
    return acc;
  }, {});

  const profileCountByBranch = (profileRows ?? []).reduce<Record<string, number>>((acc, item) => {
    const profile = item as { branch_id: string | null; role?: string | null };
    if (!profile.branch_id) {
      return acc;
    }
    if ((profile.role ?? '').toLowerCase() === 'superadmin') {
      return acc;
    }
    acc[profile.branch_id] = (acc[profile.branch_id] ?? 0) + 1;
    return acc;
  }, {});

  for (const [branchId, profileCount] of Object.entries(profileCountByBranch)) {
    if (!memberCountByBranch[branchId]) {
      memberCountByBranch[branchId] = profileCount;
    }
  }

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
    avatar_url: payload.avatarUrl || null,
    pastor_id: payload.pastorId || null,
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
      avatar_url: payload.avatarUrl !== undefined ? payload.avatarUrl : null,
      pastor_id: payload.pastorId !== undefined ? payload.pastorId : null,
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

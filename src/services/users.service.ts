import { supabase } from '@/lib/supabase';
import type { DepartmentRow, ProfileRow } from '@/services/types';
import type { Branch, Role } from '@/types';

export interface ManagedUser {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  role: Role;
  branchId: string;
  departmentIds: string[];
  status: string;
}

type MembershipColumn = 'profile_id' | 'user_id';

async function getMembershipColumn(): Promise<MembershipColumn> {
  const profileColumnProbe = await supabase.from('department_members').select('profile_id').limit(1);
  if (!profileColumnProbe.error) {
    return 'profile_id';
  }

  return 'user_id';
}

export async function getManagedUsers() {
  const [profilesResult, branchesResult, departmentsResult, membershipColumn] = await Promise.all([
    supabase.from('profiles').select('*').order('full_name', { ascending: true }),
    supabase.from('branches').select('*').order('name', { ascending: true }),
    supabase.from('departments').select('*').order('name', { ascending: true }),
    getMembershipColumn(),
  ]);

  if (profilesResult.error) {
    throw profilesResult.error;
  }

  if (branchesResult.error) {
    throw branchesResult.error;
  }

  if (departmentsResult.error) {
    throw departmentsResult.error;
  }

  const membershipsResult = await supabase
    .from('department_members')
    .select(`department_id, ${membershipColumn}`);

  if (membershipsResult.error) {
    throw membershipsResult.error;
  }

  const departmentIdsByUser = ((membershipsResult.data ?? []) as Array<Record<string, string>>).reduce<Record<string, string[]>>(
    (acc, relation) => {
      const userId = relation[membershipColumn];
      if (!userId) {
        return acc;
      }

      if (!acc[userId]) {
        acc[userId] = [];
      }

      acc[userId].push(relation.department_id);
      return acc;
    },
    {},
  );

  const users: ManagedUser[] = ((profilesResult.data ?? []) as ProfileRow[]).map((row) => ({
    id: row.id,
    fullName: row.full_name ?? 'Utilisateur',
    email: row.email ?? '',
    phone: row.phone ?? '-',
    role: row.role,
    branchId: row.branch_id ?? '',
    departmentIds: departmentIdsByUser[row.id] ?? [],
    status: row.status ?? 'active',
  }));

  const branches: Branch[] = ((branchesResult.data ?? []) as Array<Record<string, unknown>>).map((row) => ({
    id: String(row.id),
    code: String(row.code ?? 'ECND'),
    name: String(row.name ?? 'Extension'),
    city: String(row.city ?? '-'),
    country: String(row.country ?? 'RDC'),
    pastorName: String(row.pastor_name ?? 'A definir'),
    createdAt: String(row.created_at ?? new Date().toISOString()),
    memberCount: 0,
    departmentCount: 0,
    isActive: Boolean(row.is_active ?? true),
  }));

  const departments = (departmentsResult.data ?? []) as DepartmentRow[];

  return { users, branches, departments, membershipColumn };
}

export async function updateUserAccess(
  userId: string,
  payload: {
    role: Role;
    branchId: string;
    departmentIds: string[];
  },
) {
  const { error: updateProfileError } = await supabase
    .from('profiles')
    .update({
      role: payload.role,
      branch_id: payload.branchId || null,
    })
    .eq('id', userId);

  if (updateProfileError) {
    throw updateProfileError;
  }

  const membershipColumn = await getMembershipColumn();

  const { error: deleteRelationsError } = await supabase
    .from('department_members')
    .delete()
    .eq(membershipColumn, userId);

  if (deleteRelationsError) {
    throw deleteRelationsError;
  }

  if (payload.departmentIds.length === 0) {
    return;
  }

  const relations = payload.departmentIds.map((departmentId) => ({
    department_id: departmentId,
    [membershipColumn]: userId,
    role_in_department: payload.role === 'department_manager' ? 'department_manager' : 'department_member',
  }));

  const { error: insertRelationsError } = await supabase.from('department_members').insert(relations);
  if (insertRelationsError) {
    throw insertRelationsError;
  }
}

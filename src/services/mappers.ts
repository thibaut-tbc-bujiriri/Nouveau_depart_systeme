import type { Branch, ChurchMember, Department, Profile } from '@/types';
import type { BranchRow, ChurchMemberRow, DepartmentRow, ProfileRow } from '@/services/types';

export function mapProfileRowToProfile(row: ProfileRow, departmentIds: string[]): Profile {
  const metadataTitle =
    row.metadata && typeof row.metadata === 'object' && !Array.isArray(row.metadata)
      ? row.metadata.title
      : undefined;

  return {
    id: row.id,
    fullName: row.full_name ?? 'Utilisateur ECND',
    email: row.email ?? '',
    phone: row.phone ?? '-',
    role: row.role,
    branchId: row.branch_id ?? '',
    departmentIds,
    avatarUrl: row.avatar_url ?? undefined,
    title: row.title ?? (typeof metadataTitle === 'string' ? metadataTitle : undefined),
  };
}

export function mapBranchRowToBranch(row: BranchRow, memberCount = 0, departmentCount = 0): Branch {
  return {
    id: row.id,
    code: row.code ?? 'ECND',
    name: row.name,
    city: row.city ?? '-',
    country: row.country ?? 'RDC',
    pastorName: row.pastor_name ?? 'A definir',
    createdAt: row.created_at,
    memberCount,
    departmentCount,
    isActive: row.is_active ?? true,
  };
}

export function mapDepartmentRowToDepartment(row: DepartmentRow, memberCount = 0): Department {
  return {
    id: row.id,
    branchId: row.branch_id,
    name: row.name as Department['name'],
    managerId: (row.manager_profile_id ?? row.manager_id ?? '') as string,
    memberCount,
    monthlyBudget: Number(row.monthly_budget ?? 0),
    isActive: row.is_active ?? true,
  };
}

export function mapChurchMemberRowToMember(row: ChurchMemberRow, departmentIds: string[]): ChurchMember {
  return {
    id: row.id,
    branchId: row.branch_id,
    firstName: row.first_name ?? '',
    lastName: row.last_name ?? '',
    gender: row.gender === 'female' ? 'female' : 'male',
    phone: row.phone ?? '-',
    email: row.email ?? undefined,
    departmentIds,
    joinedAt: row.joined_at ?? new Date().toISOString(),
    status: row.status === 'inactive' ? 'inactive' : 'active',
  };
}


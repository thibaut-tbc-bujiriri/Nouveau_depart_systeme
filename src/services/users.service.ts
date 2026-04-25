import { supabase } from '@/lib/supabaseClient';
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

async function hasRoleInDepartmentColumn(): Promise<boolean> {
  const probe = await supabase.from('department_members').select('role_in_department').limit(1);
  return !probe.error;
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
  if (payload.role === 'superadmin') {
    if (!payload.branchId) {
      throw new Error('Le super admin doit avoir une extension de residence.');
    }
  }

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
  const includeRoleInDepartment = await hasRoleInDepartmentColumn();

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

  const relations = payload.departmentIds.map((departmentId) => {
    const baseRelation: Record<string, string> = {
      department_id: departmentId,
      [membershipColumn]: userId,
    };

    if (includeRoleInDepartment) {
      baseRelation.role_in_department = payload.role === 'department_manager' ? 'department_manager' : 'department_member';
    }

    return baseRelation;
  });

  const { error: insertRelationsError } = await supabase.from('department_members').insert(relations);
  if (insertRelationsError) {
    throw insertRelationsError;
  }
}

export async function deleteManagedUser(userId: string) {
  const membershipColumn = await getMembershipColumn();

  const { error: deleteRelationsError } = await supabase
    .from('department_members')
    .delete()
    .eq(membershipColumn, userId);

  if (deleteRelationsError) {
    throw deleteRelationsError;
  }

  const { error: deleteProfileError } = await supabase.from('profiles').delete().eq('id', userId);
  if (deleteProfileError) {
    throw deleteProfileError;
  }
}

export async function updateManagedUserPassword(payload: { userId: string; password: string }) {
  const { data, error } = await supabase.functions.invoke<{ success?: boolean; error?: string }>('admin-set-user-password', {
    body: {
      userId: payload.userId,
      password: payload.password,
    },
  });

  if (error) {
    const context = (error as { context?: Response }).context;
    if (context) {
      try {
        const rawBody = await context.clone().text();
        try {
          const body = JSON.parse(rawBody) as { error?: string; message?: string };
          throw new Error(body.error || body.message || error.message);
        } catch {
          throw new Error(rawBody || `${error.message} (HTTP ${context.status})`);
        }
      } catch {
        throw new Error(`${error.message} (HTTP ${context.status})`);
      }
    }

    throw error;
  }

  if (!data?.success) {
    throw new Error(data?.error || 'La fonction admin-set-user-password a repondu sans confirmer la mise a jour.');
  }
}

export async function createManagedUser(payload: {
  fullName: string;
  email: string;
  password: string;
  role: Role;
  branchId: string;
  departmentIds: string[];
}) {
  const normalizedEmail = payload.email.trim().toLowerCase();

  const { data: existingProfile, error: existingProfileError } = await supabase
    .from('profiles')
    .select('id')
    .eq('email', normalizedEmail)
    .maybeSingle();

  if (existingProfileError) {
    throw existingProfileError;
  }

  if (existingProfile?.id) {
    throw new Error('Cet email est deja utilise par un utilisateur.');
  }

  const { data: existingSessionData } = await supabase.auth.getSession();
  const previousSession = existingSessionData.session;

  const { data: authData, error: signUpError } = await supabase.auth.signUp({
    email: normalizedEmail,
    password: payload.password,
    options: {
      data: {
        full_name: payload.fullName,
      },
    },
  });

  if (signUpError) {
    throw signUpError;
  }

  const authUser = authData.user;
  const userId = authUser?.id;
  if (!userId) {
    throw new Error("Impossible de creer l'utilisateur dans Auth.");
  }

  if (authUser.identities && authUser.identities.length === 0) {
    throw new Error('Cet email existe deja dans Auth. Utilisez un autre email.');
  }

  const { error: profileError } = await supabase.from('profiles').upsert(
    {
      id: userId,
      full_name: payload.fullName,
      email: normalizedEmail,
      role: payload.role,
      branch_id: payload.branchId || null,
      status: 'active',
    },
    { onConflict: 'id' },
  );

  if (profileError) {
    throw profileError;
  }

  await updateUserAccess(userId, {
    role: payload.role,
    branchId: payload.branchId,
    departmentIds: payload.departmentIds,
  });

  if (!previousSession) {
    return;
  }

  const { data: activeSessionData } = await supabase.auth.getSession();
  const activeSessionUserId = activeSessionData.session?.user?.id;
  const previousSessionUserId = previousSession.user.id;

  if (activeSessionUserId && activeSessionUserId !== previousSessionUserId) {
    await supabase.auth.setSession({
      access_token: previousSession.access_token,
      refresh_token: previousSession.refresh_token,
    });
  }
}

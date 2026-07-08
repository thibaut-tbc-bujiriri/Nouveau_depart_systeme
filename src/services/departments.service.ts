import { supabase } from '@/lib/supabaseClient';
import { mapDepartmentRowToDepartment } from '@/services/mappers';
import type { DepartmentRow } from '@/services/types';
import type { Department } from '@/types';
import { createNotification } from '@/services/notificationsService';

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

  try {
    await createNotification({
      title: "Nouveau département créé",
      message: `Le département "${payload.name}" a été créé.`,
      type: "department_created",
      priority: "normal",
      targetExtensionId: payload.branchId,
      link: "/departments"
    });

    if (payload.managerId) {
      const { data: profile } = await supabase.from('profiles').select('full_name').eq('id', payload.managerId).maybeSingle();
      
      await createNotification({
        title: "Responsable département affecté",
        message: `${profile?.full_name || 'Un utilisateur'} est maintenant responsable du département ${payload.name}.`,
        type: "department_responsible_assigned",
        priority: "normal",
        targetExtensionId: payload.branchId,
        link: "/departments"
      });

      await createNotification({
        title: "Affectation de responsabilité",
        message: `Vous avez été désigné(e) comme responsable du département ${payload.name}.`,
        type: "department_responsible_assigned",
        priority: "normal",
        targetUserId: payload.managerId,
        link: "/departments"
      });
    }
  } catch (err) {
    console.error("Failed to create department notifications:", err);
  }

  try {
    const { createActivityLog } = await import('@/services/activityLogService');
    await createActivityLog({
      actionType: 'department_created',
      module: 'departments',
      title: 'Création d\'un département',
      description: `Le département "${payload.name}" a été créé.`,
      status: 'success',
      targetName: payload.name,
      extensionId: payload.branchId
    });

    if (payload.managerId) {
      await createActivityLog({
        actionType: 'department_responsible_assigned',
        module: 'departments',
        title: 'Responsable de département affecté',
        description: `Un responsable a été affecté au département "${payload.name}".`,
        status: 'success',
        extensionId: payload.branchId
      });
    }
  } catch (err) {
    console.error("Log department creation error:", err);
  }
}

export async function updateDepartment(departmentId: string, payload: DepartmentUpsertInput): Promise<void> {
  const { data: oldDept } = await supabase
    .from('departments')
    .select('manager_profile_id')
    .eq('id', departmentId)
    .maybeSingle();
  const oldManagerId = oldDept?.manager_profile_id;

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

  try {
    await createNotification({
      title: "Département mis à jour",
      message: `Le département "${payload.name}" a été mis à jour.`,
      type: "department_updated",
      priority: "normal",
      targetExtensionId: payload.branchId,
      link: "/departments"
    });

    if (payload.managerId && payload.managerId !== oldManagerId) {
      const { data: profile } = await supabase.from('profiles').select('full_name').eq('id', payload.managerId).maybeSingle();
      
      await createNotification({
        title: "Responsable département affecté",
        message: `${profile?.full_name || 'Un utilisateur'} est maintenant responsable du département ${payload.name}.`,
        type: "department_responsible_assigned",
        priority: "normal",
        targetExtensionId: payload.branchId,
        link: "/departments"
      });

      await createNotification({
        title: "Affectation de responsabilité",
        message: `Vous avez été désigné(e) comme responsable du département ${payload.name}.`,
        type: "department_responsible_assigned",
        priority: "normal",
        targetUserId: payload.managerId,
        link: "/departments"
      });
    }
  } catch (err) {
    console.error("Failed to create department update notifications:", err);
  }

  try {
    const { createActivityLog } = await import('@/services/activityLogService');
    await createActivityLog({
      actionType: 'department_updated',
      module: 'departments',
      title: 'Mise à jour d\'un département',
      description: `Le département "${payload.name}" a été modifié.`,
      status: 'success',
      targetId: departmentId,
      targetName: payload.name,
      extensionId: payload.branchId,
      departmentId: departmentId
    });

    if (payload.managerId && payload.managerId !== oldManagerId) {
      await createActivityLog({
        actionType: 'department_responsible_assigned',
        module: 'departments',
        title: 'Responsable de département affecté',
        description: `Le responsable du département "${payload.name}" a été modifié ou désigné.`,
        status: 'success',
        extensionId: payload.branchId,
        departmentId: departmentId
      });
    }
  } catch (err) {
    console.error("Log department update error:", err);
  }
}

export async function deleteDepartment(departmentId: string): Promise<void> {
  const { error } = await supabase.from('departments').delete().eq('id', departmentId);

  if (error) {
    throw error;
  }
}

export async function renameDepartmentName(oldName: string, newName: string): Promise<void> {
  const { error } = await supabase
    .from('departments')
    .update({ name: newName })
    .eq('name', oldName);

  if (error) {
    throw error;
  }
}

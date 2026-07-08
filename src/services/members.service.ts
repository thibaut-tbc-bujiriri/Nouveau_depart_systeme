import { supabase } from '@/lib/supabaseClient';
import { mapChurchMemberRowToMember } from '@/services/mappers';
import type { ChurchMemberDepartmentRow, ChurchMemberRow } from '@/services/types';
import type { ChurchMember } from '@/types';
import { createNotification } from '@/services/notificationsService';

function normalizePhone(phone: string): string {
  // Keep only digits to stay compatible with numeric/text schemas.
  return phone.replace(/\D/g, '');
}

function toSupabaseMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  if (typeof error === 'object' && error !== null) {
    const candidate = error as { message?: unknown; details?: unknown; hint?: unknown };
    const message = typeof candidate.message === 'string' ? candidate.message : '';
    const details = typeof candidate.details === 'string' ? candidate.details : '';
    const hint = typeof candidate.hint === 'string' ? candidate.hint : '';
    const full = [message, details, hint].filter(Boolean).join(' - ');
    if (full) {
      return full;
    }
  }

  return fallback;
}

export interface MemberUpsertInput {
  branchId: string;
  firstName: string;
  lastName: string;
  gender: ChurchMember['gender'];
  phone: string;
  email?: string;
  joinedAt: string;
  status: ChurchMember['status'];
  departmentIds: string[];
  avatarUrl?: string | null;
}

type MembersWriteAction = 'create' | 'update' | 'delete';

export async function getMembers(): Promise<ChurchMember[]> {
  const { data: rows, error } = await supabase.from('church_members').select('*').order('created_at', { ascending: false });

  if (error || !rows) {
    throw error ?? new Error('Impossible de charger les membres.');
  }

  const { data: links } = await supabase.from('church_member_departments').select('church_member_id, department_id');

  const departmentsByMember = ((links as ChurchMemberDepartmentRow[] | null) ?? []).reduce<Record<string, string[]>>((acc, link) => {
    if (!acc[link.church_member_id]) {
      acc[link.church_member_id] = [];
    }

    acc[link.church_member_id].push(link.department_id);
    return acc;
  }, {});

  return (rows as ChurchMemberRow[]).map((row) => mapChurchMemberRowToMember(row, departmentsByMember[row.id] ?? []));
}

export async function createMember(payload: MemberUpsertInput): Promise<void> {
  const result = await invokeMembersWrite('create', { payload: { ...payload, phone: normalizePhone(payload.phone) } });

  // Client-side fallback to save avatarUrl if the Edge Function doesn't support/write it
  if (result?.id && payload.avatarUrl) {
    const { error: avatarError } = await supabase
      .from('church_members')
      .update({ avatar_url: payload.avatarUrl })
      .eq('id', result.id);
    if (avatarError) {
      console.warn("Client-side avatar insert failed (likely RLS restrictions):", avatarError.message);
    }
  }

  try {
    let deptName = '';
    if (payload.departmentIds && payload.departmentIds.length > 0) {
      const { data: dept } = await supabase
        .from('departments')
        .select('name')
        .eq('id', payload.departmentIds[0])
        .maybeSingle();
      if (dept) {
        deptName = dept.name;
      }
    }

    try {
      await createNotification({
        title: "Nouveau membre enregistré",
        message: deptName 
          ? `${payload.firstName} ${payload.lastName} a été ajouté(e) au département ${deptName}.`
          : `${payload.firstName} ${payload.lastName} a été ajouté(e) comme membre.`,
        type: "member_created",
        priority: "normal",
        targetExtensionId: payload.branchId,
        targetDepartmentId: payload.departmentIds?.[0] || null,
        link: "/members"
      });
    } catch (err) {
      console.error("Failed to create member_created notification:", err);
    }

    try {
      const { createActivityLog } = await import('@/services/activityLogService');
      await createActivityLog({
        actionType: 'member_created',
        module: 'members',
        title: 'Ajout d\'un membre',
        description: `Le membre ${payload.firstName} ${payload.lastName} a été enregistré dans le système.`,
        status: 'success',
        targetName: `${payload.firstName} ${payload.lastName}`,
        extensionId: payload.branchId,
        departmentId: payload.departmentIds?.[0]
      });
    } catch (err) {
      console.error("Log member creation error:", err);
    }
  } catch (err) {
    console.error("Failed inside createMember:", err);
  }
}

export async function updateMember(memberId: string, payload: MemberUpsertInput): Promise<void> {
  await invokeMembersWrite('update', {
    memberId,
    payload: { ...payload, phone: normalizePhone(payload.phone) },
  });

  // Client-side fallback to save avatarUrl if the Edge Function doesn't support/write it
  if (payload.avatarUrl !== undefined) {
    const { error: avatarError } = await supabase
      .from('church_members')
      .update({ avatar_url: payload.avatarUrl })
      .eq('id', memberId);
    if (avatarError) {
      console.warn("Client-side avatar update failed (likely RLS restrictions):", avatarError.message);
    }
  }

  try {
    const { createActivityLog } = await import('@/services/activityLogService');
    await createActivityLog({
      actionType: 'member_updated',
      module: 'members',
      title: 'Mise à jour d\'un membre',
      description: `Les informations du membre ${payload.firstName} ${payload.lastName} ont été modifiées.`,
      status: 'success',
      targetId: memberId,
      targetName: `${payload.firstName} ${payload.lastName}`,
      extensionId: payload.branchId,
      departmentId: payload.departmentIds?.[0]
    });
  } catch (err) {
    console.error("Log member update error:", err);
  }
}

export async function deleteMember(memberId: string): Promise<void> {
  await invokeMembersWrite('delete', { memberId });
}

async function invokeMembersWrite(
  action: MembersWriteAction,
  body: { memberId?: string; payload?: MemberUpsertInput },
): Promise<{ success?: boolean; error?: string; id?: string }> {
  const { data, error } = await supabase.functions.invoke<{ success?: boolean; error?: string; id?: string }>('members-write', {
    body: {
      action,
      ...body,
    },
  });

  if (error) {
    const context = (error as { context?: Response }).context;
    if (context) {
      const raw = await context.clone().text().catch(() => '');
      try {
        const parsed = JSON.parse(raw) as { error?: string; message?: string };
        throw new Error(parsed.error || parsed.message || `${error.message} (HTTP ${context.status})`);
      } catch {
        throw new Error(raw || `${error.message} (HTTP ${context.status})`);
      }
    }

    throw new Error(toSupabaseMessage(error, 'Operation membres impossible.'));
  }

  if (!data?.success) {
    throw new Error(data?.error || 'Operation membres non confirmee par le serveur.');
  }

  return data || {};
}

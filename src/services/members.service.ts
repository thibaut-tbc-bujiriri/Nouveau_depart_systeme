import { supabase } from '@/lib/supabaseClient';
import { mapChurchMemberRowToMember } from '@/services/mappers';
import type { ChurchMemberDepartmentRow, ChurchMemberRow } from '@/services/types';
import type { ChurchMember } from '@/types';

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
  await invokeMembersWrite('create', { payload: { ...payload, phone: normalizePhone(payload.phone) } });
}

export async function updateMember(memberId: string, payload: MemberUpsertInput): Promise<void> {
  await invokeMembersWrite('update', {
    memberId,
    payload: { ...payload, phone: normalizePhone(payload.phone) },
  });
}

export async function deleteMember(memberId: string): Promise<void> {
  await invokeMembersWrite('delete', { memberId });
}

async function invokeMembersWrite(
  action: MembersWriteAction,
  body: { memberId?: string; payload?: MemberUpsertInput },
): Promise<void> {
  const { data, error } = await supabase.functions.invoke<{ success?: boolean; error?: string }>('members-write', {
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
}

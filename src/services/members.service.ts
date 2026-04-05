import { supabase } from '@/lib/supabase';
import { mapChurchMemberRowToMember } from '@/services/mappers';
import type { ChurchMemberDepartmentRow, ChurchMemberRow } from '@/services/types';
import type { ChurchMember } from '@/types';

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
  const { data, error } = await supabase
    .from('church_members')
    .insert({
      branch_id: payload.branchId,
      first_name: payload.firstName,
      last_name: payload.lastName,
      gender: payload.gender,
      phone: payload.phone,
      email: payload.email || null,
      joined_at: payload.joinedAt,
      status: payload.status,
    })
    .select('id')
    .single();

  if (error || !data) {
    throw error ?? new Error('Impossible de creer le membre.');
  }

  if (payload.departmentIds.length > 0) {
    const linkRows = payload.departmentIds.map((departmentId) => ({
      church_member_id: data.id,
      department_id: departmentId,
    }));

    const { error: linkError } = await supabase.from('church_member_departments').insert(linkRows);
    if (linkError) {
      throw linkError;
    }
  }
}

export async function updateMember(memberId: string, payload: MemberUpsertInput): Promise<void> {
  const { error } = await supabase
    .from('church_members')
    .update({
      branch_id: payload.branchId,
      first_name: payload.firstName,
      last_name: payload.lastName,
      gender: payload.gender,
      phone: payload.phone,
      email: payload.email || null,
      joined_at: payload.joinedAt,
      status: payload.status,
    })
    .eq('id', memberId);

  if (error) {
    throw error;
  }

  const { error: deleteLinkError } = await supabase
    .from('church_member_departments')
    .delete()
    .eq('church_member_id', memberId);

  if (deleteLinkError) {
    throw deleteLinkError;
  }

  if (payload.departmentIds.length > 0) {
    const linkRows = payload.departmentIds.map((departmentId) => ({
      church_member_id: memberId,
      department_id: departmentId,
    }));

    const { error: insertLinkError } = await supabase.from('church_member_departments').insert(linkRows);

    if (insertLinkError) {
      throw insertLinkError;
    }
  }
}

export async function deleteMember(memberId: string): Promise<void> {
  const { error } = await supabase.from('church_members').delete().eq('id', memberId);

  if (error) {
    throw error;
  }
}

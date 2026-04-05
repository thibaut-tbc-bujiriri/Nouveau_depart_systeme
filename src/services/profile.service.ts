import { supabase } from '@/lib/supabase';
import { mapProfileRowToProfile } from '@/services/mappers';
import type { DepartmentMemberRow, ProfileRow } from '@/services/types';
import type { Profile } from '@/types';

async function getDepartmentIdsForProfile(profileId: string): Promise<string[]> {
  const { data: departmentMembersByProfile, error: profileColumnError } = await supabase
    .from('department_members')
    .select('department_id')
    .eq('profile_id', profileId);

  if (!profileColumnError) {
    return (departmentMembersByProfile as Array<{ department_id: string }> | null)?.map((item) => item.department_id) ?? [];
  }

  const { data: departmentMembersByUser } = await supabase
    .from('department_members')
    .select('department_id')
    .eq('user_id', profileId);

  return (departmentMembersByUser as Array<{ department_id: string }> | null)?.map((item) => item.department_id) ?? [];
}

export async function getProfileById(profileId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', profileId)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  const departmentIds = await getDepartmentIdsForProfile(profileId);
  return mapProfileRowToProfile(data as ProfileRow, departmentIds);
}

export async function getCurrentProfile(userId: string): Promise<Profile | null> {
  return getProfileById(userId);
}

export async function getDepartmentMemberships(profileId: string): Promise<DepartmentMemberRow[]> {
  const { data: byProfile, error: byProfileError } = await supabase
    .from('department_members')
    .select('*')
    .eq('profile_id', profileId);

  if (!byProfileError) {
    return (byProfile as DepartmentMemberRow[] | null) ?? [];
  }

  const { data: byUser } = await supabase
    .from('department_members')
    .select('*')
    .eq('user_id', profileId);

  return (byUser as DepartmentMemberRow[] | null) ?? [];
}

export async function updateCurrentProfile(profileId: string, payload: { fullName?: string; phone?: string }) {
  const { data, error } = await supabase
    .from('profiles')
    .update({
      full_name: payload.fullName,
      phone: payload.phone,
    })
    .eq('id', profileId)
    .select('*')
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    return null;
  }

  const departmentIds = await getDepartmentIdsForProfile(profileId);
  return mapProfileRowToProfile(data as ProfileRow, departmentIds);
}


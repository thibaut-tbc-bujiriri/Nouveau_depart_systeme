import { supabase } from '@/lib/supabaseClient';
import { mapProfileRowToProfile } from '@/services/mappers';
import type { DepartmentMemberRow, ProfileRow } from '@/services/types';
import type { Profile } from '@/types';

interface ProfileColumnMap {
  fullName: string;
  phone: string;
  title: string | null;
  avatarUrl: string | null;
  metadata: string | null;
}

let profileColumnMapPromise: Promise<ProfileColumnMap> | null = null;

async function firstSupportedColumn(candidates: string[]): Promise<string> {
  for (const column of candidates) {
    const probe = await supabase.from('profiles').select(column).limit(1);
    if (!probe.error) {
      return column;
    }
  }

  throw new Error(`Aucune colonne supportee trouvee parmi: ${candidates.join(', ')}`);
}

async function firstSupportedOptionalColumn(candidates: string[]): Promise<string | null> {
  for (const column of candidates) {
    const probe = await supabase.from('profiles').select(column).limit(1);
    if (!probe.error) {
      return column;
    }
  }

  return null;
}

async function getProfileColumnMap(): Promise<ProfileColumnMap> {
  if (!profileColumnMapPromise) {
    profileColumnMapPromise = Promise.all([
      firstSupportedColumn(['full_name', 'fullName']),
      firstSupportedColumn(['phone', 'phone_number', 'phoneNumber']),
      firstSupportedOptionalColumn(['title', 'job_title']),
      firstSupportedOptionalColumn(['avatar_url', 'avatarUrl']),
      firstSupportedOptionalColumn(['metadata']),
    ]).then(([fullName, phone, title, avatarUrl, metadata]) => ({
      fullName,
      phone,
      title,
      avatarUrl,
      metadata,
    }));
  }

  return profileColumnMapPromise;
}

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

  if (error) {
    throw error;
  }

  if (!data) {
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

export async function updateCurrentProfile(
  profileId: string,
  payload: { fullName?: string; phone?: string; title?: string; avatarUrl?: string | null },
) {
  const columnMap = await getProfileColumnMap();
  const updatePayload: Record<string, unknown> = {
    [columnMap.fullName]: payload.fullName,
    [columnMap.phone]: payload.phone,
  };

  if (columnMap.title && payload.title !== undefined) {
    updatePayload[columnMap.title] = payload.title;
  } else if (columnMap.metadata && payload.title !== undefined) {
    const { data: metadataRow } = await supabase
      .from('profiles')
      .select(columnMap.metadata)
      .eq('id', profileId)
      .maybeSingle();

    const currentMetadata =
      metadataRow &&
      typeof metadataRow === 'object' &&
      !Array.isArray(metadataRow) &&
      typeof (metadataRow as Record<string, unknown>)[columnMap.metadata] === 'object' &&
      (metadataRow as Record<string, unknown>)[columnMap.metadata] !== null &&
      !Array.isArray((metadataRow as Record<string, unknown>)[columnMap.metadata])
        ? ((metadataRow as Record<string, unknown>)[columnMap.metadata] as Record<string, unknown>)
        : {};

    updatePayload[columnMap.metadata] = {
      ...currentMetadata,
      title: payload.title || null,
    };
  }
  if (columnMap.avatarUrl && payload.avatarUrl !== undefined) {
    updatePayload[columnMap.avatarUrl] = payload.avatarUrl;
  }

  const { data, error } = await supabase
    .from('profiles')
    .update(updatePayload)
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

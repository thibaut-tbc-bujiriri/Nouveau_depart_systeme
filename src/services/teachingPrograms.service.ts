import { supabase } from '@/lib/supabaseClient';
import type { Branch } from '@/types';

export type TeachingProgramStatus = 'draft' | 'published' | 'archived';

export interface AnnualTheme {
  id: string;
  year: number;
  title: string;
  description: string;
  isActive: boolean;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TeachingProgramSession {
  id: string;
  programId: string;
  sessionDate: string;
  activityType: string;
  speakerUserId: string | null;
  speakerName: string;
  officiantUserId: string | null;
  officiantName: string;
  startTime: string | null;
  endTime: string | null;
  durationMinutes: number | null;
  notes: string | null;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface TeachingProgram {
  id: string;
  extensionId: string;
  annualThemeId: string;
  month: number;
  year: number;
  subtheme: string;
  officeName: string;
  signatoryUserId: string | null;
  signatoryName: string;
  signatoryTitle: string;
  status: TeachingProgramStatus;
  publishedAt: string | null;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
  annualTheme?: AnnualTheme | null;
  branch?: Pick<Branch, 'id' | 'name' | 'code' | 'city' | 'country'> | null;
  sessions: TeachingProgramSession[];
}

export interface AnnualThemeInput {
  year: number;
  title: string;
  description?: string;
  isActive: boolean;
}

export interface TeachingProgramInput {
  extensionId: string;
  annualThemeId: string;
  month: number;
  year: number;
  subtheme: string;
  officeName: string;
  signatoryUserId?: string | null;
  signatoryName: string;
  signatoryTitle: string;
  status: TeachingProgramStatus;
}

export interface TeachingProgramSessionInput {
  programId: string;
  sessionDate: string;
  activityType: string;
  speakerUserId?: string | null;
  speakerName: string;
  officiantUserId?: string | null;
  officiantName: string;
  startTime?: string | null;
  endTime?: string | null;
  durationMinutes?: number | null;
  notes?: string | null;
  sortOrder: number;
}

export interface PersonOption {
  id: string;
  label: string;
  source: 'profile' | 'member';
  avatarUrl?: string | null;
}

const programSelect = `
  *,
  annualTheme:annual_theme_id(id, year, title, description, is_active, created_by, created_at, updated_at),
  branch:extension_id(id, code, name, city, country),
  sessions:teaching_program_sessions(*)
`;

function mapTheme(row: any): AnnualTheme {
  return {
    id: row.id,
    year: Number(row.year),
    title: row.title ?? '',
    description: row.description ?? '',
    isActive: Boolean(row.is_active),
    createdBy: row.created_by ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapSession(row: any): TeachingProgramSession {
  return {
    id: row.id,
    programId: row.program_id,
    sessionDate: row.session_date,
    activityType: row.activity_type ?? '',
    speakerUserId: row.speaker_user_id ?? null,
    speakerName: row.speaker_name ?? '',
    officiantUserId: row.officiant_user_id ?? null,
    officiantName: row.officiant_name ?? '',
    startTime: row.start_time ?? null,
    endTime: row.end_time ?? null,
    durationMinutes: row.duration_minutes ?? null,
    notes: row.notes ?? null,
    sortOrder: Number(row.sort_order ?? 0),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapProgram(row: any): TeachingProgram {
  const sessions = ((row.sessions ?? []) as any[])
    .map(mapSession)
    .sort((a, b) => `${a.sessionDate}-${a.sortOrder}`.localeCompare(`${b.sessionDate}-${b.sortOrder}`));

  return {
    id: row.id,
    extensionId: row.extension_id,
    annualThemeId: row.annual_theme_id,
    month: Number(row.month),
    year: Number(row.year),
    subtheme: row.subtheme ?? '',
    officeName: row.office_name ?? 'Bureau des Enseignements',
    signatoryUserId: row.signatory_user_id ?? null,
    signatoryName: row.signatory_name ?? '',
    signatoryTitle: row.signatory_title ?? '',
    status: (row.status ?? 'draft') as TeachingProgramStatus,
    publishedAt: row.published_at ?? null,
    createdBy: row.created_by ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    annualTheme: row.annualTheme ? mapTheme(row.annualTheme) : null,
    branch: row.branch
      ? {
          id: row.branch.id,
          code: row.branch.code ?? 'ECND',
          name: row.branch.name ?? 'Extension',
          city: row.branch.city ?? '',
          country: row.branch.country ?? '',
        }
      : null,
    sessions,
  };
}

function toProgramPayload(payload: TeachingProgramInput, currentUserId?: string) {
  return {
    extension_id: payload.extensionId,
    annual_theme_id: payload.annualThemeId,
    month: payload.month,
    year: payload.year,
    subtheme: payload.subtheme.trim(),
    office_name: payload.officeName.trim() || 'Bureau des Enseignements',
    signatory_user_id: payload.signatoryUserId || null,
    signatory_name: payload.signatoryName.trim(),
    signatory_title: payload.signatoryTitle.trim(),
    status: payload.status,
    ...(currentUserId ? { created_by: currentUserId } : {}),
  };
}

function toSessionPayload(payload: TeachingProgramSessionInput) {
  return {
    program_id: payload.programId,
    session_date: payload.sessionDate,
    activity_type: payload.activityType.trim(),
    speaker_user_id: payload.speakerUserId || null,
    speaker_name: payload.speakerName.trim(),
    officiant_user_id: payload.officiantUserId || null,
    officiant_name: payload.officiantName.trim(),
    start_time: payload.startTime || null,
    end_time: payload.endTime || null,
    duration_minutes: payload.durationMinutes || null,
    notes: payload.notes?.trim() || null,
    sort_order: payload.sortOrder,
  };
}

export async function getAnnualThemes(): Promise<AnnualTheme[]> {
  const { data, error } = await supabase
    .from('annual_themes')
    .select('*')
    .order('year', { ascending: false })
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message || 'Impossible de charger les thèmes annuels.');
  return (data ?? []).map(mapTheme);
}

export async function getActiveAnnualTheme(year: number): Promise<AnnualTheme | null> {
  const { data, error } = await supabase
    .from('annual_themes')
    .select('*')
    .eq('year', year)
    .eq('is_active', true)
    .maybeSingle();

  if (error) throw new Error(error.message || 'Impossible de charger le thème annuel actif.');
  return data ? mapTheme(data) : null;
}

export async function createAnnualTheme(payload: AnnualThemeInput, currentUserId: string): Promise<void> {
  const { error } = await supabase.from('annual_themes').insert({
    year: payload.year,
    title: payload.title.trim(),
    description: payload.description?.trim() || null,
    is_active: payload.isActive,
    created_by: currentUserId,
  });

  if (error) throw new Error(error.message || 'Impossible de créer le thème annuel.');
}

export async function updateAnnualTheme(themeId: string, payload: AnnualThemeInput): Promise<void> {
  const { error } = await supabase
    .from('annual_themes')
    .update({
      year: payload.year,
      title: payload.title.trim(),
      description: payload.description?.trim() || null,
      is_active: payload.isActive,
    })
    .eq('id', themeId);

  if (error) throw new Error(error.message || 'Impossible de modifier le thème annuel.');
}

export async function setAnnualThemeActive(themeId: string, isActive: boolean): Promise<void> {
  const { error } = await supabase.from('annual_themes').update({ is_active: isActive }).eq('id', themeId);
  if (error) throw new Error(error.message || 'Impossible de changer le statut du thème.');
}

export async function getTeachingPrograms(): Promise<TeachingProgram[]> {
  const { data, error } = await supabase
    .from('teaching_programs')
    .select(programSelect)
    .order('year', { ascending: false })
    .order('month', { ascending: false });

  if (error) throw new Error(error.message || 'Impossible de charger les programmes des enseignements.');
  return (data ?? []).map(mapProgram);
}

export async function getTeachingProgram(programId: string): Promise<TeachingProgram | null> {
  const { data, error } = await supabase
    .from('teaching_programs')
    .select(programSelect)
    .eq('id', programId)
    .maybeSingle();

  if (error) throw new Error(error.message || 'Impossible de charger le programme.');
  return data ? mapProgram(data) : null;
}

export async function createTeachingProgram(payload: TeachingProgramInput, currentUserId: string): Promise<TeachingProgram> {
  const { data, error } = await supabase
    .from('teaching_programs')
    .insert(toProgramPayload(payload, currentUserId))
    .select(programSelect)
    .single();

  if (error) throw new Error(error.message || 'Impossible de créer le programme.');
  return mapProgram(data);
}

export async function updateTeachingProgram(programId: string, payload: TeachingProgramInput): Promise<void> {
  const { error } = await supabase
    .from('teaching_programs')
    .update(toProgramPayload(payload))
    .eq('id', programId);

  if (error) throw new Error(error.message || 'Impossible de modifier le programme.');
}

export async function deleteTeachingProgram(programId: string): Promise<void> {
  const { error } = await supabase.from('teaching_programs').delete().eq('id', programId);
  if (error) throw new Error(error.message || 'Impossible de supprimer le programme.');
}

export async function createTeachingProgramSession(payload: TeachingProgramSessionInput): Promise<void> {
  const { error } = await supabase.from('teaching_program_sessions').insert(toSessionPayload(payload));
  if (error) throw new Error(error.message || 'Impossible d’ajouter la séance.');
}

export async function updateTeachingProgramSession(sessionId: string, payload: TeachingProgramSessionInput): Promise<void> {
  const { error } = await supabase
    .from('teaching_program_sessions')
    .update(toSessionPayload(payload))
    .eq('id', sessionId);

  if (error) throw new Error(error.message || 'Impossible de modifier la séance.');
}

export async function deleteTeachingProgramSession(sessionId: string): Promise<void> {
  const { error } = await supabase.from('teaching_program_sessions').delete().eq('id', sessionId);
  if (error) throw new Error(error.message || 'Impossible de supprimer la séance.');
}

export async function getTeachingPersonOptions(): Promise<PersonOption[]> {
  const [profilesResult, membersResult] = await Promise.all([
    supabase.from('profiles').select('id, full_name, status, avatar_url').eq('status', 'active').order('full_name'),
    supabase.from('church_members').select('id, first_name, last_name, status, avatar_url').eq('status', 'active').order('last_name'),
  ]);

  const profileOptions = ((profilesResult.data ?? []) as Array<{ id: string; full_name?: string | null; avatar_url?: string | null }> )
    .map((item) => ({
      id: item.id,
      label: item.full_name ?? 'Utilisateur',
      source: 'profile' as const,
      avatarUrl: item.avatar_url ?? null,
    }));

  const memberOptions = ((membersResult.data ?? []) as Array<{ id: string; first_name?: string | null; last_name?: string | null; avatar_url?: string | null }> )
    .map((item) => ({
      id: item.id,
      label: `${item.first_name ?? ''} ${item.last_name ?? ''}`.trim() || 'Membre',
      source: 'member' as const,
      avatarUrl: item.avatar_url ?? null,
    }));

  return [...profileOptions, ...memberOptions].sort((a, b) => a.label.localeCompare(b.label));
}

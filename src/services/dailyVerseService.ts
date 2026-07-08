import { supabase } from '@/lib/supabaseClient';
import type { Profile } from '@/types';

export interface DailyVerseInput {
  verseReference: string;
  verseText: string;
  inspirationalMessage?: string;
}

export interface DailyVerse {
  id: string;
  verseReference: string;
  verseText: string;
  inspirationalMessage: string | null;
  status: 'active' | 'inactive' | 'expired';
  publishedBy: string | null;
  publishedAt: string;
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
}

export function mapDailyVerseRow(row: any): DailyVerse {
  return {
    id: row.id,
    verseReference: row.verse_reference,
    verseText: row.verse_text,
    inspirationalMessage: row.inspirational_message,
    status: row.status,
    publishedBy: row.published_by,
    publishedAt: row.published_at,
    expiresAt: row.expires_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Fetch the currently active daily verse.
 * If the current active verse has passed its expiration time, it updates its status
 * to 'expired' and returns null.
 */
export async function getActiveDailyVerse(): Promise<DailyVerse | null> {
  const { data, error } = await supabase
    .from('daily_verses')
    .select('*')
    .eq('status', 'active')
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    return null;
  }

  const now = new Date();
  const expiresAt = new Date(data.expires_at);

  if (expiresAt <= now) {
    // Auto-expire
    await supabase
      .from('daily_verses')
      .update({ status: 'expired' })
      .eq('id', data.id);
    return null;
  }

  return mapDailyVerseRow(data);
}

/**
 * Publish a new daily verse.
 * Only Super Admin is authorized. Deactivates all previous active daily verses.
 */
export async function publishDailyVerse(
  payload: DailyVerseInput,
  currentUser: Profile
): Promise<DailyVerse> {
  if (currentUser.role !== 'superadmin') {
    throw new Error("Action réservée au Super Admin.");
  }

  // 1. Deactivate all active daily verses
  await supabase
    .from('daily_verses')
    .update({ status: 'inactive' })
    .eq('status', 'active');

  const now = new Date();
  const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours later

  // 2. Insert new active verse
  const { data, error } = await supabase
    .from('daily_verses')
    .insert({
      verse_reference: payload.verseReference,
      verse_text: payload.verseText,
      inspirational_message: payload.inspirationalMessage || null,
      status: 'active',
      published_by: currentUser.id,
      published_at: now.toISOString(),
      expires_at: expiresAt.toISOString()
    })
    .select('*')
    .single();

  if (error || !data) {
    throw error || new Error("Impossible de publier le verset du jour.");
  }

  // 3. Log to activity log
  try {
    const { createActivityLog } = await import('@/services/activityLogService');
    await createActivityLog({
      actionType: 'create',
      module: 'dashboard',
      title: 'Verset du jour publié',
      description: `${currentUser.fullName} a publié "${payload.verseReference}" comme verset du jour.`,
      status: 'success',
      targetId: data.id,
      targetName: payload.verseReference
    });
  } catch (err) {
    console.error("Failed to write activity log:", err);
  }

  // 4. Create system notification
  try {
    const { createNotification } = await import('@/services/notificationsService');
    await createNotification({
      title: "Nouveau verset du jour publié",
      message: `Le verset "${payload.verseReference}" est maintenant disponible sur le dashboard.`,
      type: "daily_verse_published",
      priority: "normal",
      link: "/dashboard"
    });
  } catch (err) {
    console.error("Failed to create daily verse notification:", err);
  }

  return mapDailyVerseRow(data);
}

/**
 * Update an existing daily verse. Only Super Admin authorized.
 */
export async function updateDailyVerse(
  id: string,
  payload: DailyVerseInput,
  currentUser: Profile
): Promise<DailyVerse> {
  if (currentUser.role !== 'superadmin') {
    throw new Error("Action réservée au Super Admin.");
  }

  const { data, error } = await supabase
    .from('daily_verses')
    .update({
      verse_reference: payload.verseReference,
      verse_text: payload.verseText,
      inspirational_message: payload.inspirationalMessage || null,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select('*')
    .single();

  if (error || !data) {
    throw error || new Error("Impossible de modifier le verset du jour.");
  }

  // Log activity
  try {
    const { createActivityLog } = await import('@/services/activityLogService');
    await createActivityLog({
      actionType: 'update',
      module: 'dashboard',
      title: 'Verset du jour modifié',
      description: `${currentUser.fullName} a modifié le verset du jour "${payload.verseReference}".`,
      status: 'success',
      targetId: id,
      targetName: payload.verseReference
    });
  } catch (err) {
    console.error("Failed to write activity log:", err);
  }

  return mapDailyVerseRow(data);
}

/**
 * Deactivate a daily verse manually. Only Super Admin authorized.
 */
export async function deactivateDailyVerse(id: string, currentUser: Profile): Promise<void> {
  if (currentUser.role !== 'superadmin') {
    throw new Error("Action réservée au Super Admin.");
  }

  const { error } = await supabase
    .from('daily_verses')
    .update({ status: 'inactive' })
    .eq('id', id);

  if (error) {
    throw error;
  }

  // Log activity
  try {
    const { createActivityLog } = await import('@/services/activityLogService');
    await createActivityLog({
      actionType: 'update',
      module: 'dashboard',
      title: 'Verset du jour désactivé',
      description: `${currentUser.fullName} a désactivé le verset du jour.`,
      status: 'success',
      targetId: id
    });
  } catch (err) {
    console.error("Failed to write activity log:", err);
  }
}

/**
 * Get full history of daily verses.
 */
export async function getDailyVerseHistory(): Promise<DailyVerse[]> {
  const { data, error } = await supabase
    .from('daily_verses')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    throw error;
  }

  return (data || []).map(mapDailyVerseRow);
}

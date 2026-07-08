import { supabase } from '@/lib/supabaseClient';
import type { Profile } from '@/types';

export interface ActivityLogInput {
  actionType: string;
  module: string;
  title: string;
  description: string;
  status?: 'success' | 'failed' | 'warning';
  targetId?: string;
  targetName?: string;
  extensionId?: string;
  departmentId?: string;
  metadata?: Record<string, any>;
}

export interface ActivityLog {
  id: string;
  userId: string | null;
  userName: string | null;
  userRole: string | null;
  actionType: string;
  module: string;
  title: string;
  description: string;
  status: 'success' | 'failed' | 'warning';
  targetId: string | null;
  targetName: string | null;
  extensionId: string | null;
  departmentId: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  metadata: Record<string, any> | null;
  createdAt: string;
}

/**
 * Inserts a new audit activity log entry.
 * It automatically attempts to enrich the log with the logged in user's profile details.
 */
export async function createActivityLog(payload: ActivityLogInput): Promise<void> {
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    const userId = sessionData.session?.user?.id;

    let userName: string | null = null;
    let userRole: string | null = null;
    let extensionId: string | null = payload.extensionId || null;

    if (userId) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, role, branch_id')
        .eq('id', userId)
        .maybeSingle();

      if (profile) {
        userName = profile.full_name;
        userRole = profile.role;
        if (!extensionId) {
          extensionId = profile.branch_id;
        }
      }
    }

    await supabase.from('activity_logs').insert({
      user_id: userId || null,
      user_name: userName,
      user_role: userRole,
      action_type: payload.actionType,
      module: payload.module,
      title: payload.title,
      description: payload.description,
      status: payload.status || 'success',
      target_id: payload.targetId || null,
      target_name: payload.targetName || null,
      extension_id: extensionId,
      department_id: payload.departmentId || null,
      user_agent: typeof window !== 'undefined' ? window.navigator.userAgent : null,
      metadata: payload.metadata || null,
    });
  } catch (err) {
    console.error("Failed to create activity log:", err);
  }
}

/**
 * Fetch all activity logs that the current user has access to.
 * Due to RLS policies in the database, the returned data will automatically be filtered
 * according to the user's role (Superadmin, Admin, Department Manager, Department Member).
 */
export async function getActivityLogsForCurrentUser(_currentUser: Profile): Promise<ActivityLog[]> {
  const { data, error } = await supabase
    .from('activity_logs')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    throw error;
  }

  return (data || []).map((row) => ({
    id: row.id,
    userId: row.user_id,
    userName: row.user_name,
    userRole: row.user_role,
    actionType: row.action_type,
    module: row.module,
    title: row.title,
    description: row.description,
    status: row.status as 'success' | 'failed' | 'warning',
    targetId: row.target_id,
    targetName: row.target_name,
    extensionId: row.extension_id,
    departmentId: row.department_id,
    ipAddress: row.ip_address,
    userAgent: row.user_agent,
    metadata: row.metadata,
    createdAt: row.created_at,
  }));
}

/**
 * Fetch recent activity logs limit (defaults to 15 entries) that the current user has access to.
 * Due to RLS policies, logs are pre-filtered on the server.
 */
export async function getRecentActivityLogs(_currentUser: Profile, limit = 15): Promise<ActivityLog[]> {
  const { data, error } = await supabase
    .from('activity_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    throw error;
  }

  return (data || []).map((row) => ({
    id: row.id,
    userId: row.user_id,
    userName: row.user_name,
    userRole: row.user_role,
    actionType: row.action_type,
    module: row.module,
    title: row.title,
    description: row.description,
    status: row.status as 'success' | 'failed' | 'warning',
    targetId: row.target_id,
    targetName: row.target_name,
    extensionId: row.extension_id,
    departmentId: row.department_id,
    ipAddress: row.ip_address,
    userAgent: row.user_agent,
    metadata: row.metadata,
    createdAt: row.created_at,
  }));
}

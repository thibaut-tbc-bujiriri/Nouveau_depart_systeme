import { supabase } from '@/lib/supabaseClient';
import type { AppNotification, Profile, Role } from '@/types';
import type { NotificationRow } from '@/services/types';

export function mapNotificationRowToNotification(row: NotificationRow): AppNotification {
  return {
    id: row.id,
    title: row.title,
    message: row.message,
    type: row.type,
    priority: row.priority as AppNotification['priority'],
    targetRole: row.target_role as Role | null,
    targetUserId: row.target_user_id,
    targetExtensionId: row.target_extension_id,
    targetDepartmentId: row.target_department_id,
    createdBy: row.created_by,
    link: row.link,
    metadata: row.metadata,
    isRead: row.is_read,
    readAt: row.read_at,
    createdAt: row.created_at,
  };
}

/**
 * Filter notifications in-memory to double-check policies and role scopes.
 */
function filterNotificationsForUser(notifications: AppNotification[], currentUser: Profile): AppNotification[] {
  const { role, id: userId, branchId, departmentIds = [] } = currentUser;

  return notifications.filter((notif) => {
    // 1. Global notification (no targets specified at all)
    if (
      !notif.targetRole &&
      !notif.targetUserId &&
      !notif.targetExtensionId &&
      !notif.targetDepartmentId
    ) {
      return true;
    }

    // 2. Personal notification
    if (notif.targetUserId) {
      return notif.targetUserId === userId;
    }

    // 3. Super Admin logic
    if (role === 'superadmin') {
      // Super Admin sees everything EXCEPT strictly personal notifications of other users
      return !notif.targetUserId || notif.targetUserId === userId;
    }

    // 4. Admin logic
    if (role === 'admin') {
      // If targetRole is specified, it must match
      if (notif.targetRole && notif.targetRole !== 'admin') {
        return false;
      }
      // Admin sees notifications for their own extension, or general role-targeted ones
      if (notif.targetExtensionId && notif.targetExtensionId !== branchId) {
        return false;
      }
      return (
        notif.targetExtensionId === branchId ||
        notif.targetRole === 'admin'
      );
    }

    // 5. Responsable Département logic
    if (role === 'department_manager') {
      // If targetRole is specified, it must match
      if (notif.targetRole && notif.targetRole !== 'department_manager') {
        return false;
      }
      // Sees notifications for their department
      if (notif.targetDepartmentId) {
        return departmentIds.includes(notif.targetDepartmentId);
      }
      // Sees notifications for their extension
      if (notif.targetExtensionId === branchId) {
        return true;
      }
      // Sees notifications general to role
      return notif.targetRole === 'department_manager';
    }

    // 6. Membre Département logic
    if (role === 'department_member') {
      // If targetRole is specified, it must match
      if (notif.targetRole && notif.targetRole !== 'department_member') {
        return false;
      }
      // Sees notifications for their department
      if (notif.targetDepartmentId) {
        return departmentIds.includes(notif.targetDepartmentId);
      }
      // Sees general department member notifications of their extension
      if (notif.targetExtensionId === branchId) {
        return true;
      }
      return notif.targetRole === 'department_member';
    }

    return false;
  });
}

/**
 * Fetch all notifications visible to the current user.
 */
export async function getNotificationsForCurrentUser(currentUser: Profile): Promise<AppNotification[]> {
  // 1. Fetch notification deletes for this user
  const { data: deletes, error: deletesError } = await supabase
    .from('notification_deletes')
    .select('notification_id')
    .eq('user_id', currentUser.id);

  if (deletesError) {
    throw deletesError;
  }

  const deletedIds = new Set((deletes ?? []).map((d: any) => d.notification_id));

  // 2. Fetch notifications
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .order('created_at', { ascending: false });

  if (error || !data) {
    throw error ?? new Error('Impossible de charger les notifications.');
  }

  // 3. Map, exclude deleted IDs, and filter by user scope
  const mapped = (data as NotificationRow[])
    .map(mapNotificationRowToNotification)
    .filter((n) => !deletedIds.has(n.id));

  return filterNotificationsForUser(mapped, currentUser);
}

/**
 * Get count of unread notifications visible to the current user.
 */
export async function getUnreadNotificationsCount(currentUser: Profile): Promise<number> {
  const notifications = await getNotificationsForCurrentUser(currentUser);
  return notifications.filter((n) => !n.isRead).length;
}

/**
 * Mark a single notification as read.
 */
export async function markNotificationAsRead(notificationId: string): Promise<void> {
  const { error } = await supabase
    .from('notifications')
    .update({
      is_read: true,
      read_at: new Date().toISOString(),
    })
    .eq('id', notificationId);

  if (error) {
    throw error;
  }
}

/**
 * Mark all unread notifications visible to the current user as read.
 */
export async function markAllNotificationsAsRead(currentUser: Profile): Promise<void> {
  const notifications = await getNotificationsForCurrentUser(currentUser);
  const unreadIds = notifications.filter((n) => !n.isRead).map((n) => n.id);

  if (unreadIds.length === 0) {
    return;
  }

  const { error } = await supabase
    .from('notifications')
    .update({
      is_read: true,
      read_at: new Date().toISOString(),
    })
    .in('id', unreadIds);

  if (error) {
    throw error;
  }
}

/**
 * Create a new notification.
 */
export async function createNotification(
  payload: Omit<AppNotification, 'id' | 'createdAt' | 'isRead'>
): Promise<AppNotification> {
  const { error, data } = await supabase
    .from('notifications')
    .insert({
      title: payload.title,
      message: payload.message,
      type: payload.type,
      priority: payload.priority || 'normal',
      target_role: payload.targetRole || null,
      target_user_id: payload.targetUserId || null,
      target_extension_id: payload.targetExtensionId || null,
      target_department_id: payload.targetDepartmentId || null,
      created_by: payload.createdBy || null,
      link: payload.link || null,
      metadata: payload.metadata || null,
    })
    .select('*')
    .single();

  if (error || !data) {
    throw error ?? new Error('Impossible de créer la notification.');
  }

  return mapNotificationRowToNotification(data as NotificationRow);
}

/**
 * Delete a single notification for the current user.
 * It inserts a row in the notification_deletes table to log the deletion.
 * If the notification was strictly targeted to this user (personal), we physically delete it to save space.
 */
export async function deleteNotification(notificationId: string): Promise<void> {
  const { data: session } = await supabase.auth.getSession();
  const userId = session.session?.user?.id;
  if (!userId) throw new Error("Utilisateur non authentifié.");

  // Check if it is a personal notification
  const { data: notif } = await supabase
    .from('notifications')
    .select('target_user_id')
    .eq('id', notificationId)
    .maybeSingle();

  if (notif && notif.target_user_id === userId) {
    // Physically delete personal notifications
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId);
    if (error) throw error;
  } else {
    // Logically delete shared ones by inserting a row in notification_deletes
    const { error } = await supabase
      .from('notification_deletes')
      .insert({
        notification_id: notificationId,
        user_id: userId,
      });
    if (error) throw error;
  }
}

/**
 * Delete all notifications visible to the current user.
 * Uses the delete_all_notifications_for_user() RPC.
 */
export async function deleteAllNotificationsForCurrentUser(): Promise<void> {
  const { error } = await supabase.rpc('delete_all_notifications_for_user');
  if (error) {
    throw error;
  }
}

import { EmptyState, LoadingState } from '@/components/common';
import {
  AdminDashboard,
  DepartmentManagerDashboard,
  DepartmentMemberDashboard,
  SuperAdminDashboard,
} from '@/features/dashboard/components';
import { useAuth } from '@/hooks/useAuth';
import { useDashboardStats } from '@/hooks/useDashboardStats';

import { CalendarDays } from 'lucide-react';

export function DashboardPage() {
  const { user } = useAuth();
  const dashboard = useDashboardStats(user);

  if (!user) {
    return null;
  }

  // Get current date formatted in French: e.g. "Mercredi 21 mai 2025"
  const formattedDate = new Date().toLocaleDateString('fr-FR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const displayDate = formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1);

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
            Bonjour, {user.fullName} 👋
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Voici un aperçu de l'activité de l'église Nouveau Départ.
          </p>
        </div>
        <div className="flex items-center gap-2.5 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm shrink-0">
          <CalendarDays className="size-4 text-slate-400" />
          <span>{displayDate}</span>
        </div>
      </div>

      {dashboard.error ? <EmptyState title="Donnees dashboard partielles" description={dashboard.error} /> : null}

      {dashboard.isLoading ? <LoadingState message="Chargement du dashboard..." /> : null}

      {user.role === 'superadmin' ? <SuperAdminDashboard user={user} dashboard={dashboard} /> : null}
      {user.role === 'admin' ? <AdminDashboard user={user} dashboard={dashboard} /> : null}
      {user.role === 'department_manager' ? <DepartmentManagerDashboard user={user} dashboard={dashboard} /> : null}
      {user.role === 'department_member' ? <DepartmentMemberDashboard user={user} dashboard={dashboard} /> : null}
    </div>
  );
}


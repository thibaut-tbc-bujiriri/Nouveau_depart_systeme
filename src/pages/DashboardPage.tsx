import { EmptyState, LoadingState, PageHeader } from '@/components/common';
import {
  AdminDashboard,
  DepartmentManagerDashboard,
  DepartmentMemberDashboard,
  SuperAdminDashboard,
} from '@/features/dashboard/components';
import { roleDashboardConfig } from '@/features/dashboard/lib/dashboardSelectors';
import { useAuth } from '@/hooks/useAuth';
import { useDashboardStats } from '@/hooks/useDashboardStats';

export function DashboardPage() {
  const { user } = useAuth();
  const dashboard = useDashboardStats(user);

  if (!user) {
    return null;
  }

  const config = roleDashboardConfig[user.role];

  return (
    <div className="space-y-6">
      <PageHeader title={config.title} description={config.subtitle} />

      {dashboard.error ? <EmptyState title="Donnees dashboard partielles" description={dashboard.error} /> : null}

      {dashboard.isLoading ? <LoadingState message="Chargement du dashboard..." /> : null}

      {user.role === 'superadmin' ? <SuperAdminDashboard user={user} dashboard={dashboard} /> : null}
      {user.role === 'admin' ? <AdminDashboard user={user} dashboard={dashboard} /> : null}
      {user.role === 'department_manager' ? <DepartmentManagerDashboard user={user} dashboard={dashboard} /> : null}
      {user.role === 'department_member' ? <DepartmentMemberDashboard user={user} dashboard={dashboard} /> : null}
    </div>
  );
}


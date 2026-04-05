import { DepartmentBadge, EmptyState, LoadingState, PageHeader, UserAvatar } from '@/components/common';
import { useAuth } from '@/hooks/useAuth';
import { useBranches } from '@/hooks/useBranches';
import { useDepartments } from '@/hooks/useDepartments';
import { roleLabels } from '@/utils/permissions';

export function ProfilePage() {
  const { user, isLoading } = useAuth();
  const { branches } = useBranches();
  const { departments } = useDepartments();

  if (isLoading) {
    return <LoadingState message="Chargement du profil..." />;
  }

  if (!user) {
    return <EmptyState title="Session invalide" description="Reconnectez-vous pour voir votre profil." />;
  }

  const branch = branches.find((item) => item.id === user.branchId);
  const userDepartments = departments.filter((department) => user.departmentIds.includes(department.id));
  const branchLabel =
    branch?.name ?? (user.role === 'superadmin' ? 'Global (toutes extensions)' : 'Non assignee');

  return (
    <div className="space-y-6">
      <PageHeader title="Profil" description="Informations du compte connecte." />

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <UserAvatar name={user.fullName} role={user.role} />
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">{roleLabels[user.role]}</span>
        </div>

        <dl className="mt-5 grid gap-4 text-sm md:grid-cols-2">
          <div>
            <dt className="text-slate-500">Email</dt>
            <dd className="font-medium text-slate-800">{user.email}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Telephone</dt>
            <dd className="font-medium text-slate-800">{user.phone}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Extension</dt>
            <dd className="font-medium text-slate-800">{branchLabel}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Titre</dt>
            <dd className="font-medium text-slate-800">{user.title ?? '-'}</dd>
          </div>
        </dl>

        <div className="mt-5">
          <p className="mb-2 text-sm text-slate-500">Departements associes</p>
          <div className="flex flex-wrap gap-2">
            {userDepartments.length > 0 ? (
              userDepartments.map((department) => <DepartmentBadge key={department.id} name={department.name} />)
            ) : (
              <span className="text-sm text-slate-500">Aucun departement assigne.</span>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}


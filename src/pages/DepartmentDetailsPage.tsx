import { DataTable, EmptyState, LoadingState, PageHeader, StatCard } from '@/components/common';
import { useReportsData } from '@/hooks/useReportsData';
import { useAuth } from '@/hooks/useAuth';
import { useBranches } from '@/hooks/useBranches';
import { useDepartments } from '@/hooks/useDepartments';
import { useMembers } from '@/hooks/useMembers';
import { formatDate } from '@/utils/format';
import { useMemo } from 'react';
import { useParams } from 'react-router-dom';

export function DepartmentDetailsPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const { departments, isLoading: departmentsLoading } = useDepartments();
  const { members, isLoading: membersLoading } = useMembers();
  const { reports, isLoading: reportsLoading } = useReportsData();
  const { branches } = useBranches();

  const department = useMemo(() => departments.find((item) => item.id === id), [departments, id]);

  if (departmentsLoading || membersLoading || reportsLoading) {
    return <LoadingState message="Chargement du departement..." />;
  }

  if (!department || !user) {
    return <EmptyState title="Departement introuvable" description="Verifiez l'identifiant du departement." />;
  }

  const canView =
    user.role === 'superadmin' ||
    (user.role === 'admin' && department.branchId === user.branchId) ||
    user.departmentIds.includes(department.id);

  if (!canView) {
    return <EmptyState title="Acces limite" description="Vous ne pouvez pas consulter ce departement." />;
  }

  const branch = branches.find((item) => item.id === department.branchId);
  const departmentMembers = members.filter((member) => member.departmentIds.includes(department.id));
  const departmentUsers = user.departmentIds.includes(department.id)
    ? [
        {
          profile: user,
          roleInDepartment: user.role === 'department_manager' ? 'department_manager' : 'department_member',
          joinedAt: user.id,
        },
      ]
    : [];
  const departmentReports = reports.filter((report) => report.type === 'department' && report.branchId === department.branchId);

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Departement ${department.name}`}
        description={`Extension: ${branch?.name ?? 'N/A'} | Responsable: ${department.responsibleName ?? 'A definir'}`}
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Membres" value={String(departmentMembers.length)} />
        <StatCard label="Utilisateurs lies" value={String(departmentUsers.length)} />
        <StatCard label="Budget Mensuel" value={`${department.monthlyBudget} USD`} />
        <StatCard label="Statut" value={department.isActive ? 'Actif' : 'Inactif'} />
      </section>

      <DataTable
        data={departmentUsers}
        keyExtractor={(item) => item.profile.id}
        columns={[
          { key: 'user', label: 'Utilisateur', render: (item) => item.profile.fullName },
          {
            key: 'role',
            label: 'Role departement',
            render: (item) =>
              item.roleInDepartment === 'department_manager' ? 'department_manager' : 'department_member',
          },
          { key: 'email', label: 'Email', render: (item) => item.profile.email },
          { key: 'joinedAt', label: 'Lie depuis', render: (item) => item.joinedAt },
        ]}
        emptyMessage="Aucun utilisateur lie a ce departement."
      />

      <DataTable
        data={departmentMembers}
        keyExtractor={(member) => member.id}
        columns={[
          { key: 'name', label: 'Nom', render: (member) => `${member.firstName} ${member.lastName}` },
          { key: 'phone', label: 'Telephone', render: (member) => member.phone },
          { key: 'joinedAt', label: 'Adhesion', render: (member) => formatDate(member.joinedAt) },
          { key: 'status', label: 'Statut', render: (member) => member.status },
        ]}
      />

      <DataTable
        data={departmentReports}
        keyExtractor={(report) => report.id}
        columns={[
          { key: 'title', label: 'Rapport', render: (report) => report.title },
          { key: 'period', label: 'Periode', render: (report) => report.period },
          { key: 'generatedAt', label: 'Genere le', render: (report) => formatDate(report.generatedAt) },
        ]}
        emptyMessage="Aucun rapport departemental pour le moment."
      />
    </div>
  );
}


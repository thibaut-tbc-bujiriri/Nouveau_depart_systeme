import { DataTable, EmptyState, LoadingState, PageHeader, StatCard } from '@/components/common';
import { useReportsData } from '@/hooks/useReportsData';
import { useAuth } from '@/hooks/useAuth';
import { useBranches } from '@/hooks/useBranches';
import { useDepartments } from '@/hooks/useDepartments';
import { useMembers } from '@/hooks/useMembers';
import { useUsersManagement } from '@/hooks/useUsersManagement';
import { formatDate } from '@/utils/format';
import { useMemo, useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { AppButton, FormFieldWrapper } from '@/components/ui';
import { Modal } from '@/components/ui/Modal';
import { usePreferences } from '@/contexts/PreferencesContext';

export function DepartmentDetailsPage() {
  const { id } = useParams();
  const { formatMoney } = usePreferences();
  const { user } = useAuth();
  const { departments, isLoading: departmentsLoading, updateDepartment, isMutating } = useDepartments();
  const { members, isLoading: membersLoading } = useMembers();
  const { reports, isLoading: reportsLoading } = useReportsData();
  const { branches } = useBranches();
  const { users, isLoading: usersLoading } = useUsersManagement();

  const department = useMemo(() => departments.find((item) => item.id === id), [departments, id]);

  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);
  const [budgetVal, setBudgetVal] = useState(0);

  useEffect(() => {
    if (department) {
      setBudgetVal(department.monthlyBudget);
    }
  }, [department]);

  const departmentUsers = useMemo(() => {
    if (!department) return [];
    return users
      .filter((u) => u.departmentIds.includes(department.id))
      .map((u) => ({
        profile: u,
        roleInDepartment: u.role === 'department_manager' ? 'department_manager' : 'department_member',
        joinedAt: '-',
      }));
  }, [users, department]);

  const manager = useMemo(() => {
    if (!department) return undefined;
    return users.find((u) => u.role === 'department_manager' && u.departmentIds.includes(department.id));
  }, [users, department]);

  if (departmentsLoading || membersLoading || reportsLoading || usersLoading) {
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

  const canEditBudget =
    user.role === 'superadmin' ||
    (user.role === 'admin' && department.branchId === user.branchId) ||
    (user.role === 'department_manager' && user.departmentIds.includes(department.id));

  const handleSaveBudget = async () => {
    const payload = {
      branchId: department.branchId,
      name: department.name,
      managerId: department.managerId || undefined,
      monthlyBudget: budgetVal,
      isActive: department.isActive,
    };
    const ok = await updateDepartment(department.id, payload);
    if (ok) {
      setIsBudgetModalOpen(false);
    }
  };

  const branch = branches.find((item) => item.id === department.branchId);
  const departmentMembers = members.filter((member) => member.departmentIds.includes(department.id));
  const responsibleName = manager ? manager.fullName : 'A definir';
  const departmentReports = reports.filter((report) => report.type === 'department' && report.branchId === department.branchId);

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Departement ${department.name}`}
        description={`Extension: ${branch?.name ?? 'N/A'} | Responsable: ${responsibleName}`}
        actions={canEditBudget ? <AppButton onClick={() => setIsBudgetModalOpen(true)}>Modifier le budget</AppButton> : undefined}
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Membres" value={String(departmentMembers.length)} />
        <StatCard label="Utilisateurs lies" value={String(departmentUsers.length)} />
        <StatCard label="Budget Mensuel" value={formatMoney(department.monthlyBudget)} />
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

      <Modal
        isOpen={isBudgetModalOpen}
        onClose={() => setIsBudgetModalOpen(false)}
        title={`Modifier le budget - ${department.name}`}
      >
        <div className="space-y-4">
          <FormFieldWrapper label="Budget mensuel (USD)" required>
            <input
              type="number"
              min={0}
              value={String(budgetVal)}
              onChange={(e) => setBudgetVal(Number(e.target.value) || 0)}
              className="w-full text-sm bg-white border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500"
            />
          </FormFieldWrapper>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 mt-2">
            <AppButton variant="secondary" onClick={() => setIsBudgetModalOpen(false)}>
              Annuler
            </AppButton>
            <AppButton isLoading={isMutating} onClick={handleSaveBudget}>
              Enregistrer
            </AppButton>
          </div>
        </div>
      </Modal>
    </div>
  );
}


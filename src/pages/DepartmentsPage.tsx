import { DataTable, DepartmentBadge, EmptyState, LoadingState, PageHeader } from '@/components/common';
import { AppButton, AppInput, AppSelect, FormFieldWrapper, SearchInput } from '@/components/ui';
import { ConfirmDialog, Modal } from '@/components/ui/Modal';
import { useAuth } from '@/hooks/useAuth';
import { toBaseDepartment, useDepartments } from '@/hooks/useDepartments';
import { useBranches } from '@/hooks/useBranches';
import { useMembers } from '@/hooks/useMembers';
import { useUsersManagement } from '@/hooks/useUsersManagement';
import type { DepartmentName } from '@/types';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

interface DepartmentFormState {
  branchId: string;
  name: DepartmentName;
  managerId: string;
  monthlyBudget: number;
  isActive: boolean;
}

const departmentOptions: DepartmentName[] = [
  'Mamans',
  'Papas',
  'Ecodim',
  'Coordination',
  'Caisse',
  'Protocole',
  'Proprete',
  'Musique',
  'Chanteurs',
  'Evangelisation',
  'Moderation',
  'Enseignement',
  'Interpretation',
  'Logistique & Transport',
  'Informatique',
  'Media',
  'Tresorerie',
];

const initialForm: DepartmentFormState = {
  branchId: '',
  name: 'Coordination',
  managerId: '',
  monthlyBudget: 0,
  isActive: true,
};

export function DepartmentsPage() {
  const { user } = useAuth();
  const { departments, isLoading, isMutating, error, createDepartment, updateDepartment, deleteDepartment } = useDepartments();
  const { members } = useMembers();
  const { branches } = useBranches();
  const { users } = useUsersManagement();
  const [query, setQuery] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState<DepartmentFormState>(initialForm);

  const branchMap = useMemo(() => new Map(branches.map((branch) => [branch.id, branch.name])), [branches]);
  const usersMap = useMemo(() => new Map(users.map((item) => [item.id, item.fullName])), [users]);
  const canManage = user?.role === 'superadmin' || user?.role === 'admin';

  const scopedDepartments = useMemo(() => {
    if (!user) {
      return [];
    }

    const all = departments.map(toBaseDepartment);

    if (user.role === 'superadmin') {
      return departments;
    }

    if (user.role === 'admin') {
      return departments.filter((department) => department.branchId === user.branchId);
    }

    return all
      .filter((department) => user.departmentIds.includes(department.id))
      .map((department) => departments.find((item) => item.id === department.id) ?? { ...department, responsibleName: undefined });
  }, [departments, user]);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) {
      return scopedDepartments;
    }

    return scopedDepartments.filter((department) =>
      [department.name, branchMap.get(department.branchId) ?? ''].join(' ').toLowerCase().includes(normalized),
    );
  }, [branchMap, query, scopedDepartments]);

  const responsibleOptions = useMemo(() => {
    if (!form.branchId) {
      return users;
    }

    return users.filter((profile) => profile.branchId === form.branchId || !profile.branchId);
  }, [form.branchId, users]);

  const resetForm = () => {
    setForm({
      ...initialForm,
      branchId: user?.branchId ?? '',
    });
  };

  const openCreateModal = () => {
    setEditingId(null);
    resetForm();
    setIsModalOpen(true);
  };

  const openEditModal = (department: (typeof filtered)[number]) => {
    setEditingId(department.id);
    setForm({
      branchId: department.branchId,
      name: department.name,
      managerId: department.managerId,
      monthlyBudget: department.monthlyBudget,
      isActive: department.isActive,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async () => {
    if (!form.branchId) {
      return;
    }

    const payload = {
      branchId: form.branchId,
      name: form.name,
      managerId: form.managerId || undefined,
      monthlyBudget: form.monthlyBudget,
      isActive: form.isActive,
    };

    const ok = editingId ? await updateDepartment(editingId, payload) : await createDepartment(payload);
    if (ok) {
      setIsModalOpen(false);
      resetForm();
      setEditingId(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) {
      return;
    }

    const ok = await deleteDepartment(deleteId);
    if (ok) {
      setDeleteId(null);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Departements"
        description="Pilotage des equipes de service et de leurs budgets."
        actions={canManage ? <AppButton onClick={openCreateModal}>Nouveau departement</AppButton> : undefined}
      >
        <SearchInput value={query} onChange={setQuery} placeholder="Rechercher un departement..." />
      </PageHeader>

      {error ? <EmptyState title="Donnees partiellement disponibles" description={error} /> : null}

      {isLoading ? (
        <LoadingState message="Chargement des departements..." />
      ) : (
        <DataTable
          data={filtered}
          keyExtractor={(department) => department.id}
          columns={[
            { key: 'name', label: 'Departement', render: (department) => <DepartmentBadge name={department.name} /> },
            {
              key: 'branch',
              label: 'Extension',
              render: (department) => branchMap.get(department.branchId) ?? 'N/A',
            },
            {
              key: 'responsible',
              label: 'Responsable',
              render: (department) => department.responsibleName ?? usersMap.get(department.managerId) ?? 'A affecter',
            },
            {
              key: 'members',
              label: 'Membres',
              render: (department) => {
                const count = members.filter((member) => member.departmentIds.includes(department.id)).length;
                const preview = members
                  .filter((member) => member.departmentIds.includes(department.id))
                  .slice(0, 2)
                  .map((member) => `${member.firstName} ${member.lastName}`);

                return (
                  <div>
                    <p className="font-medium text-slate-700">{count} membre(s)</p>
                    <p className="text-xs text-slate-500">{preview.length > 0 ? preview.join(', ') : 'Aucun membre'}</p>
                  </div>
                );
              },
            },
            { key: 'budget', label: 'Budget Mensuel', render: (department) => `${department.monthlyBudget} USD` },
            {
              key: 'actions',
              label: 'Details',
              render: (department) => (
                <div className="flex items-center gap-2">
                  <Link to={`/departments/${department.id}`} className="font-medium text-slate-700 hover:text-slate-900">
                    Ouvrir
                  </Link>
                  {canManage ? (
                    <>
                      <AppButton size="sm" variant="secondary" onClick={() => openEditModal(department)}>
                        Modifier
                      </AppButton>
                      <AppButton size="sm" variant="danger" onClick={() => setDeleteId(department.id)}>
                        Supprimer
                      </AppButton>
                    </>
                  ) : null}
                </div>
              ),
            },
          ]}
        />
      )}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingId ? 'Modifier departement' : 'Nouveau departement'}>
        <div className="space-y-4">
          <FormFieldWrapper label="Extension" required>
            <AppSelect
              value={form.branchId}
              onChange={(event) => setForm((prev) => ({ ...prev, branchId: event.target.value }))}
              disabled={user.role === 'admin'}
            >
              <option value="">Selectionner</option>
              {branches
                .filter((branch) => (user.role === 'superadmin' ? true : branch.id === user.branchId))
                .map((branch) => (
                  <option key={branch.id} value={branch.id}>
                    {branch.name}
                  </option>
                ))}
            </AppSelect>
          </FormFieldWrapper>

          <FormFieldWrapper label="Nom du departement" required>
            <AppSelect value={form.name} onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value as DepartmentName }))}>
              {departmentOptions.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </AppSelect>
          </FormFieldWrapper>

          <FormFieldWrapper label="Responsable">
            <AppSelect value={form.managerId} onChange={(event) => setForm((prev) => ({ ...prev, managerId: event.target.value }))}>
              <option value="">Aucun</option>
              {responsibleOptions.map((profile) => (
                <option key={profile.id} value={profile.id}>
                  {profile.fullName}
                </option>
              ))}
            </AppSelect>
          </FormFieldWrapper>

          <FormFieldWrapper label="Budget mensuel (USD)">
            <AppInput
              type="number"
              min={0}
              value={String(form.monthlyBudget)}
              onChange={(event) => setForm((prev) => ({ ...prev, monthlyBudget: Number(event.target.value) || 0 }))}
            />
          </FormFieldWrapper>

          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(event) => setForm((prev) => ({ ...prev, isActive: event.target.checked }))}
            />
            Departement actif
          </label>

          <div className="flex justify-end gap-2">
            <AppButton variant="secondary" onClick={() => setIsModalOpen(false)}>
              Annuler
            </AppButton>
            <AppButton isLoading={isMutating} onClick={handleSubmit}>
              Enregistrer
            </AppButton>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={Boolean(deleteId)}
        title="Supprimer ce departement ?"
        description="Les affectations associees peuvent etre impactees."
        onCancel={() => setDeleteId(null)}
        onConfirm={handleDelete}
        confirmLabel={isMutating ? 'Suppression...' : 'Supprimer'}
      />
    </div>
  );
}

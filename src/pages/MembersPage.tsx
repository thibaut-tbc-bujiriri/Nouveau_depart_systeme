import { BranchBadge, DataTable, DepartmentBadge, EmptyState, LoadingState, PageHeader } from '@/components/common';
import { AppButton, AppInput, AppSelect, FormFieldWrapper, SearchInput } from '@/components/ui';
import { ConfirmDialog, Modal } from '@/components/ui/Modal';
import { useAuth } from '@/hooks/useAuth';
import { useBranches } from '@/hooks/useBranches';
import { useDepartments } from '@/hooks/useDepartments';
import { useMembers } from '@/hooks/useMembers';
import type { ChurchMember } from '@/types';
import { useMemo, useState } from 'react';

interface MemberFormState {
  branchId: string;
  firstName: string;
  lastName: string;
  gender: ChurchMember['gender'];
  phone: string;
  email: string;
  status: ChurchMember['status'];
  joinedAt: string;
  departmentIds: string[];
}

const initialForm: MemberFormState = {
  branchId: '',
  firstName: '',
  lastName: '',
  gender: 'male',
  phone: '',
  email: '',
  status: 'active',
  joinedAt: new Date().toISOString().slice(0, 10),
  departmentIds: [],
};

export function MembersPage() {
  const { user } = useAuth();
  const { members, isLoading, isMutating, error, createMember, updateMember, deleteMember } = useMembers();
  const { branches } = useBranches();
  const { departments } = useDepartments();
  const [query, setQuery] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState<MemberFormState>(initialForm);

  const canManage = user?.role === 'superadmin' || user?.role === 'admin' || user?.role === 'department_manager';

  const scopedMembers = useMemo(() => {
    if (!user) {
      return [];
    }

    return members.filter((member) => {
      if (user.role === 'superadmin' || user.role === 'admin') {
        return user.role === 'superadmin' ? true : member.branchId === user.branchId;
      }

      return member.departmentIds.some((departmentId) => user.departmentIds.includes(departmentId));
    });
  }, [members, user]);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) {
      return scopedMembers;
    }

    return scopedMembers.filter((member) =>
      `${member.firstName} ${member.lastName} ${member.phone}`.toLowerCase().includes(normalized),
    );
  }, [query, scopedMembers]);

  const availableDepartments = useMemo(() => {
    if (!form.branchId) {
      return departments;
    }

    return departments.filter((department) => department.branchId === form.branchId);
  }, [departments, form.branchId]);

  const resetForm = () => {
    setForm({
      ...initialForm,
      branchId: user?.role === 'superadmin' ? '' : (user?.branchId ?? ''),
    });
  };

  const openCreateModal = () => {
    setEditingId(null);
    resetForm();
    setIsModalOpen(true);
  };

  const openEditModal = (member: (typeof filtered)[number]) => {
    setEditingId(member.id);
    setForm({
      branchId: member.branchId,
      firstName: member.firstName,
      lastName: member.lastName,
      gender: member.gender,
      phone: member.phone,
      email: member.email ?? '',
      status: member.status,
      joinedAt: member.joinedAt.slice(0, 10),
      departmentIds: [...member.departmentIds],
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async () => {
    if (!form.firstName.trim() || !form.lastName.trim() || !form.branchId) {
      return;
    }

    const payload = {
      branchId: form.branchId,
      firstName: form.firstName,
      lastName: form.lastName,
      gender: form.gender,
      phone: form.phone,
      email: form.email || undefined,
      status: form.status,
      joinedAt: form.joinedAt,
      departmentIds: form.departmentIds,
    };

    const ok = editingId ? await updateMember(editingId, payload) : await createMember(payload);

    if (ok) {
      setIsModalOpen(false);
      setEditingId(null);
      resetForm();
    }
  };

  const handleDelete = async () => {
    if (!deleteId) {
      return;
    }

    const ok = await deleteMember(deleteId);
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
        title="Membres"
        description="Vue consolidee des membres actifs de l'eglise."
        actions={canManage ? <AppButton onClick={openCreateModal}>Ajouter un membre</AppButton> : undefined}
      >
        <SearchInput value={query} onChange={setQuery} placeholder="Rechercher un membre..." />
      </PageHeader>

      {error ? <EmptyState title="Donnees partiellement disponibles" description={error} /> : null}

      {isLoading ? (
        <LoadingState message="Chargement des membres..." />
      ) : (
        <DataTable
          data={filtered}
          keyExtractor={(member) => member.id}
          columns={[
            {
              key: 'name',
              label: 'Nom complet',
              render: (member) => `${member.firstName} ${member.lastName}`,
            },
            {
              key: 'branch',
              label: 'Extension',
              render: (member) => (
                <BranchBadge
                  branchName={branches.find((branch) => branch.id === member.branchId)?.name ?? 'N/A'}
                />
              ),
            },
            {
              key: 'departments',
              label: 'Departements',
              render: (member) => (
                <div className="flex flex-wrap gap-1">
                  {member.departmentIds.slice(0, 2).map((departmentId) => (
                    <DepartmentBadge
                      key={departmentId}
                      name={departments.find((department) => department.id === departmentId)?.name ?? 'N/A'}
                    />
                  ))}
                </div>
              ),
            },
            { key: 'phone', label: 'Telephone', render: (member) => member.phone },
            {
              key: 'status',
              label: 'Statut',
              render: (member) => (
                <span className={member.status === 'active' ? 'text-emerald-600' : 'text-rose-600'}>
                  {member.status === 'active' ? 'Actif' : 'Inactif'}
                </span>
              ),
            },
            {
              key: 'actions',
              label: 'Actions',
              render: (member) =>
                canManage ? (
                  <div className="flex gap-2">
                    <AppButton size="sm" variant="secondary" onClick={() => openEditModal(member)}>
                      Modifier
                    </AppButton>
                    <AppButton size="sm" variant="danger" onClick={() => setDeleteId(member.id)}>
                      Supprimer
                    </AppButton>
                  </div>
                ) : (
                  '-'
                ),
            },
          ]}
        />
      )}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingId ? 'Modifier membre' : 'Nouveau membre'}>
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <FormFieldWrapper label="Prenom" required>
              <AppInput value={form.firstName} onChange={(event) => setForm((prev) => ({ ...prev, firstName: event.target.value }))} />
            </FormFieldWrapper>
            <FormFieldWrapper label="Nom" required>
              <AppInput value={form.lastName} onChange={(event) => setForm((prev) => ({ ...prev, lastName: event.target.value }))} />
            </FormFieldWrapper>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <FormFieldWrapper label="Extension" required>
              <AppSelect
                value={form.branchId}
                onChange={(event) => setForm((prev) => ({ ...prev, branchId: event.target.value, departmentIds: [] }))}
                disabled={user.role !== 'superadmin'}
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
            <FormFieldWrapper label="Sexe">
              <AppSelect value={form.gender} onChange={(event) => setForm((prev) => ({ ...prev, gender: event.target.value as ChurchMember['gender'] }))}>
                <option value="male">Homme</option>
                <option value="female">Femme</option>
              </AppSelect>
            </FormFieldWrapper>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <FormFieldWrapper label="Telephone">
              <AppInput value={form.phone} onChange={(event) => setForm((prev) => ({ ...prev, phone: event.target.value }))} />
            </FormFieldWrapper>
            <FormFieldWrapper label="Email">
              <AppInput type="email" value={form.email} onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))} />
            </FormFieldWrapper>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <FormFieldWrapper label="Date adhesion">
              <AppInput type="date" value={form.joinedAt} onChange={(event) => setForm((prev) => ({ ...prev, joinedAt: event.target.value }))} />
            </FormFieldWrapper>
            <FormFieldWrapper label="Statut">
              <AppSelect value={form.status} onChange={(event) => setForm((prev) => ({ ...prev, status: event.target.value as ChurchMember['status'] }))}>
                <option value="active">Actif</option>
                <option value="inactive">Inactif</option>
              </AppSelect>
            </FormFieldWrapper>
          </div>

          <div>
            <p className="mb-2 text-sm font-medium text-slate-700">Departements</p>
            <div className="max-h-40 space-y-2 overflow-y-auto rounded-lg border border-slate-200 p-3">
              {availableDepartments.map((department) => (
                <label key={department.id} className="flex items-center gap-2 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={form.departmentIds.includes(department.id)}
                    onChange={(event) =>
                      setForm((prev) => {
                        const selected = new Set(prev.departmentIds);
                        if (event.target.checked) {
                          selected.add(department.id);
                        } else {
                          selected.delete(department.id);
                        }
                        return { ...prev, departmentIds: Array.from(selected) };
                      })
                    }
                  />
                  {department.name}
                </label>
              ))}
              {availableDepartments.length === 0 ? <p className="text-sm text-slate-500">Aucun departement.</p> : null}
            </div>
          </div>

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
        title="Supprimer ce membre ?"
        description="Cette action supprimera aussi ses liaisons departements."
        onCancel={() => setDeleteId(null)}
        onConfirm={handleDelete}
        confirmLabel={isMutating ? 'Suppression...' : 'Supprimer'}
      />
    </div>
  );
}

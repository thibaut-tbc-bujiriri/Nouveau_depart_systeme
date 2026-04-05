import { DataTable, EmptyState, LoadingState, PageHeader } from '@/components/common';
import { AppButton, AppSelect, SearchInput } from '@/components/ui';
import { Modal } from '@/components/ui/Modal';
import { useUsersManagement } from '@/hooks/useUsersManagement';
import type { Role } from '@/types';
import { useMemo, useState } from 'react';

interface EditingUserState {
  id: string;
  fullName: string;
  role: Role;
  branchId: string;
  departmentIds: string[];
}

const roleOptions: Array<{ value: Role; label: string }> = [
  { value: 'superadmin', label: 'Super Admin' },
  { value: 'admin', label: 'Admin' },
  { value: 'department_manager', label: 'Responsable Departement' },
  { value: 'department_member', label: 'Membre Departement' },
];

export function UsersPage() {
  const { users, branches, departments, isLoading, isSaving, error, source, saveUserAccess } = useUsersManagement();
  const [query, setQuery] = useState('');
  const [editingUser, setEditingUser] = useState<EditingUserState | null>(null);

  const filteredUsers = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) {
      return users;
    }

    return users.filter((user) => [user.fullName, user.email, user.role].join(' ').toLowerCase().includes(normalized));
  }, [query, users]);

  const editableDepartments = editingUser?.branchId
    ? departments.filter((department) => department.branchId === editingUser.branchId)
    : departments;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Utilisateurs"
        description="Gestion des comptes, roles et affectations departementales."
        actions={
          <AppButton variant="secondary" disabled title="Creation de compte via Supabase Auth">
            Nouvel utilisateur (via Auth)
          </AppButton>
        }
      >
        <SearchInput value={query} onChange={setQuery} placeholder="Rechercher un utilisateur..." />
      </PageHeader>

      {error ? (
        <EmptyState
          title="Donnees utilisateurs partielles"
          description={`Mode ${source === 'mock' ? 'fallback mock' : 'supabase'}: ${error}`}
        />
      ) : null}

      {isLoading ? (
        <LoadingState message="Chargement des utilisateurs..." />
      ) : (
        <DataTable
          data={filteredUsers}
          keyExtractor={(item) => item.id}
          columns={[
            {
              key: 'name',
              label: 'Utilisateur',
              render: (item) => (
                <div>
                  <p className="font-medium text-slate-800">{item.fullName}</p>
                  <p className="text-xs text-slate-500">{item.email}</p>
                </div>
              ),
            },
            { key: 'role', label: 'Role', render: (item) => item.role },
            {
              key: 'branch',
              label: 'Extension',
              render: (item) => branches.find((branch) => branch.id === item.branchId)?.name ?? 'Global',
            },
            {
              key: 'departments',
              label: 'Departements',
              render: (item) => (item.departmentIds.length > 0 ? item.departmentIds.length : '-'),
            },
            {
              key: 'status',
              label: 'Statut',
              render: (item) => (
                <span className={item.status === 'active' ? 'text-emerald-600' : 'text-rose-600'}>
                  {item.status}
                </span>
              ),
            },
            {
              key: 'actions',
              label: 'Actions',
              render: (item) => (
                <AppButton
                  size="sm"
                  variant="secondary"
                  onClick={() =>
                    setEditingUser({
                      id: item.id,
                      fullName: item.fullName,
                      role: item.role,
                      branchId: item.branchId,
                      departmentIds: [...item.departmentIds],
                    })
                  }
                >
                  Gerer
                </AppButton>
              ),
            },
          ]}
        />
      )}

      <Modal
        isOpen={Boolean(editingUser)}
        onClose={() => setEditingUser(null)}
        title={editingUser ? `Acces utilisateur - ${editingUser.fullName}` : 'Acces utilisateur'}
      >
        {editingUser ? (
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Role</label>
              <AppSelect
                value={editingUser.role}
                onChange={(event) =>
                  setEditingUser((current) =>
                    current
                      ? {
                          ...current,
                          role: event.target.value as Role,
                        }
                      : current,
                  )
                }
              >
                {roleOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </AppSelect>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Extension</label>
              <AppSelect
                value={editingUser.branchId}
                onChange={(event) =>
                  setEditingUser((current) =>
                    current
                      ? {
                          ...current,
                          branchId: event.target.value,
                          departmentIds: [],
                        }
                      : current,
                  )
                }
              >
                <option value="">Global / Non assigne</option>
                {branches.map((branch) => (
                  <option key={branch.id} value={branch.id}>
                    {branch.name}
                  </option>
                ))}
              </AppSelect>
            </div>

            <div>
              <p className="mb-2 text-sm font-medium text-slate-700">Departements</p>
              <div className="max-h-44 space-y-2 overflow-y-auto rounded-lg border border-slate-200 p-3">
                {editableDepartments.length === 0 ? (
                  <p className="text-sm text-slate-500">Aucun departement dans cette extension.</p>
                ) : (
                  editableDepartments.map((department) => (
                    <label key={department.id} className="flex items-center gap-2 text-sm text-slate-700">
                      <input
                        type="checkbox"
                        checked={editingUser.departmentIds.includes(department.id)}
                        onChange={(event) =>
                          setEditingUser((current) => {
                            if (!current) {
                              return current;
                            }

                            const selected = new Set(current.departmentIds);
                            if (event.target.checked) {
                              selected.add(department.id);
                            } else {
                              selected.delete(department.id);
                            }

                            return { ...current, departmentIds: Array.from(selected) };
                          })
                        }
                        className="size-4 rounded border-slate-300 text-cyan-600"
                      />
                      {department.name}
                    </label>
                  ))
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <AppButton variant="secondary" onClick={() => setEditingUser(null)}>
                Annuler
              </AppButton>
              <AppButton
                isLoading={isSaving}
                onClick={async () => {
                  const success = await saveUserAccess(editingUser.id, {
                    role: editingUser.role,
                    branchId: editingUser.branchId,
                    departmentIds: editingUser.departmentIds,
                  });

                  if (success) {
                    setEditingUser(null);
                  }
                }}
              >
                Enregistrer
              </AppButton>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}

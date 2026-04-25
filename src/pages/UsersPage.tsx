import { DataTable, EmptyState, LoadingState, PageHeader } from '@/components/common';
import { AppButton, AppInput, AppSelect, SearchInput } from '@/components/ui';
import { ConfirmDialog, Modal } from '@/components/ui/Modal';
import { useAuth } from '@/hooks/useAuth';
import { useUsersManagement } from '@/hooks/useUsersManagement';
import type { Role } from '@/types';
import { useMemo, useState } from 'react';

interface EditingUserState {
  id: string;
  fullName: string;
  email: string;
  role: Role;
  branchId: string;
  departmentIds: string[];
  newPassword: string;
}

interface NewUserState {
  fullName: string;
  email: string;
  password: string;
  role: Role;
  branchId: string;
  departmentIds: string[];
  primaryDepartmentId: string;
}

const initialNewUserState: NewUserState = {
  fullName: '',
  email: '',
  password: '',
  role: 'department_member',
  branchId: '',
  departmentIds: [],
  primaryDepartmentId: '',
};

const roleOptions: Array<{ value: Role; label: string }> = [
  { value: 'superadmin', label: 'Super Admin' },
  { value: 'admin', label: 'Admin' },
  { value: 'department_manager', label: 'Responsable Departement' },
  { value: 'department_member', label: 'Membre Departement' },
];

export function UsersPage() {
  const { user } = useAuth();
  const {
    users,
    branches,
    departments,
    isLoading,
    isSaving,
    isCreating,
    isDeleting,
    error,
    saveUserAccess,
    changeUserPassword,
    createUser,
    deleteUser,
  } =
    useUsersManagement();
  const [query, setQuery] = useState('');
  const [editingUser, setEditingUser] = useState<EditingUserState | null>(null);
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newUser, setNewUser] = useState<NewUserState>(initialNewUserState);
  const [editSuccess, setEditSuccess] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

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

  const creatableDepartments = newUser.branchId
    ? departments.filter((department) => department.branchId === newUser.branchId)
    : departments;
  const branchNameById = useMemo(() => new Map(branches.map((branch) => [branch.id, branch.name])), [branches]);
  const isDepartmentManagerRole = newUser.role === 'department_manager';
  const isSuperAdminRole = newUser.role === 'superadmin';
  const isGlobalAllowed = newUser.role === 'admin';
  const canSubmitCreateForm =
    Boolean(newUser.fullName.trim()) &&
    Boolean(newUser.email.trim()) &&
    newUser.password.trim().length >= 8 &&
    (isDepartmentManagerRole
      ? Boolean(newUser.branchId) && Boolean(newUser.primaryDepartmentId)
      : isSuperAdminRole
        ? Boolean(newUser.branchId) && newUser.departmentIds.length > 0
        : true);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Utilisateurs"
        description="Gestion des comptes, roles et affectations departementales."
        actions={
          <AppButton onClick={() => setIsCreateModalOpen(true)}>
            Nouvel utilisateur
          </AppButton>
        }
      >
        <SearchInput value={query} onChange={setQuery} placeholder="Rechercher un utilisateur..." />
      </PageHeader>

      {error ? (
        <EmptyState
          title="Donnees utilisateurs partielles"
          description={error}
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
                <div className="flex items-center gap-2">
                  <AppButton
                    size="sm"
                    variant="secondary"
                    onClick={() =>
                      setEditingUser({
                        id: item.id,
                        fullName: item.fullName,
                        email: item.email,
                        role: item.role,
                        branchId: item.branchId || (item.role === 'superadmin' ? branches[0]?.id || '' : ''),
                        departmentIds: [...item.departmentIds],
                        newPassword: '',
                      })
                    }
                  >
                    Modifier
                  </AppButton>
                  <AppButton
                    size="sm"
                    variant="danger"
                    disabled={item.id === user?.id}
                    onClick={() => setDeleteUserId(item.id)}
                  >
                    Supprimer
                  </AppButton>
                </div>
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
                          branchId:
                            event.target.value === 'superadmin'
                              ? (current.branchId || branches[0]?.id || '')
                              : current.branchId,
                          departmentIds:
                            event.target.value === 'superadmin' && current.departmentIds.length === 0
                              ? []
                              : current.departmentIds,
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
                          departmentIds:
                            current.role === 'superadmin'
                              ? current.departmentIds.filter((id) =>
                                  departments.some((department) => department.id === id && department.branchId === event.target.value),
                                )
                              : [],
                        }
                      : current,
                  )
                }
              >
                {editingUser.role !== 'superadmin' ? <option value="">Global / Non assigne</option> : null}
                {branches.map((branch) => (
                  <option key={branch.id} value={branch.id}>
                    {branch.name}
                  </option>
                ))}
              </AppSelect>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Nouveau mot de passe (optionnel)</label>
              <AppInput
                type="password"
                value={editingUser.newPassword}
                onChange={(event) =>
                  setEditingUser((current) =>
                    current
                      ? {
                          ...current,
                          newPassword: event.target.value,
                        }
                      : current,
                  )
                }
                placeholder="Laisser vide pour ne pas changer"
              />
            </div>

            <div>
              <p className="mb-2 text-sm font-medium text-slate-700">
                {editingUser.role === 'superadmin' ? 'Departement(s) de residence' : 'Departements'}
              </p>
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
              {editingUser.role === 'superadmin' ? (
                <p className="mt-2 text-xs text-sky-700">
                  Super Admin: visibilite globale sur toutes les extensions/departements, avec residence locale optionnelle.
                </p>
              ) : null}
            </div>

            <div className="flex justify-end gap-2">
              <AppButton variant="secondary" onClick={() => setEditingUser(null)}>
                Annuler
              </AppButton>
              <AppButton
                isLoading={isSaving}
                onClick={async () => {
                  setEditError(null);
                  if (editingUser.newPassword && editingUser.newPassword.length < 8) {
                    setEditError('Le mot de passe doit contenir au moins 8 caractères.');
                    return;
                  }

                  if (editingUser.role === 'superadmin' && !editingUser.branchId) {
                    setEditError('Le super admin doit avoir une extension de residence.');
                    return;
                  }

                  const success = await saveUserAccess(editingUser.id, {
                    role: editingUser.role,
                    branchId: editingUser.branchId,
                    departmentIds: editingUser.departmentIds,
                  });

                  if (!success) {
                    setEditError(error || "Erreur lors de l'enregistrement des droits utilisateur.");
                    return;
                  }

                  if (editingUser.newPassword) {
                    try {
                      const passwordUpdated = await changeUserPassword(editingUser.id, editingUser.newPassword);
                      if (!passwordUpdated) {
                        setEditError('Erreur lors de la modification du mot de passe.');
                        return;
                      }
                    } catch (err: unknown) {
                      const message =
                        err instanceof Error
                          ? err.message
                          : typeof err === 'object' && err !== null && 'message' in err
                          ? String((err as { message?: unknown }).message ?? '')
                          : '';
                      setEditError(message || 'Erreur lors de la modification du mot de passe.');
                      return;
                    }
                  }

                  if (success) {
                    setEditSuccess(true);
                    setTimeout(() => {
                      setEditSuccess(false);
                      setEditingUser(null);
                    }, 1500);
                  }
                }}
              >
                Enregistrer
              </AppButton>
            </div>
            {editSuccess && (
              <div className="rounded border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                Modifications enregistrées avec succès !
              </div>
            )}
            {editError && (
              <div className="rounded border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                {editError}
              </div>
            )}
          </div>
        ) : null}
      </Modal>

      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          setNewUser(initialNewUserState);
        }}
        title="Creer un utilisateur"
      >
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Nom complet</label>
            <AppInput
              value={newUser.fullName}
              onChange={(event) => setNewUser((current) => ({ ...current, fullName: event.target.value }))}
              placeholder="Ex: Jean Kasongo"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Email</label>
            <AppInput
              type="email"
              value={newUser.email}
              onChange={(event) => setNewUser((current) => ({ ...current, email: event.target.value }))}
              placeholder="Ex: jean.kasongo@eglise.org"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Mot de passe provisoire</label>
            <AppInput
              type="password"
              value={newUser.password}
              onChange={(event) => setNewUser((current) => ({ ...current, password: event.target.value }))}
              placeholder="Minimum 8 caracteres"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Role</label>
            <AppSelect
              value={newUser.role}
              onChange={(event) =>
                setNewUser((current) => {
                  const nextRole = event.target.value as Role;
                  if (nextRole === 'department_manager') {
                    const nextBranchId = current.branchId || branches[0]?.id || '';
                    return {
                      ...current,
                      role: nextRole,
                      branchId: nextBranchId,
                      departmentIds: [],
                      primaryDepartmentId: '',
                    };
                  }

                  return {
                    ...current,
                    role: nextRole,
                    branchId: nextRole === 'superadmin' ? (current.branchId || branches[0]?.id || '') : current.branchId,
                    departmentIds: nextRole === 'superadmin' ? [] : current.departmentIds,
                    primaryDepartmentId: '',
                  };
                })
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
              value={newUser.branchId}
              onChange={(event) =>
                setNewUser((current) => ({
                  ...current,
                  branchId: event.target.value,
                  departmentIds: [],
                  primaryDepartmentId: '',
                }))
              }
            >
              {isGlobalAllowed ? <option value="">Global / Non assigne</option> : null}
              {branches.map((branch) => (
                <option key={branch.id} value={branch.id}>
                  {branch.name}
                </option>
              ))}
            </AppSelect>
          </div>

          {isDepartmentManagerRole ? (
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Departement responsable</label>
              <AppSelect
                value={newUser.primaryDepartmentId}
                onChange={(event) =>
                  setNewUser((current) => {
                    const selectedDepartment = departments.find((department) => department.id === event.target.value);
                    return {
                      ...current,
                      primaryDepartmentId: event.target.value,
                      departmentIds: event.target.value ? [event.target.value] : [],
                      branchId: selectedDepartment?.branchId ?? current.branchId,
                    };
                  })
                }
              >
                <option value="">Selectionner un departement</option>
                {departments.map((department) => (
                  <option key={department.id} value={department.id}>
                    {department.name} {branchNameById.get(department.branchId) ? `(${branchNameById.get(department.branchId)})` : ''}
                  </option>
                ))}
              </AppSelect>
            </div>
          ) : (
            <div>
              <p className="mb-2 text-sm font-medium text-slate-700">
                {newUser.role === 'superadmin' ? 'Departement(s) de residence' : 'Departements'}
              </p>
              <div className="max-h-44 space-y-2 overflow-y-auto rounded-lg border border-slate-200 p-3">
                {creatableDepartments.length === 0 ? (
                  <p className="text-sm text-slate-500">Aucun departement dans cette extension.</p>
                ) : (
                  creatableDepartments.map((department) => (
                    <label key={department.id} className="flex items-center gap-2 text-sm text-slate-700">
                      <input
                        type="checkbox"
                        checked={newUser.departmentIds.includes(department.id)}
                        onChange={(event) =>
                          setNewUser((current) => {
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
              {newUser.role === 'superadmin' ? (
                <p className="mt-2 text-xs text-sky-700">
                  Super Admin: visibilite globale sur toutes les extensions/departements, avec affectation de residence locale.
                </p>
              ) : null}
            </div>
          )}

          <div className="rounded-lg border border-cyan-100 bg-cyan-50 px-3 py-2 text-xs text-cyan-800">
            Creation reservee a l'administration. Seul le super admin doit creer les comptes responsables.
          </div>
          {error ? (
            <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {error}
            </div>
          ) : null}

          <div className="flex justify-end gap-2">
            <AppButton
              variant="secondary"
              onClick={() => {
                setIsCreateModalOpen(false);
                setNewUser(initialNewUserState);
              }}
            >
              Annuler
            </AppButton>
            <AppButton
              isLoading={isCreating}
              disabled={!canSubmitCreateForm}
              onClick={async () => {
                const fullName = newUser.fullName.trim();
                const email = newUser.email.trim().toLowerCase();
                const password = newUser.password.trim();

                if (!fullName || !email || password.length < 8) {
                  return;
                }

                if (isDepartmentManagerRole && (!newUser.branchId || !newUser.primaryDepartmentId)) {
                  return;
                }
                if (newUser.role === 'superadmin' && (!newUser.branchId || newUser.departmentIds.length === 0)) {
                  return;
                }

                const success = await createUser({
                  fullName,
                  email,
                  password,
                  role: newUser.role,
                  branchId: newUser.branchId,
                  departmentIds: newUser.departmentIds,
                });

                if (success) {
                  setIsCreateModalOpen(false);
                  setNewUser(initialNewUserState);
                }
              }}
            >
              Creer le compte
            </AppButton>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={Boolean(deleteUserId)}
        title="Supprimer cet utilisateur ?"
        description="Cette action supprime le profil utilisateur et ses affectations departementales."
        onCancel={() => setDeleteUserId(null)}
        onConfirm={async () => {
          if (!deleteUserId) {
            return;
          }

          const ok = await deleteUser(deleteUserId);
          if (ok) {
            setDeleteUserId(null);
          }
        }}
        confirmLabel={isDeleting ? 'Suppression...' : 'Supprimer'}
      />
    </div>
  );
}

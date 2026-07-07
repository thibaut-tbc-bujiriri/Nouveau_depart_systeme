import { BranchAvatar, DataTable, EmptyState, LoadingState, PageHeader, StatCard } from '@/components/common';
import { AppButton, AppInput, FormFieldWrapper, PhotoUpload, SearchInput } from '@/components/ui';
import { ConfirmDialog, Modal } from '@/components/ui/Modal';
import { useAuth } from '@/hooks/useAuth';
import { useBranches } from '@/hooks/useBranches';
import { cn } from '@/lib/cn';
import { getActiveUsers, type ActiveUserOption } from '@/services/branches.service';
import { restrictBranchesByRole } from '@/utils/permissions';
import { uploadPhoto } from '@/utils/storage';
import { useEffect, useMemo, useState } from 'react';

interface BranchFormState {
  code: string;
  name: string;
  city: string;
  country: string;
  pastorName: string;
  isActive: boolean;
  avatarUrl?: string | null;
  pastorId: string;
}

const initialBranchForm: BranchFormState = {
  code: '',
  name: '',
  city: '',
  country: 'RDC',
  pastorName: '',
  isActive: true,
  avatarUrl: null,
  pastorId: '',
};

function buildBranchCode(name: string) {
  const parts = name
    .trim()
    .split(/[\s\-_]+/)
    .map((part) => part.replace(/[^a-zA-Z0-9]/g, ''))
    .filter(Boolean);

  const initials = parts.map((part) => part[0]?.toUpperCase() ?? '').join('');
  return initials ? `ECND-${initials}` : 'ECND-';
}

export function BranchesPage() {
  const { user } = useAuth();
  const {
    branches,
    isLoading,
    isMutating,
    error,
    createBranch,
    updateBranch,
    deleteBranch,
  } = useBranches();
  const [query, setQuery] = useState('');
  const [form, setForm] = useState<BranchFormState>(initialBranchForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null | undefined>(undefined);
  const [activeUsers, setActiveUsers] = useState<ActiveUserOption[]>([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    async function loadActiveUsers() {
      try {
        const users = await getActiveUsers();
        setActiveUsers(users);
      } catch (err) {
        console.error('Erreur lors du chargement des utilisateurs:', err);
      }
    }
    void loadActiveUsers();
  }, []);

  const scopedBranches = useMemo(() => {
    if (!user) {
      return [];
    }

    return restrictBranchesByRole(branches, user);
  }, [branches, user]);

  const branchManagerOptions = useMemo(() => {
    return activeUsers.filter(
      (u) =>
        u.role === 'admin' ||
        u.role === 'superadmin' ||
        u.id === form.pastorId,
    );
  }, [activeUsers, form.pastorId]);

  const filteredManagerOptions = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) {
      return branchManagerOptions;
    }
    return branchManagerOptions.filter((u) => u.fullName.toLowerCase().includes(q));
  }, [branchManagerOptions, searchQuery]);

  useEffect(() => {
    if (!isDropdownOpen) return;
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.custom-combobox-container')) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isDropdownOpen]);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) {
      return scopedBranches;
    }

    return scopedBranches.filter((branch) =>
      [branch.name, branch.city, branch.code].join(' ').toLowerCase().includes(normalized),
    );
  }, [query, scopedBranches]);

  const openCreateModal = () => {
    setEditingId(null);
    setPhotoFile(undefined);
    setForm(initialBranchForm);
    setIsDropdownOpen(false);
    setSearchQuery('');
    setIsModalOpen(true);
  };

  const openEditModal = (branch: (typeof scopedBranches)[number]) => {
    setEditingId(branch.id);
    setPhotoFile(undefined);
    setForm({
      code: branch.code,
      name: branch.name,
      city: branch.city,
      country: branch.country,
      pastorName: branch.pastorName,
      isActive: branch.isActive,
      avatarUrl: branch.avatarUrl,
      pastorId: (branch as any).pastorId || '',
    });
    setIsDropdownOpen(false);
    setSearchQuery('');
    setIsModalOpen(true);
  };

  const handleSubmit = async () => {
    if (!form.name.trim() || !form.code.trim()) {
      return;
    }

    let uploadedUrl = form.avatarUrl || null;
    if (photoFile) {
      try {
        uploadedUrl = await uploadPhoto(photoFile, 'branches');
      } catch (err) {
        return;
      }
    } else if (photoFile === null) {
      uploadedUrl = null;
    }

    const payload = {
      ...form,
      avatarUrl: uploadedUrl,
    };

    const ok = editingId
      ? await updateBranch(editingId, payload)
      : await createBranch(payload);

    if (ok) {
      setIsModalOpen(false);
      setForm(initialBranchForm);
      setEditingId(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) {
      return;
    }

    const ok = await deleteBranch(deleteId);
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
        title="Extensions"
        description="Gestion des extensions de l'eglise."
        actions={user.role === 'superadmin' ? <AppButton onClick={openCreateModal}>Ajouter une extension</AppButton> : undefined}
      >
        <SearchInput value={query} onChange={setQuery} placeholder="Rechercher une extension..." />
      </PageHeader>

      {error ? (
        <EmptyState
          title={error.toLowerCase().includes('fetch') || error.toLowerCase().includes('network') ? 'Connexion Supabase indisponible' : 'Operation impossible'}
          description={error}
        />
      ) : null}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard label="Total Extensions" value={String(scopedBranches.length)} />
        <StatCard
          label="Total Membres"
          value={String(scopedBranches.reduce((sum, branch) => sum + branch.memberCount, 0))}
        />
        <StatCard
          label="Departements"
          value={String(scopedBranches.reduce((sum, branch) => sum + branch.departmentCount, 0))}
        />
      </section>

      {isLoading ? (
        <LoadingState message="Chargement des extensions..." />
      ) : (
        <DataTable
          data={filtered}
          keyExtractor={(branch) => branch.id}
          columns={[
            { key: 'name', label: 'Nom', render: (branch) => <BranchAvatar name={branch.name} avatarUrl={branch.avatarUrl} size="md" /> },
            { key: 'city', label: 'Ville', render: (branch) => branch.city },
            { key: 'pastor', label: 'Responsable', render: (branch) => branch.pastorName },
            { key: 'members', label: 'Membres', render: (branch) => branch.memberCount },
            {
              key: 'status',
              label: 'Statut',
              render: (branch) => (
                <span className={branch.isActive ? 'text-emerald-600' : 'text-rose-600'}>
                  {branch.isActive ? 'Active' : 'Inactive'}
                </span>
              ),
            },
            {
              key: 'actions',
              label: 'Actions',
              render: (branch) => (
                <div className="flex gap-2">
                  <AppButton size="sm" variant="secondary" onClick={() => openEditModal(branch)}>
                    Modifier
                  </AppButton>
                  {user.role === 'superadmin' ? (
                    <AppButton size="sm" variant="danger" onClick={() => setDeleteId(branch.id)}>
                      Supprimer
                    </AppButton>
                  ) : null}
                </div>
              ),
            },
          ]}
        />
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingId ? 'Modifier extension' : 'Nouvelle extension'}
      >
        <div className="space-y-4">
          <FormFieldWrapper label="Code" required>
            <AppInput
              value={form.code}
              disabled
              onChange={() => undefined}
            />
          </FormFieldWrapper>
          <PhotoUpload
            value={form.avatarUrl}
            onChange={setPhotoFile}
            nameInitial={form.name || 'E'}
            label="Logo / Photo de l'extension"
          />
          <FormFieldWrapper label="Nom" required>
            <AppInput
              value={form.name}
              disabled={user.role !== 'superadmin'}
              onChange={(event) =>
                setForm((prev) => {
                  const nextName = event.target.value;
                  if (editingId) {
                    return { ...prev, name: nextName };
                  }

                  return {
                    ...prev,
                    name: nextName,
                    code: buildBranchCode(nextName),
                  };
                })
              }
            />
          </FormFieldWrapper>
          <div className="grid gap-4 md:grid-cols-2">
            <FormFieldWrapper label="Ville" required>
              <AppInput
                value={form.city}
                disabled={user.role !== 'superadmin'}
                onChange={(event) => setForm((prev) => ({ ...prev, city: event.target.value }))}
              />
            </FormFieldWrapper>
            <FormFieldWrapper label="Pays" required>
              <AppInput
                value={form.country}
                disabled={user.role !== 'superadmin'}
                onChange={(event) => setForm((prev) => ({ ...prev, country: event.target.value }))}
              />
            </FormFieldWrapper>
          </div>
          <FormFieldWrapper label="Responsable">
            {user.role === 'superadmin' ? (
              <div className="relative custom-combobox-container">
                <button
                  type="button"
                  onClick={() => setIsDropdownOpen((prev) => !prev)}
                  className="flex items-center justify-between w-full px-4 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-cyan-500 text-left cursor-pointer transition-all min-h-10"
                >
                  {(() => {
                    const selected = activeUsers.find((u) => u.id === form.pastorId);
                    if (selected) {
                      return (
                        <div className="flex items-center gap-2.5">
                          {selected.avatarUrl ? (
                            <img
                              src={selected.avatarUrl}
                              alt={selected.fullName}
                              className="size-6 rounded-full object-cover"
                            />
                          ) : (
                            <div className="size-6 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-semibold text-slate-500">
                              {selected.fullName.slice(0, 2).toUpperCase()}
                            </div>
                          )}
                          <span className="text-slate-800 font-medium">{selected.fullName}</span>
                        </div>
                      );
                    }
                    return <span className="text-slate-400">Sélectionner un responsable</span>;
                  })()}
                  <span className="pointer-events-none">
                    <svg className="size-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </span>
                </button>

                {isDropdownOpen && (
                  <div className="absolute z-[100] mt-1 w-full bg-white border border-slate-200/80 rounded-2xl shadow-xl p-2 max-h-64 overflow-y-auto transition-all duration-200 animate-in fade-in slide-in-from-top-1">
                    <input
                      type="text"
                      autoFocus
                      className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-cyan-500 mb-2 focus:ring-1 focus:ring-cyan-500/20"
                      placeholder="Rechercher un responsable..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                    />
                    <div className="space-y-0.5">
                      {filteredManagerOptions.length === 0 ? (
                        <div className="text-xs text-slate-400 p-3 text-center">Aucun responsable trouvé</div>
                      ) : (
                        filteredManagerOptions.map((item) => (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => {
                              setForm((prev) => ({
                                ...prev,
                                pastorId: item.id,
                                pastorName: item.fullName,
                              }));
                              setIsDropdownOpen(false);
                              setSearchQuery('');
                            }}
                            className={cn(
                              "flex items-center gap-3 w-full text-left px-3 py-2 text-sm rounded-xl hover:bg-slate-50 transition-colors",
                              form.pastorId === item.id ? "bg-cyan-50/60 text-cyan-600 font-semibold" : "text-slate-700 hover:text-slate-900"
                            )}
                          >
                            {item.avatarUrl ? (
                              <img
                                src={item.avatarUrl}
                                alt={item.fullName}
                                className="size-7 rounded-full object-cover border border-slate-100"
                              />
                            ) : (
                              <div className="size-7 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-semibold text-slate-500 border border-slate-200/60">
                                {item.fullName.slice(0, 2).toUpperCase()}
                              </div>
                            )}
                            <span>{item.fullName}</span>
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <AppInput
                value={form.pastorName || 'A definir'}
                disabled
              />
            )}
          </FormFieldWrapper>
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={form.isActive}
              disabled={user.role !== 'superadmin'}
              onChange={(event) => setForm((prev) => ({ ...prev, isActive: event.target.checked }))}
            />
            Extension active
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
        title="Supprimer cette extension ?"
        description="Cette action est irreversible et peut impacter les donnees liees."
        onCancel={() => setDeleteId(null)}
        onConfirm={handleDelete}
        confirmLabel={isMutating ? 'Suppression...' : 'Supprimer'}
      />
    </div>
  );
}

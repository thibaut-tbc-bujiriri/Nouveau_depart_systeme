import { BranchBadge, DataTable, EmptyState, LoadingState, PageHeader, StatCard } from '@/components/common';
import { AppButton, AppInput, FormFieldWrapper, SearchInput } from '@/components/ui';
import { ConfirmDialog, Modal } from '@/components/ui/Modal';
import { useAuth } from '@/hooks/useAuth';
import { useBranches } from '@/hooks/useBranches';
import { restrictBranchesByRole } from '@/utils/permissions';
import { useMemo, useState } from 'react';

interface BranchFormState {
  code: string;
  name: string;
  city: string;
  country: string;
  pastorName: string;
  isActive: boolean;
}

const initialBranchForm: BranchFormState = {
  code: '',
  name: '',
  city: '',
  country: 'RDC',
  pastorName: '',
  isActive: true,
};

export function BranchesPage() {
  const { user } = useAuth();
  const {
    branches,
    isLoading,
    isMutating,
    error,
    source,
    createBranch,
    updateBranch,
    deleteBranch,
  } = useBranches();
  const [query, setQuery] = useState('');
  const [form, setForm] = useState<BranchFormState>(initialBranchForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const scopedBranches = useMemo(() => {
    if (!user) {
      return [];
    }

    return restrictBranchesByRole(branches, user);
  }, [branches, user]);

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
    setForm(initialBranchForm);
    setIsModalOpen(true);
  };

  const openEditModal = (branch: (typeof scopedBranches)[number]) => {
    setEditingId(branch.id);
    setForm({
      code: branch.code,
      name: branch.name,
      city: branch.city,
      country: branch.country,
      pastorName: branch.pastorName,
      isActive: branch.isActive,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async () => {
    if (!form.name.trim() || !form.code.trim()) {
      return;
    }

    const ok = editingId
      ? await updateBranch(editingId, form)
      : await createBranch(form);

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
        actions={<AppButton onClick={openCreateModal}>Ajouter une extension</AppButton>}
      >
        <SearchInput value={query} onChange={setQuery} placeholder="Rechercher une extension..." />
      </PageHeader>

      {error ? (
        <EmptyState
          title="Connexion Supabase indisponible"
          description={`Affichage en mode ${source === 'mock' ? 'mock' : 'fallback'}: ${error}`}
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
            { key: 'name', label: 'Nom', render: (branch) => <BranchBadge branchName={branch.name} /> },
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
                  <AppButton size="sm" variant="danger" onClick={() => setDeleteId(branch.id)}>
                    Supprimer
                  </AppButton>
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
            <AppInput value={form.code} onChange={(event) => setForm((prev) => ({ ...prev, code: event.target.value }))} />
          </FormFieldWrapper>
          <FormFieldWrapper label="Nom" required>
            <AppInput value={form.name} onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))} />
          </FormFieldWrapper>
          <div className="grid gap-4 md:grid-cols-2">
            <FormFieldWrapper label="Ville" required>
              <AppInput value={form.city} onChange={(event) => setForm((prev) => ({ ...prev, city: event.target.value }))} />
            </FormFieldWrapper>
            <FormFieldWrapper label="Pays" required>
              <AppInput value={form.country} onChange={(event) => setForm((prev) => ({ ...prev, country: event.target.value }))} />
            </FormFieldWrapper>
          </div>
          <FormFieldWrapper label="Responsable">
            <AppInput
              value={form.pastorName}
              onChange={(event) => setForm((prev) => ({ ...prev, pastorName: event.target.value }))}
            />
          </FormFieldWrapper>
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={form.isActive}
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

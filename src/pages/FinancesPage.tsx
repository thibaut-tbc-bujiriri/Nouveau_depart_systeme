import { DataTable, EmptyState, LoadingState, PageHeader, StatCard } from '@/components/common';
import { AppButton, AppInput, AppSelect, FormFieldWrapper, AppCombobox } from '@/components/ui';
import { ConfirmDialog, Modal } from '@/components/ui/Modal';
import { useAuth } from '@/hooks/useAuth';
import { useBranches } from '@/hooks/useBranches';
import { useDepartments } from '@/hooks/useDepartments';
import { useFinancesData } from '@/hooks/useFinancesData';
import type { FinanceRecord } from '@/types';
import { formatCurrency, formatDate } from '@/utils/format';
import { restrictFinancesByRole } from '@/utils/permissions';
import { useMemo, useState } from 'react';

interface FinanceFormState {
  branchId: string;
  departmentId: string;
  type: FinanceRecord['type'];
  category: FinanceRecord['category'];
  amount: number;
  description: string;
  recordedAt: string;
}

const initialForm: FinanceFormState = {
  branchId: '',
  departmentId: '',
  type: 'income',
  category: 'offering',
  amount: 0,
  description: '',
  recordedAt: new Date().toISOString().slice(0, 10),
};

export function FinancesPage() {
  const { user } = useAuth();
  const { branches } = useBranches();
  const { departments } = useDepartments();
  const {
    finances,
    isLoading,
    isMutating,
    error,
    createFinanceRecord,
    updateFinanceRecord,
    deleteFinanceRecord,
  } = useFinancesData();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState<FinanceFormState>(initialForm);

  const role = user?.role;
  const branchId = user?.branchId ?? '';
  const scopedFinances = user ? restrictFinancesByRole(finances, user) : [];
  const income = scopedFinances
    .filter((record) => record.type === 'income')
    .reduce((sum, record) => sum + record.amount, 0);
  const expense = scopedFinances
    .filter((record) => record.type === 'expense')
    .reduce((sum, record) => sum + record.amount, 0);

  const scopedBranches = branches.filter((branch) => (role === 'superadmin' ? true : branch.id === branchId));
  const scopedDepartments = useMemo(
    () => departments.filter((department) => (form.branchId ? department.branchId === form.branchId : true)),
    [departments, form.branchId],
  );

  const branchOptions = useMemo(() =>
    scopedBranches.map((branch) => ({ value: branch.id, label: branch.name })),
    [scopedBranches]
  );

  const departmentOptions = useMemo(() => [
    { value: '', label: 'Aucun' },
    ...scopedDepartments.map((dept) => ({ value: dept.id, label: dept.name }))
  ], [scopedDepartments]);

  if (!user) {
    return null;
  }

  const openCreateModal = () => {
    setEditingId(null);
    setForm({
      ...initialForm,
      branchId: user.role === 'superadmin' ? '' : user.branchId,
    });
    setIsModalOpen(true);
  };

  const openEditModal = (record: FinanceRecord) => {
    setEditingId(record.id);
    setForm({
      branchId: record.branchId,
      departmentId: record.departmentId ?? '',
      type: record.type,
      category: record.category,
      amount: record.amount,
      description: record.description,
      recordedAt: record.recordedAt.slice(0, 10),
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async () => {
    if (!form.branchId || form.amount <= 0) {
      return;
    }

    const payload = {
      branchId: form.branchId,
      departmentId: form.departmentId || undefined,
      type: form.type,
      category: form.category,
      amount: form.amount,
      description: form.description,
      recordedAt: form.recordedAt,
    };

    const ok = editingId
      ? await updateFinanceRecord(editingId, payload)
      : await createFinanceRecord(payload);

    if (ok) {
      setIsModalOpen(false);
      setEditingId(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) {
      return;
    }

    const ok = await deleteFinanceRecord(deleteId);
    if (ok) {
      setDeleteId(null);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Finances"
        description="Suivi simplifie des entrees et sorties financieres."
        actions={<AppButton onClick={openCreateModal}>Nouvelle operation</AppButton>}
      />

      {error ? (
        <EmptyState
          title="Donnees financieres partielles"
          description={error}
        />
      ) : null}

      <section className="grid gap-4 md:grid-cols-3">
        <StatCard label="Revenus" value={formatCurrency(income)} trend="up" />
        <StatCard label="Depenses" value={formatCurrency(expense)} trend="down" />
        <StatCard label="Solde" value={formatCurrency(income - expense)} trend={income >= expense ? 'up' : 'down'} />
      </section>

      {isLoading ? (
        <LoadingState message="Chargement des finances..." />
      ) : (
        <DataTable
          data={scopedFinances}
          keyExtractor={(record) => record.id}
          columns={[
            { key: 'date', label: 'Date', render: (record) => formatDate(record.recordedAt) },
            {
              key: 'branch',
              label: 'Extension',
              render: (record) => branches.find((branch) => branch.id === record.branchId)?.name ?? 'N/A',
            },
            { key: 'category', label: 'Categorie', render: (record) => record.category },
            {
              key: 'type',
              label: 'Type',
              render: (record) => (
                <span className={record.type === 'income' ? 'text-emerald-600' : 'text-rose-600'}>
                  {record.type === 'income' ? 'Entree' : 'Sortie'}
                </span>
              ),
            },
            { key: 'amount', label: 'Montant', render: (record) => formatCurrency(record.amount) },
            {
              key: 'actions',
              label: 'Actions',
              render: (record) => (
                <div className="flex gap-2">
                  <AppButton size="sm" variant="secondary" onClick={() => openEditModal(record)}>
                    Modifier
                  </AppButton>
                  <AppButton size="sm" variant="danger" onClick={() => setDeleteId(record.id)}>
                    Supprimer
                  </AppButton>
                </div>
              ),
            },
          ]}
        />
      )}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingId ? 'Modifier operation' : 'Nouvelle operation'}>
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <FormFieldWrapper label="Extension" required>
              <AppCombobox
                value={form.branchId}
                onChange={(val) => setForm((prev) => ({ ...prev, branchId: val, departmentId: '' }))}
                options={branchOptions}
                disabled={user.role !== 'superadmin'}
              />
            </FormFieldWrapper>
            <FormFieldWrapper label="Departement (optionnel)">
              <AppCombobox
                value={form.departmentId}
                onChange={(val) => setForm((prev) => ({ ...prev, departmentId: val }))}
                options={departmentOptions}
              />
            </FormFieldWrapper>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <FormFieldWrapper label="Type" required>
              <AppSelect
                value={form.type}
                onChange={(event) => setForm((prev) => ({ ...prev, type: event.target.value as FinanceRecord['type'] }))}
              >
                <option value="income">Entree</option>
                <option value="expense">Sortie</option>
              </AppSelect>
            </FormFieldWrapper>
            <FormFieldWrapper label="Categorie" required>
              <AppSelect
                value={form.category}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, category: event.target.value as FinanceRecord['category'] }))
                }
              >
                <option value="offering">Offrande</option>
                <option value="tithe">Dime</option>
                <option value="donation">Contribution</option>
                <option value="salary">Salaire</option>
                <option value="logistics">Logistique</option>
                <option value="maintenance">Maintenance</option>
                <option value="other">Autre</option>
              </AppSelect>
            </FormFieldWrapper>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <FormFieldWrapper label="Montant" required>
              <AppInput
                type="number"
                min={0}
                value={String(form.amount)}
                onChange={(event) => setForm((prev) => ({ ...prev, amount: Number(event.target.value) || 0 }))}
              />
            </FormFieldWrapper>
            <FormFieldWrapper label="Date" required>
              <AppInput
                type="date"
                value={form.recordedAt}
                onChange={(event) => setForm((prev) => ({ ...prev, recordedAt: event.target.value }))}
              />
            </FormFieldWrapper>
          </div>

          <FormFieldWrapper label="Description">
            <AppInput
              value={form.description}
              onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
            />
          </FormFieldWrapper>

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
        title="Supprimer cette operation ?"
        description="Cette action est irreversible."
        onCancel={() => setDeleteId(null)}
        onConfirm={handleDelete}
        confirmLabel={isMutating ? 'Suppression...' : 'Supprimer'}
      />
    </div>
  );
}

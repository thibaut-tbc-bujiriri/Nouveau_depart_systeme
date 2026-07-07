import { DataTable, EmptyState, LoadingState, PageHeader } from '@/components/common';
import { AppButton, AppInput, AppSelect, AppTextarea, FormFieldWrapper, SearchInput } from '@/components/ui';
import { ConfirmDialog, Modal } from '@/components/ui/Modal';
import { useAuth } from '@/hooks/useAuth';
import { useBranches } from '@/hooks/useBranches';
import { useReportsData } from '@/hooks/useReportsData';
import type { Report } from '@/types';
import { hasModulePermission } from '@/lib/permissions';
import { formatDate } from '@/utils/format';
import { restrictReportsByRole } from '@/utils/permissions';
import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

interface ReportFormState {
  branchId: string;
  title: string;
  type: Report['type'];
  period: string;
  summary: string;
  generatedAt: string;
}

const initialForm: ReportFormState = {
  branchId: '',
  title: '',
  type: 'department',
  period: '',
  summary: '',
  generatedAt: new Date().toISOString().slice(0, 10),
};

export function ReportsPage() {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { branches } = useBranches();
  const { reports, isLoading, isMutating, error, createReport, updateReport, deleteReport } = useReportsData();
  const [query, setQuery] = useState('');
  const [form, setForm] = useState<ReportFormState>(initialForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const role = user?.role;
  const branchId = user?.branchId ?? '';
  const canCreate = user ? hasModulePermission(user.role, 'reports', 'create') : false;
  const canUpdate = user ? hasModulePermission(user.role, 'reports', 'update') : false;
  const canDelete = user ? hasModulePermission(user.role, 'reports', 'delete') : false;
  const scopedReports = useMemo(() => (user ? restrictReportsByRole(reports, user) : []), [reports, user]);
  const filteredReports = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) {
      return scopedReports;
    }

    return scopedReports.filter((report) =>
      [report.title, report.type, report.period].join(' ').toLowerCase().includes(normalized),
    );
  }, [query, scopedReports]);
  const scopedBranches = branches.filter((branch) => (role === 'superadmin' ? true : branch.id === branchId));

  if (!user) {
    return null;
  }

  const openCreateModal = () => {
    setEditingId(null);
    setForm({
      ...initialForm,
      branchId: user.role === 'superadmin' ? '' : user.branchId,
      period: `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`,
    });
    setIsModalOpen(true);
  };

  useEffect(() => {
    if (location.state && typeof location.state === 'object' && 'openCreate' in location.state && location.state.openCreate) {
      openCreateModal();
      navigate(location.pathname, { replace: true, state: null });
    }
  }, [location.pathname, location.state, navigate]);

  const openEditModal = (report: Report) => {
    setEditingId(report.id);
    setForm({
      branchId: report.branchId,
      title: report.title,
      type: report.type,
      period: report.period,
      summary: report.summary,
      generatedAt: report.generatedAt.slice(0, 10),
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async () => {
    if (!form.branchId || !form.title.trim()) {
      return;
    }

    const resolvedDepartmentId =
      user.role === 'department_manager' || user.role === 'department_member'
        ? (user.departmentIds[0] ?? undefined)
        : undefined;

    const payload = {
      branchId: form.branchId,
      departmentId: resolvedDepartmentId,
      title: form.title,
      type: form.type,
      period: form.period,
      summary: form.summary,
      generatedAt: form.generatedAt,
    };

    const ok = editingId ? await updateReport(editingId, payload) : await createReport(payload);
    if (ok) {
      setIsModalOpen(false);
      setEditingId(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) {
      return;
    }

    const ok = await deleteReport(deleteId);
    if (ok) {
      setDeleteId(null);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Rapports"
        description="Rapports operationnels et financiers exportables."
        actions={canCreate ? <AppButton onClick={openCreateModal}>Generer un rapport</AppButton> : undefined}
      >
        <SearchInput value={query} onChange={setQuery} placeholder="Rechercher un rapport..." />
      </PageHeader>

      {error ? (
        <EmptyState
          title="Donnees rapports partielles"
          description={error}
        />
      ) : null}

      {isLoading ? (
        <LoadingState message="Chargement des rapports..." />
      ) : (
        <DataTable
          data={filteredReports}
          keyExtractor={(report) => report.id}
          columns={[
            { key: 'title', label: 'Titre', render: (report) => report.title },
            {
              key: 'branch',
              label: 'Extension',
              render: (report) => branches.find((branch) => branch.id === report.branchId)?.name ?? 'N/A',
            },
            { key: 'type', label: 'Type', render: (report) => report.type },
            { key: 'period', label: 'Periode', render: (report) => report.period },
            { key: 'generatedAt', label: 'Date', render: (report) => formatDate(report.generatedAt) },
            {
              key: 'actions',
              label: 'Actions',
              render: (report) => {
                const showActions = canUpdate || canDelete;
                return showActions ? (
                  <div className="flex gap-2">
                    {canUpdate && (
                      <AppButton size="sm" variant="secondary" onClick={() => openEditModal(report)}>
                        Modifier
                      </AppButton>
                    )}
                    {canDelete && (
                      <AppButton size="sm" variant="danger" onClick={() => setDeleteId(report.id)}>
                        Supprimer
                      </AppButton>
                    )}
                  </div>
                ) : (
                  '-'
                );
              },
            },
          ]}
        />
      )}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingId ? 'Modifier rapport' : 'Nouveau rapport'}>
        <div className="space-y-4">
          <FormFieldWrapper label="Extension" required>
            <AppSelect
              value={form.branchId}
              onChange={(event) => setForm((prev) => ({ ...prev, branchId: event.target.value }))}
              disabled={user.role !== 'superadmin'}
            >
              <option value="">Selectionner</option>
              {scopedBranches.map((branch) => (
                <option key={branch.id} value={branch.id}>
                  {branch.name}
                </option>
              ))}
            </AppSelect>
          </FormFieldWrapper>

          <FormFieldWrapper label="Titre" required>
            <AppInput value={form.title} onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))} />
          </FormFieldWrapper>

          <div className="grid gap-4 md:grid-cols-2">
            <FormFieldWrapper label="Type">
              <AppSelect value={form.type} onChange={(event) => setForm((prev) => ({ ...prev, type: event.target.value as Report['type'] }))}>
                <option value="finance">Finance</option>
                <option value="attendance">Frequentation</option>
                <option value="department">Departement</option>
                <option value="members">Membres</option>
              </AppSelect>
            </FormFieldWrapper>
            <FormFieldWrapper label="Date generation">
              <AppInput
                type="date"
                value={form.generatedAt}
                onChange={(event) => setForm((prev) => ({ ...prev, generatedAt: event.target.value }))}
              />
            </FormFieldWrapper>
          </div>

          <FormFieldWrapper label="Periode">
            <AppInput value={form.period} onChange={(event) => setForm((prev) => ({ ...prev, period: event.target.value }))} />
          </FormFieldWrapper>

          <FormFieldWrapper label="Resume">
            <AppTextarea
              rows={4}
              value={form.summary}
              onChange={(event) => setForm((prev) => ({ ...prev, summary: event.target.value }))}
            />
          </FormFieldWrapper>

          {error ? (
            <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {error}
            </div>
          ) : null}

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
        title="Supprimer ce rapport ?"
        description="Cette action est irreversible."
        onCancel={() => setDeleteId(null)}
        onConfirm={handleDelete}
        confirmLabel={isMutating ? 'Suppression...' : 'Supprimer'}
      />
    </div>
  );
}

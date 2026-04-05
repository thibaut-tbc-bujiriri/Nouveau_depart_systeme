import { DataTable, EmptyState, LoadingState, PageHeader } from '@/components/common';
import { AppButton, AppInput, AppSelect, FormFieldWrapper, SearchInput } from '@/components/ui';
import { ConfirmDialog, Modal } from '@/components/ui/Modal';
import { useAuth } from '@/hooks/useAuth';
import { useBranches } from '@/hooks/useBranches';
import { useServicesData } from '@/hooks/useServicesData';
import type { Service } from '@/types';
import { formatDate } from '@/utils/format';
import { useMemo, useState } from 'react';

interface ServiceFormState {
  branchId: string;
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  preacher: string;
  attendance: number;
  type: Service['type'];
}

const initialForm: ServiceFormState = {
  branchId: '',
  title: '',
  date: new Date().toISOString().slice(0, 10),
  startTime: '09:00',
  endTime: '11:00',
  preacher: '',
  attendance: 0,
  type: 'sunday',
};

export function ServicesPage() {
  const { user } = useAuth();
  const { branches } = useBranches();
  const { services, isLoading, isMutating, error, source, createService, updateService, deleteService } = useServicesData();
  const [query, setQuery] = useState('');
  const [form, setForm] = useState<ServiceFormState>(initialForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const role = user?.role;
  const branchId = user?.branchId ?? '';
  const canManage = role === 'superadmin' || role === 'admin';
  const scopedServices = useMemo(
    () => services.filter((service) => (role === 'superadmin' ? true : service.branchId === branchId)),
    [branchId, role, services],
  );
  const filteredServices = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) {
      return scopedServices;
    }

    return scopedServices.filter((service) =>
      [service.title, service.preacher, service.type].join(' ').toLowerCase().includes(normalized),
    );
  }, [query, scopedServices]);
  const scopedBranches = branches.filter((branch) => (role === 'superadmin' ? true : branch.id === branchId));

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

  const openEditModal = (service: Service) => {
    setEditingId(service.id);
    setForm({
      branchId: service.branchId,
      title: service.title,
      date: service.date,
      startTime: service.startTime,
      endTime: service.endTime,
      preacher: service.preacher,
      attendance: service.attendance,
      type: service.type,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async () => {
    if (!form.branchId || !form.title.trim()) {
      return;
    }

    const payload = {
      branchId: form.branchId,
      title: form.title,
      date: form.date,
      startTime: form.startTime,
      endTime: form.endTime,
      preacher: form.preacher,
      attendance: form.attendance,
      type: form.type,
    };

    const ok = editingId ? await updateService(editingId, payload) : await createService(payload);
    if (ok) {
      setIsModalOpen(false);
      setEditingId(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) {
      return;
    }

    const ok = await deleteService(deleteId);
    if (ok) {
      setDeleteId(null);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Cultes / Services"
        description="Planification des cultes et suivi de la frequentation."
        actions={canManage ? <AppButton onClick={openCreateModal}>Programmer un service</AppButton> : undefined}
      >
        <SearchInput value={query} onChange={setQuery} placeholder="Rechercher un service..." />
      </PageHeader>

      {error ? (
        <EmptyState
          title="Donnees services partielles"
          description={`Mode ${source === 'mock' ? 'fallback mock' : 'supabase'}: ${error}`}
        />
      ) : null}

      {isLoading ? (
        <LoadingState message="Chargement des services..." />
      ) : (
        <DataTable
          data={filteredServices}
          keyExtractor={(service) => service.id}
          columns={[
            { key: 'title', label: 'Service', render: (service) => service.title },
            { key: 'date', label: 'Date', render: (service) => formatDate(service.date) },
            { key: 'time', label: 'Horaire', render: (service) => `${service.startTime} - ${service.endTime}` },
            {
              key: 'branch',
              label: 'Extension',
              render: (service) => branches.find((branch) => branch.id === service.branchId)?.name ?? 'N/A',
            },
            { key: 'attendance', label: 'Frequentation', render: (service) => service.attendance },
            {
              key: 'actions',
              label: 'Actions',
              render: (service) =>
                canManage ? (
                  <div className="flex gap-2">
                    <AppButton size="sm" variant="secondary" onClick={() => openEditModal(service)}>
                      Modifier
                    </AppButton>
                    <AppButton size="sm" variant="danger" onClick={() => setDeleteId(service.id)}>
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

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingId ? 'Modifier service' : 'Nouveau service'}
      >
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

          <div className="grid gap-4 md:grid-cols-3">
            <FormFieldWrapper label="Date" required>
              <AppInput type="date" value={form.date} onChange={(event) => setForm((prev) => ({ ...prev, date: event.target.value }))} />
            </FormFieldWrapper>
            <FormFieldWrapper label="Debut" required>
              <AppInput
                type="time"
                value={form.startTime}
                onChange={(event) => setForm((prev) => ({ ...prev, startTime: event.target.value }))}
              />
            </FormFieldWrapper>
            <FormFieldWrapper label="Fin" required>
              <AppInput type="time" value={form.endTime} onChange={(event) => setForm((prev) => ({ ...prev, endTime: event.target.value }))} />
            </FormFieldWrapper>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <FormFieldWrapper label="Predicateur">
              <AppInput
                value={form.preacher}
                onChange={(event) => setForm((prev) => ({ ...prev, preacher: event.target.value }))}
              />
            </FormFieldWrapper>
            <FormFieldWrapper label="Type">
              <AppSelect
                value={form.type}
                onChange={(event) => setForm((prev) => ({ ...prev, type: event.target.value as Service['type'] }))}
              >
                <option value="sunday">Dimanche</option>
                <option value="midweek">Milieu de semaine</option>
                <option value="prayer">Priere</option>
                <option value="special">Special</option>
              </AppSelect>
            </FormFieldWrapper>
          </div>

          <FormFieldWrapper label="Frequentation">
            <AppInput
              type="number"
              min={0}
              value={String(form.attendance)}
              onChange={(event) => setForm((prev) => ({ ...prev, attendance: Number(event.target.value) || 0 }))}
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
        title="Supprimer ce service ?"
        description="Cette action est irreversible."
        onCancel={() => setDeleteId(null)}
        onConfirm={handleDelete}
        confirmLabel={isMutating ? 'Suppression...' : 'Supprimer'}
      />
    </div>
  );
}

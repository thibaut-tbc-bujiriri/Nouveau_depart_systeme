import { DataTable, EmptyState, LoadingState, PageHeader } from '@/components/common';
import { AppButton, AppInput, AppSelect, FormFieldWrapper, SearchInput } from '@/components/ui';
import { ConfirmDialog, Modal } from '@/components/ui/Modal';
import { useAuth } from '@/hooks/useAuth';
import { useBranches } from '@/hooks/useBranches';
import { useDepartments } from '@/hooks/useDepartments';
import { useEventsData } from '@/hooks/useEventsData';
import type { Event } from '@/types';
import { hasModulePermission } from '@/lib/permissions';
import { formatDate } from '@/utils/format';
import { restrictEventsByRole } from '@/utils/permissions';
import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

interface EventFormState {
  branchId: string;
  title: string;
  date: string;
  location: string;
  status: Event['status'];
  expectedParticipants: number;
  organizerDepartmentId: string;
}

const initialForm: EventFormState = {
  branchId: '',
  title: '',
  date: new Date().toISOString().slice(0, 10),
  location: '',
  status: 'scheduled',
  expectedParticipants: 0,
  organizerDepartmentId: '',
};

export function EventsPage() {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { branches } = useBranches();
  const { departments } = useDepartments();
  const { events, isLoading, isMutating, error, createEvent, updateEvent, deleteEvent } = useEventsData();
  const [query, setQuery] = useState('');
  const [form, setForm] = useState<EventFormState>(initialForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const role = user?.role;
  const branchId = user?.branchId ?? '';
  const canCreate = user ? hasModulePermission(user.role, 'events', 'create') : false;
  const canUpdate = user ? hasModulePermission(user.role, 'events', 'update') : false;
  const canDelete = user ? hasModulePermission(user.role, 'events', 'delete') : false;
  const scopedEvents = useMemo(() => (user ? restrictEventsByRole(events, user) : []), [events, user]);
  const filteredEvents = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) {
      return scopedEvents;
    }

    return scopedEvents.filter((event) =>
      [event.title, event.location, event.status].join(' ').toLowerCase().includes(normalized),
    );
  }, [query, scopedEvents]);
  const scopedBranches = branches.filter((branch) => (role === 'superadmin' ? true : branch.id === branchId));
  const scopedDepartments = departments.filter((department) => (form.branchId ? department.branchId === form.branchId : true));

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

  useEffect(() => {
    if (location.state && typeof location.state === 'object' && 'openCreate' in location.state && location.state.openCreate) {
      openCreateModal();
      navigate(location.pathname, { replace: true, state: null });
    }
  }, [location.pathname, location.state, navigate]);

  const openEditModal = (event: Event) => {
    setEditingId(event.id);
    setForm({
      branchId: event.branchId,
      title: event.title,
      date: event.date,
      location: event.location,
      status: event.status,
      expectedParticipants: event.expectedParticipants,
      organizerDepartmentId: event.organizerDepartmentId ?? '',
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
      location: form.location,
      status: form.status,
      expectedParticipants: form.expectedParticipants,
      organizerDepartmentId: form.organizerDepartmentId || undefined,
    };

    const ok = editingId ? await updateEvent(editingId, payload) : await createEvent(payload);
    if (ok) {
      setIsModalOpen(false);
      setEditingId(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) {
      return;
    }

    const ok = await deleteEvent(deleteId);
    if (ok) {
      setDeleteId(null);
    }
  };

  const getStatusLabel = (status: Event['status']) => {
    if (status === 'draft') {
      return 'Brouillon';
    }
    if (status === 'completed') {
      return 'Termine';
    }
    return 'Planifie';
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Evenements"
        description="Suivi du calendrier des activites de l'eglise."
        actions={canCreate ? <AppButton onClick={openCreateModal}>Nouvel evenement</AppButton> : undefined}
      >
        <SearchInput value={query} onChange={setQuery} placeholder="Rechercher un evenement..." />
      </PageHeader>

      {error ? (
        <EmptyState
          title="Donnees evenements partielles"
          description={error}
        />
      ) : null}

      {isLoading ? (
        <LoadingState message="Chargement des evenements..." />
      ) : (
        <DataTable
          data={filteredEvents}
          keyExtractor={(event) => event.id}
          columns={[
            { key: 'title', label: 'Evenement', render: (event) => event.title },
            {
              key: 'branch',
              label: 'Extension',
              render: (event) => branches.find((branch) => branch.id === event.branchId)?.name ?? 'N/A',
            },
            { key: 'date', label: 'Date', render: (event) => formatDate(event.date) },
            { key: 'location', label: 'Lieu', render: (event) => event.location },
            {
              key: 'status',
              label: 'Statut',
              render: (event) => (
                <span className={event.status === 'scheduled' ? 'text-emerald-600' : 'text-slate-600'}>
                  {getStatusLabel(event.status)}
                </span>
              ),
            },
            {
              key: 'actions',
              label: 'Actions',
              render: (event) => {
                const showActions = canUpdate || canDelete;
                return showActions ? (
                  <div className="flex gap-2">
                    {canUpdate && (
                      <AppButton size="sm" variant="secondary" onClick={() => openEditModal(event)}>
                        Modifier
                      </AppButton>
                    )}
                    {canDelete && (
                      <AppButton size="sm" variant="danger" onClick={() => setDeleteId(event.id)}>
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

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingId ? 'Modifier evenement' : 'Nouvel evenement'}
      >
        <div className="space-y-4">
          <FormFieldWrapper label="Extension" required>
            <AppSelect
              value={form.branchId}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  branchId: event.target.value,
                  organizerDepartmentId: '',
                }))
              }
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
            <FormFieldWrapper label="Date" required>
              <AppInput type="date" value={form.date} onChange={(event) => setForm((prev) => ({ ...prev, date: event.target.value }))} />
            </FormFieldWrapper>
            <FormFieldWrapper label="Lieu">
              <AppInput
                value={form.location}
                onChange={(event) => setForm((prev) => ({ ...prev, location: event.target.value }))}
              />
            </FormFieldWrapper>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <FormFieldWrapper label="Statut">
              <AppSelect value={form.status} onChange={(event) => setForm((prev) => ({ ...prev, status: event.target.value as Event['status'] }))}>
                <option value="draft">Brouillon</option>
                <option value="scheduled">Planifie</option>
                <option value="completed">Termine</option>
              </AppSelect>
            </FormFieldWrapper>
            <FormFieldWrapper label="Participants attendus">
              <AppInput
                type="number"
                min={0}
                value={String(form.expectedParticipants)}
                onChange={(event) => setForm((prev) => ({ ...prev, expectedParticipants: Number(event.target.value) || 0 }))}
              />
            </FormFieldWrapper>
          </div>

          <FormFieldWrapper label="Departement organisateur">
            <AppSelect
              value={form.organizerDepartmentId}
              onChange={(event) => setForm((prev) => ({ ...prev, organizerDepartmentId: event.target.value }))}
            >
              <option value="">Aucun</option>
              {scopedDepartments.map((department) => (
                <option key={department.id} value={department.id}>
                  {department.name}
                </option>
              ))}
            </AppSelect>
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
        title="Supprimer cet evenement ?"
        description="Cette action est irreversible."
        onCancel={() => setDeleteId(null)}
        onConfirm={handleDelete}
        confirmLabel={isMutating ? 'Suppression...' : 'Supprimer'}
      />
    </div>
  );
}

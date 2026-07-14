import { Avatar, DataTable, EmptyState, LoadingState, PageHeader } from '@/components/common';
import { AppButton, AppCombobox, AppInput, AppSelect, AppTextarea, FormFieldWrapper, SearchInput } from '@/components/ui';
import { ConfirmDialog, Modal } from '@/components/ui/Modal';
import { useAuth } from '@/hooks/useAuth';
import { useBranches } from '@/hooks/useBranches';
import { hasModulePermission } from '@/lib/permissions';
import {
  createTeachingProgram,
  createTeachingProgramSession,
  deleteTeachingProgram,
  deleteTeachingProgramSession,
  getActiveAnnualTheme,
  getAnnualThemes,
  getTeachingPersonOptions,
  getTeachingPrograms,
  updateTeachingProgram,
  updateTeachingProgramSession,
  type AnnualTheme,
  type PersonOption,
  type TeachingProgram,
  type TeachingProgramInput,
  type TeachingProgramSession,
  type TeachingProgramSessionInput,
  type TeachingProgramStatus,
} from '@/services/teachingPrograms.service';
import { formatDate } from '@/utils/format';
import { CalendarPlus, ChevronDown, Edit, FileText, MoreVertical, Plus, Search, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';

const monthNames = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
];

const statusLabels: Record<TeachingProgramStatus, string> = {
  draft: 'Brouillon',
  published: 'Publié',
  archived: 'Archivé',
};

const currentDate = new Date();

const baseProgramForm: TeachingProgramInput = {
  extensionId: '',
  annualThemeId: '',
  month: currentDate.getMonth() + 1,
  year: currentDate.getFullYear(),
  subtheme: '',
  officeName: 'Bureau des Enseignements',
  signatoryUserId: null,
  signatoryName: '',
  signatoryTitle: 'Pasteur Responsable',
  status: 'draft',
};

const baseSessionForm: TeachingProgramSessionInput = {
  programId: '',
  sessionDate: currentDate.toISOString().slice(0, 10),
  activityType: 'Enseignement',
  speakerUserId: null,
  speakerName: '',
  officiantUserId: null,
  officiantName: '',
  startTime: '',
  endTime: '',
  durationMinutes: 50,
  notes: '',
  sortOrder: 0,
};

function isDateInProgramMonth(dateValue: string, program: Pick<TeachingProgramInput, 'month' | 'year'>) {
  if (!dateValue) return false;
  const date = new Date(`${dateValue}T00:00:00`);
  return date.getFullYear() === Number(program.year) && date.getMonth() + 1 === Number(program.month);
}

function optionValue(option: PersonOption) {
  return `${option.source}:${option.id}`;
}

function resolveSelectedPerson(value: string, options: PersonOption[]) {
  return options.find((option) => optionValue(option) === value) ?? null;
}

interface PersonPickerProps {
  value: string;
  options: PersonOption[];
  onChange: (value: string) => void;
}

function PersonPicker({ value, options, onChange }: PersonPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const selected = resolveSelectedPerson(value, options);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredOptions = options.filter((option) => option.label.toLowerCase().includes(search.trim().toLowerCase()));

  const handleSelect = (nextValue: string) => {
    onChange(nextValue);
    setIsOpen(false);
    setSearch('');
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex h-10 w-full items-center justify-between rounded-lg border border-slate-200 bg-white px-3 text-left text-sm text-slate-800 outline-none transition hover:bg-slate-50 focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
      >
        <span className="flex min-w-0 items-center gap-2">
          {selected ? <Avatar name={selected.label} avatarUrl={selected.avatarUrl} size="sm" /> : <span className="grid size-7 place-items-center rounded-full bg-slate-100 text-xs font-bold text-slate-500">?</span>}
          <span className="min-w-0 truncate">{selected ? selected.label : 'Saisie manuelle / externe'}</span>
        </span>
        <ChevronDown className="size-4 shrink-0 text-slate-400" />
      </button>

      {isOpen ? (
        <div className="absolute z-50 mt-1 max-h-72 w-full overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg">
          <div className="flex items-center gap-2 border-b border-slate-100 bg-slate-50 px-3 py-2">
            <Search className="size-4 shrink-0 text-slate-400" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Rechercher..."
              className="w-full bg-transparent text-xs text-slate-800 outline-none placeholder:text-slate-400"
              autoFocus
            />
          </div>
          <div className="max-h-56 overflow-y-auto py-1">
            <button
              type="button"
              onClick={() => handleSelect('')}
              className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-xs font-semibold text-teal-700 hover:bg-teal-50"
            >
              <span className="grid size-8 place-items-center rounded-full bg-teal-50 text-teal-700">+</span>
              Saisie manuelle / externe
            </button>
            {filteredOptions.length === 0 ? (
              <div className="px-3 py-4 text-center text-xs text-slate-400">Aucun résultat</div>
            ) : filteredOptions.map((option) => (
              <button
                key={`${option.source}:${option.id}`}
                type="button"
                onClick={() => handleSelect(optionValue(option))}
                className="flex w-full items-center gap-2 px-3 py-2.5 text-left hover:bg-slate-50"
              >
                <Avatar name={option.label} avatarUrl={option.avatarUrl} size="sm" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-xs font-semibold text-slate-800">{option.label}</span>
                  <span className="block text-[10px] uppercase tracking-wide text-slate-400">{option.source === 'profile' ? 'Utilisateur' : 'Membre'}</span>
                </span>
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function TeachingProgramsPage() {
  const { user } = useAuth();
  const { branches } = useBranches();
  const [programs, setPrograms] = useState<TeachingProgram[]>([]);
  const [themes, setThemes] = useState<AnnualTheme[]>([]);
  const [people, setPeople] = useState<PersonOption[]>([]);
  const [selectedProgramId, setSelectedProgramId] = useState<string>('');
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [programForm, setProgramForm] = useState<TeachingProgramInput>(baseProgramForm);
  const [editingProgram, setEditingProgram] = useState<TeachingProgram | null>(null);
  const [isProgramModalOpen, setIsProgramModalOpen] = useState(false);
  const [programToDelete, setProgramToDelete] = useState<TeachingProgram | null>(null);
  const [viewingProgram, setViewingProgram] = useState<TeachingProgram | null>(null);
  const [openProgramActionsId, setOpenProgramActionsId] = useState<string | null>(null);
  const [programActionsMenuPosition, setProgramActionsMenuPosition] = useState<{ top: number; left: number } | null>(null);

  const [sessionForm, setSessionForm] = useState<TeachingProgramSessionInput>(baseSessionForm);
  const [speakerSelection, setSpeakerSelection] = useState('');
  const [officiantSelection, setOfficiantSelection] = useState('');
  const [editingSession, setEditingSession] = useState<TeachingProgramSession | null>(null);
  const [isSessionModalOpen, setIsSessionModalOpen] = useState(false);
  const [sessionToDelete, setSessionToDelete] = useState<TeachingProgramSession | null>(null);

  const canCreate = user ? hasModulePermission(user.role, 'teaching-programs', 'create') : false;
  const canUpdate = user ? hasModulePermission(user.role, 'teaching-programs', 'update') : false;
  const canDelete = user ? hasModulePermission(user.role, 'teaching-programs', 'delete') : false;
  const canManage = canCreate || canUpdate || canDelete;

  const branchOptions = useMemo(() => {
    const scoped = user?.role === 'superadmin' ? branches : branches.filter((branch) => branch.id === user?.branchId);
    return scoped.map((branch) => ({ value: branch.id, label: branch.name }));
  }, [branches, user?.branchId, user?.role]);

  const themeOptions = useMemo(
    () => themes.map((theme) => ({ value: theme.id, label: `${theme.year} - ${theme.title}${theme.isActive ? ' (actif)' : ''}` })),
    [themes],
  );

  const filteredPrograms = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return programs.filter((program) => {
      if (!normalized) return true;
      return [program.subtheme, program.officeName, program.signatoryName, program.branch?.name, program.annualTheme?.title]
        .join(' ')
        .toLowerCase()
        .includes(normalized);
    });
  }, [programs, query]);

  const selectedProgram = useMemo(
    () => programs.find((program) => program.id === selectedProgramId) ?? filteredPrograms[0] ?? null,
    [filteredPrograms, programs, selectedProgramId],
  );

  const loadAll = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [programRows, themeRows] = await Promise.all([getTeachingPrograms(), getAnnualThemes()]);
      setPrograms(programRows);
      setThemes(themeRows);
      if (!selectedProgramId && programRows[0]) setSelectedProgramId(programRows[0].id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Impossible de charger les programmes.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadAll();
  }, []);
  useEffect(() => {
    void getTeachingPersonOptions().then(setPeople).catch(() => setPeople([]));
  }, []);

  useEffect(() => {
    const closeActionsMenu = () => {
      setOpenProgramActionsId(null);
      setProgramActionsMenuPosition(null);
    };
    document.addEventListener('click', closeActionsMenu);
    return () => document.removeEventListener('click', closeActionsMenu);
  }, []);


  useEffect(() => {
    if (programForm.year) {
      void getActiveAnnualTheme(Number(programForm.year)).then((theme) => {
        if (theme) setProgramForm((prev) => ({ ...prev, annualThemeId: theme.id }));
      }).catch(() => undefined);
    }
  }, [programForm.year]);

  const openCreateProgram = () => {
    const year = currentDate.getFullYear();
    const active = themes.find((theme) => theme.year === year && theme.isActive);
    setEditingProgram(null);
    setProgramForm({
      ...baseProgramForm,
      extensionId: user?.role === 'superadmin' ? (branchOptions[0]?.value ?? '') : (user?.branchId ?? ''),
      year,
      annualThemeId: active?.id ?? '',
    });
    setError(null);
    setIsProgramModalOpen(true);
  };

  const openEditProgram = (program: TeachingProgram) => {
    setEditingProgram(program);
    setProgramForm({
      extensionId: program.extensionId,
      annualThemeId: program.annualThemeId,
      month: program.month,
      year: program.year,
      subtheme: program.subtheme,
      officeName: program.officeName,
      signatoryUserId: program.signatoryUserId,
      signatoryName: program.signatoryName,
      signatoryTitle: program.signatoryTitle,
      status: program.status,
    });
    setError(null);
    setIsProgramModalOpen(true);
  };

  const handleProgramSave = async () => {
    if (!user) return;
    if (!programForm.extensionId || !programForm.annualThemeId || !programForm.subtheme.trim() || !programForm.signatoryName.trim()) {
      setError("Veuillez remplir l'extension, le thème annuel, le sous-thème et le signataire.");
      return;
    }
    if (user.role !== 'superadmin' && programForm.extensionId !== user.branchId) {
      setError('Vous ne pouvez gérer que le programme de votre extension.');
      return;
    }

    setIsSaving(true);
    setError(null);
    try {
      if (editingProgram) {
        await updateTeachingProgram(editingProgram.id, programForm);
      } else {
        const created = await createTeachingProgram(programForm, user.id);
        setSelectedProgramId(created.id);
      }
      setIsProgramModalOpen(false);
      setEditingProgram(null);
      await loadAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Enregistrement impossible.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleProgramDelete = async () => {
    if (!programToDelete) return;
    setIsSaving(true);
    setError(null);
    try {
      await deleteTeachingProgram(programToDelete.id);
      setProgramToDelete(null);
      setSelectedProgramId('');
      await loadAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Suppression impossible.');
    } finally {
      setIsSaving(false);
    }
  };

  const openCreateSession = () => {
    if (!selectedProgram) return;
    const firstDay = `${selectedProgram.year}-${String(selectedProgram.month).padStart(2, '0')}-01`;
    setEditingSession(null);
    setSpeakerSelection('');
    setOfficiantSelection('');
    setSessionForm({ ...baseSessionForm, programId: selectedProgram.id, sessionDate: firstDay, sortOrder: selectedProgram.sessions.length + 1 });
    setError(null);
    setIsSessionModalOpen(true);
  };

  const openEditSession = (session: TeachingProgramSession) => {
    setEditingSession(session);
    setSpeakerSelection(session.speakerUserId ? `profile:${session.speakerUserId}` : '');
    setOfficiantSelection(session.officiantUserId ? `profile:${session.officiantUserId}` : '');
    setSessionForm({
      programId: session.programId,
      sessionDate: session.sessionDate,
      activityType: session.activityType,
      speakerUserId: session.speakerUserId,
      speakerName: session.speakerName,
      officiantUserId: session.officiantUserId,
      officiantName: session.officiantName,
      startTime: session.startTime || '',
      endTime: session.endTime || '',
      durationMinutes: session.durationMinutes,
      notes: session.notes || '',
      sortOrder: session.sortOrder,
    });
    setError(null);
    setIsSessionModalOpen(true);
  };

  const handlePersonChange = (value: string, target: 'speaker' | 'officiant') => {
    const selected = resolveSelectedPerson(value, people);
    const userId = selected?.source === 'profile' ? selected.id : null;
    if (target === 'speaker') {
      setSpeakerSelection(value);
      setSessionForm((prev) => ({ ...prev, speakerUserId: userId, speakerName: selected?.label ?? '' }));
    } else {
      setOfficiantSelection(value);
      setSessionForm((prev) => ({ ...prev, officiantUserId: userId, officiantName: selected?.label ?? '' }));
    }
  };

  const handleSessionSave = async () => {
    if (!selectedProgram) return;
    if (!sessionForm.sessionDate || !sessionForm.activityType.trim() || !sessionForm.speakerName.trim() || !sessionForm.officiantName.trim()) {
      setError("Veuillez remplir la date, le type d'activité, l'orateur et l'officiant.");
      return;
    }
    if (!isDateInProgramMonth(sessionForm.sessionDate, selectedProgram)) {
      setError('La date de la séance doit appartenir au mois du programme.');
      return;
    }

    setIsSaving(true);
    setError(null);
    try {
      if (editingSession) {
        await updateTeachingProgramSession(editingSession.id, sessionForm);
      } else {
        await createTeachingProgramSession(sessionForm);
      }
      setIsSessionModalOpen(false);
      setEditingSession(null);
      await loadAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Enregistrement de la séance impossible.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSessionDelete = async () => {
    if (!sessionToDelete) return;
    setIsSaving(true);
    setError(null);
    try {
      await deleteTeachingProgramSession(sessionToDelete.id);
      setSessionToDelete(null);
      await loadAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Suppression de la séance impossible.');
    } finally {
      setIsSaving(false);
    }
  };

  if (!user) return null;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Programme des enseignements"
        description="Planification mensuelle des enseignements par extension."
        actions={
          canCreate ? (
            <AppButton onClick={openCreateProgram}>
              <Plus className="size-4" /> Nouveau programme
            </AppButton>
          ) : null
        }
      />

      {error ? <EmptyState title="Information" description={error} /> : null}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
        <div className="space-y-4">
          <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
            <SearchInput value={query} onChange={setQuery} placeholder="Rechercher un programme..." />
            <p className="text-sm font-semibold text-slate-500">{filteredPrograms.length} programme(s)</p>
          </div>

          {isLoading ? (
            <LoadingState message="Chargement des programmes..." />
          ) : (
            <DataTable
              data={filteredPrograms}
              keyExtractor={(program) => program.id}
              emptyMessage="Aucune donnée. Aucun programme n'est configuré pour votre périmètre."
              columns={[
                { key: 'period', label: 'Période', render: (program) => <button className="font-bold text-teal-700 hover:text-teal-900" onClick={() => setSelectedProgramId(program.id)}>{monthNames[program.month - 1]} {program.year}</button> },
                { key: 'branch', label: 'Extension', render: (program) => program.branch?.name || 'Aucune donnée' },
                { key: 'theme', label: 'Thème annuel', render: (program) => program.annualTheme?.title || 'Aucune donnée' },
                { key: 'subtheme', label: 'Sous-thème', render: (program) => program.subtheme },
                { key: 'sessions', label: 'Séances', render: (program) => program.sessions.length || 0 },
                { key: 'status', label: 'Statut', render: (program) => <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-700">{statusLabels[program.status]}</span> },
                {
                  key: 'actions',
                  label: 'Actions',
                  render: (program) => (
                    <div className="inline-flex justify-end" onClick={(event) => event.stopPropagation()}>
                      <button
                        type="button"
                        onClick={(event) => {
                          const rect = event.currentTarget.getBoundingClientRect();
                          setOpenProgramActionsId((current) => current === program.id ? null : program.id);
                          setProgramActionsMenuPosition({
                            top: rect.bottom + 6,
                            left: Math.max(12, rect.right - 176),
                          });
                        }}
                        className="grid size-9 place-items-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
                        aria-label="Actions du programme"
                      >
                        <MoreVertical className="size-5" />
                      </button>

                      {openProgramActionsId === program.id ? (
                        <div className="fixed z-[9999] w-44 overflow-hidden rounded-lg border border-slate-200 bg-white py-1 shadow-xl" style={programActionsMenuPosition ?? undefined}>
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              setSelectedProgramId(program.id);
                              setViewingProgram(program);
                              setOpenProgramActionsId(null);
                              setProgramActionsMenuPosition(null);
                            }}
                            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm font-medium text-slate-700 hover:bg-slate-50"
                          >
                            <FileText className="size-4 text-slate-500" /> Ouvrir
                          </button>
                          {canUpdate ? (
                            <button
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation();
                                openEditProgram(program);
                                setOpenProgramActionsId(null);
                                setProgramActionsMenuPosition(null);
                              }}
                              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm font-medium text-slate-700 hover:bg-slate-50"
                            >
                              <Edit className="size-4 text-slate-500" /> Modifier
                            </button>
                          ) : null}
                          {canDelete ? (
                            <button
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation();
                                setProgramToDelete(program);
                                setOpenProgramActionsId(null);
                                setProgramActionsMenuPosition(null);
                              }}
                              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm font-medium text-rose-600 hover:bg-rose-50"
                            >
                              <Trash2 className="size-4" /> Supprimer
                            </button>
                          ) : null}
                        </div>
                      ) : null}
                    </div>
                  ),
                },
              ]}
            />
          )}
        </div>

        <aside className="space-y-4">
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            {selectedProgram ? (
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Programme sélectionné</p>
                    <h2 className="mt-1 text-lg font-black text-slate-900">{monthNames[selectedProgram.month - 1]} {selectedProgram.year}</h2>
                  </div>
                  <span className="rounded-full bg-teal-50 px-2.5 py-1 text-xs font-bold text-teal-700">{statusLabels[selectedProgram.status]}</span>
                </div>
                <div className="space-y-2 text-sm text-slate-700">
                  <p><span className="font-semibold text-slate-500">Extension :</span> {selectedProgram.branch?.name || 'Aucune donnée'}</p>
                  <p><span className="font-semibold text-slate-500">Thème :</span> {selectedProgram.annualTheme ? `${selectedProgram.year}, ${selectedProgram.annualTheme.title}` : 'Aucune donnée'}</p>
                  <p><span className="font-semibold text-slate-500">Sous-thème :</span> {selectedProgram.subtheme}</p>
                  <p><span className="font-semibold text-slate-500">Bureau :</span> {selectedProgram.officeName}</p>
                  <p><span className="font-semibold text-slate-500">Signataire :</span> {selectedProgram.signatoryName}, {selectedProgram.signatoryTitle}</p>
                </div>
                {canManage ? (
                  <AppButton onClick={openCreateSession} className="w-full" variant="secondary">
                    <CalendarPlus className="size-4" /> Ajouter une séance
                  </AppButton>
                ) : null}
              </div>
            ) : (
              <p className="text-sm text-slate-500">Aucune donnée. Sélectionnez ou créez un programme.</p>
            )}
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-black uppercase tracking-wide text-slate-600">Séances</h3>
              <span className="text-xs font-bold text-slate-400">{selectedProgram?.sessions.length ?? 0}</span>
            </div>
            <div className="space-y-2">
              {selectedProgram?.sessions.length ? selectedProgram.sessions.map((session) => (
                <div key={session.id} className="rounded-lg border border-slate-100 bg-slate-50 p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-bold text-slate-900">{formatDate(session.sessionDate)} · {session.activityType}</p>
                      <p className="text-xs text-slate-600">Orateur : {session.speakerName}</p>
                      <p className="text-xs text-slate-600">Officiant : {session.officiantName}</p>
                      <p className="text-xs font-semibold text-slate-500">{session.startTime && session.endTime ? `${session.startTime.slice(0, 5)} - ${session.endTime.slice(0, 5)}` : session.durationMinutes ? `${session.durationMinutes} min` : 'Aucune donnée'}</p>
                    </div>
                    {canManage ? (
                      <div className="flex gap-1">
                        <button className="rounded-md p-1.5 text-slate-500 hover:bg-white hover:text-slate-900" onClick={() => openEditSession(session)}><Edit className="size-4" /></button>
                        <button className="rounded-md p-1.5 text-rose-500 hover:bg-white hover:text-rose-700" onClick={() => setSessionToDelete(session)}><Trash2 className="size-4" /></button>
                      </div>
                    ) : null}
                  </div>
                </div>
              )) : <p className="py-6 text-center text-sm text-slate-500">Aucune donnée. Aucune séance enregistrée.</p>}
            </div>
          </div>
        </aside>
      </div>

      <Modal
        isOpen={!!viewingProgram}
        onClose={() => setViewingProgram(null)}
        title={viewingProgram ? `${monthNames[viewingProgram.month - 1]} ${viewingProgram.year}` : 'Programme'}
        className="max-w-4xl"
      >
        {viewingProgram ? (
          <div className="space-y-5">
            <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Programme des enseignements</p>
                <h3 className="mt-1 text-xl font-black text-slate-900">{monthNames[viewingProgram.month - 1]} {viewingProgram.year}</h3>
                <p className="mt-1 text-sm text-slate-600">{viewingProgram.branch?.name || 'Aucune donnée'}</p>
              </div>
              <span className="w-fit rounded-full bg-teal-50 px-3 py-1 text-xs font-bold text-teal-700">{statusLabels[viewingProgram.status]}</span>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Thème annuel</p>
                <p className="mt-1 text-sm font-semibold text-slate-800">{viewingProgram.annualTheme ? `${viewingProgram.year}, ${viewingProgram.annualTheme.title}` : 'Aucune donnée'}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Bureau responsable</p>
                <p className="mt-1 text-sm font-semibold text-slate-800">{viewingProgram.officeName || 'Aucune donnée'}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-4 md:col-span-2">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Sous-thème</p>
                <p className="mt-1 text-sm font-semibold text-slate-800">{viewingProgram.subtheme || 'Aucune donnée'}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-4 md:col-span-2">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Signataire</p>
                <p className="mt-1 text-sm font-semibold text-slate-800">{viewingProgram.signatoryName || 'Aucune donnée'}{viewingProgram.signatoryTitle ? `, ${viewingProgram.signatoryTitle}` : ''}</p>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-black uppercase tracking-wide text-slate-600">Séances</h3>
                <span className="text-xs font-bold text-slate-400">{viewingProgram.sessions.length}</span>
              </div>
              {viewingProgram.sessions.length ? (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[720px] text-left text-sm">
                    <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                      <tr>
                        <th className="px-3 py-2 font-bold">Date</th>
                        <th className="px-3 py-2 font-bold">Type</th>
                        <th className="px-3 py-2 font-bold">Orateur</th>
                        <th className="px-3 py-2 font-bold">Officiant</th>
                        <th className="px-3 py-2 font-bold">Heure / durée</th>
                      </tr>
                    </thead>
                    <tbody>
                      {viewingProgram.sessions.map((session) => (
                        <tr key={session.id} className="border-t border-slate-100">
                          <td className="px-3 py-2 font-semibold text-slate-800">{formatDate(session.sessionDate)}</td>
                          <td className="px-3 py-2 text-slate-700">{session.activityType}</td>
                          <td className="px-3 py-2 text-slate-700">{session.speakerName}</td>
                          <td className="px-3 py-2 text-slate-700">{session.officiantName}</td>
                          <td className="px-3 py-2 text-slate-700">{session.startTime && session.endTime ? `${session.startTime.slice(0, 5)} - ${session.endTime.slice(0, 5)}` : session.durationMinutes ? `${session.durationMinutes} min` : 'Aucune donnée'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="py-6 text-center text-sm text-slate-500">Aucune donnée. Aucune séance enregistrée.</p>
              )}
            </div>

            <div className="flex justify-end gap-2">
              {canUpdate ? <AppButton variant="secondary" onClick={() => { openEditProgram(viewingProgram); setViewingProgram(null); }}>Modifier</AppButton> : null}
              <AppButton onClick={() => setViewingProgram(null)}>Fermer</AppButton>
            </div>
          </div>
        ) : null}
      </Modal>
      <Modal isOpen={isProgramModalOpen} onClose={() => setIsProgramModalOpen(false)} title={editingProgram ? 'Modifier le programme' : 'Créer un programme'} className="max-w-3xl">
        <div className="grid gap-4 md:grid-cols-2">
          <FormFieldWrapper label="Extension" required>
            <AppCombobox value={programForm.extensionId} onChange={(value) => setProgramForm((prev) => ({ ...prev, extensionId: value }))} options={branchOptions} disabled={user.role !== 'superadmin'} />
          </FormFieldWrapper>
          <FormFieldWrapper label="Année" required>
            <AppInput type="number" value={programForm.year} onChange={(e) => setProgramForm((prev) => ({ ...prev, year: Number(e.target.value) }))} />
          </FormFieldWrapper>
          <FormFieldWrapper label="Mois" required>
            <AppSelect value={programForm.month} onChange={(e) => setProgramForm((prev) => ({ ...prev, month: Number(e.target.value) }))}>
              {monthNames.map((month, index) => <option key={month} value={index + 1}>{month}</option>)}
            </AppSelect>
          </FormFieldWrapper>
          <FormFieldWrapper label="Thème annuel" required>
            <AppCombobox value={programForm.annualThemeId} onChange={(value) => setProgramForm((prev) => ({ ...prev, annualThemeId: value }))} options={themeOptions} />
          </FormFieldWrapper>
          <FormFieldWrapper label="Bureau responsable" required>
            <AppInput value={programForm.officeName} onChange={(e) => setProgramForm((prev) => ({ ...prev, officeName: e.target.value }))} />
          </FormFieldWrapper>
          <FormFieldWrapper label="Statut" required>
            <AppSelect value={programForm.status} onChange={(e) => setProgramForm((prev) => ({ ...prev, status: e.target.value as TeachingProgramStatus }))}>
              <option value="draft">Brouillon</option>
              <option value="published">Publié</option>
              <option value="archived">Archivé</option>
            </AppSelect>
          </FormFieldWrapper>
          <div className="md:col-span-2">
            <FormFieldWrapper label="Sous-thème" required>
              <AppTextarea rows={3} value={programForm.subtheme} onChange={(e) => setProgramForm((prev) => ({ ...prev, subtheme: e.target.value }))} placeholder="Comment détruire et bâtir un autel pour Dieu" />
            </FormFieldWrapper>
          </div>
          <FormFieldWrapper label="Responsable signataire" required>
            <AppInput value={programForm.signatoryName} onChange={(e) => setProgramForm((prev) => ({ ...prev, signatoryName: e.target.value }))} placeholder="Emmanuel Kiwubuka" />
          </FormFieldWrapper>
          <FormFieldWrapper label="Fonction du signataire" required>
            <AppInput value={programForm.signatoryTitle} onChange={(e) => setProgramForm((prev) => ({ ...prev, signatoryTitle: e.target.value }))} placeholder="Pasteur Responsable" />
          </FormFieldWrapper>
          {error ? <p className="md:col-span-2 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p> : null}
          <div className="md:col-span-2 flex justify-end gap-2">
            <AppButton variant="secondary" onClick={() => setIsProgramModalOpen(false)}>Annuler</AppButton>
            <AppButton onClick={handleProgramSave} isLoading={isSaving}>Enregistrer</AppButton>
          </div>
        </div>
      </Modal>

      <Modal isOpen={isSessionModalOpen} onClose={() => setIsSessionModalOpen(false)} title={editingSession ? 'Modifier la séance' : 'Ajouter une séance'} className="max-w-3xl">
        <div className="grid gap-4 md:grid-cols-2">
          <FormFieldWrapper label="Date" required>
            <AppInput type="date" value={sessionForm.sessionDate} onChange={(e) => setSessionForm((prev) => ({ ...prev, sessionDate: e.target.value }))} />
          </FormFieldWrapper>
          <FormFieldWrapper label="Type d'activité" required>
            <AppInput value={sessionForm.activityType} onChange={(e) => setSessionForm((prev) => ({ ...prev, activityType: e.target.value }))} placeholder="Intercession, Enseignement..." />
          </FormFieldWrapper>
          <FormFieldWrapper label="Orateur connu">
            <PersonPicker value={speakerSelection} onChange={(value) => handlePersonChange(value, 'speaker')} options={people} />
          </FormFieldWrapper>
          <FormFieldWrapper label="Nom de l'orateur" required>
            <AppInput value={sessionForm.speakerName} onChange={(e) => setSessionForm((prev) => ({ ...prev, speakerName: e.target.value, speakerUserId: speakerSelection ? prev.speakerUserId : null }))} placeholder="Nom externe accepté" />
          </FormFieldWrapper>
          <FormFieldWrapper label="Officiant connu">
            <PersonPicker value={officiantSelection} onChange={(value) => handlePersonChange(value, 'officiant')} options={people} />
          </FormFieldWrapper>
          <FormFieldWrapper label="Nom de l'officiant" required>
            <AppInput value={sessionForm.officiantName} onChange={(e) => setSessionForm((prev) => ({ ...prev, officiantName: e.target.value, officiantUserId: officiantSelection ? prev.officiantUserId : null }))} placeholder="Nom externe accepté" />
          </FormFieldWrapper>
          <FormFieldWrapper label="Heure début">
            <AppInput type="time" value={sessionForm.startTime || ''} onChange={(e) => setSessionForm((prev) => ({ ...prev, startTime: e.target.value }))} />
          </FormFieldWrapper>
          <FormFieldWrapper label="Heure fin">
            <AppInput type="time" value={sessionForm.endTime || ''} onChange={(e) => setSessionForm((prev) => ({ ...prev, endTime: e.target.value }))} />
          </FormFieldWrapper>
          <FormFieldWrapper label="Durée en minutes">
            <AppInput type="number" value={sessionForm.durationMinutes ?? ''} onChange={(e) => setSessionForm((prev) => ({ ...prev, durationMinutes: e.target.value ? Number(e.target.value) : null }))} />
          </FormFieldWrapper>
          <FormFieldWrapper label="Ordre">
            <AppInput type="number" value={sessionForm.sortOrder} onChange={(e) => setSessionForm((prev) => ({ ...prev, sortOrder: Number(e.target.value) }))} />
          </FormFieldWrapper>
          <div className="md:col-span-2">
            <FormFieldWrapper label="Observation">
              <AppTextarea rows={3} value={sessionForm.notes || ''} onChange={(e) => setSessionForm((prev) => ({ ...prev, notes: e.target.value }))} />
            </FormFieldWrapper>
          </div>
          {error ? <p className="md:col-span-2 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p> : null}
          <div className="md:col-span-2 flex justify-end gap-2">
            <AppButton variant="secondary" onClick={() => setIsSessionModalOpen(false)}>Annuler</AppButton>
            <AppButton onClick={handleSessionSave} isLoading={isSaving}>Enregistrer</AppButton>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={!!programToDelete}
        title="Supprimer ce programme ?"
        description="Toutes ses séances seront supprimées. Cette action est définitive."
        onCancel={() => setProgramToDelete(null)}
        onConfirm={handleProgramDelete}
        confirmLabel="Supprimer"
      />
      <ConfirmDialog
        isOpen={!!sessionToDelete}
        title="Supprimer cette séance ?"
        description="La séance sera retirée du programme."
        onCancel={() => setSessionToDelete(null)}
        onConfirm={handleSessionDelete}
        confirmLabel="Supprimer"
      />
    </div>
  );
}








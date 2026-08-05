import { DataTable, DepartmentBadge, EmptyState, LoadingState, PageHeader } from '@/components/common';
import { ActionMenu, AppButton, FormFieldWrapper, SearchInput, AppCombobox, useToast } from '@/components/ui';
import { ConfirmDialog, Modal } from '@/components/ui/Modal';
import { useAuth } from '@/hooks/useAuth';
import { toBaseDepartment, useDepartments } from '@/hooks/useDepartments';
import { useBranches } from '@/hooks/useBranches';
import { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Info, Plus, Edit2 } from 'lucide-react';
import { cn } from '@/lib/cn';
import { usePreferences } from '@/contexts/PreferencesContext';
import { hasModulePermission } from '@/lib/permissions';

interface DepartmentFormState {
  branchId: string;
  name: string;
  managerId: string;
  monthlyBudget: number;
  isActive: boolean;
}

const defaultDepartmentOptions = [
  'Mamans',
  'Papas',
  'Ecodim',
  'Coordination',
  'Caisse',
  'Protocole',
  'Proprete',
  'Musique',
  'Chanteurs',
  'Evangelisation',
  'Moderation',
  'Enseignement',
  'Interpretation',
  'Logistique & Transport',
  'Informatique',
  'Media',
  'Tresorerie',
];

const initialForm: DepartmentFormState = {
  branchId: '',
  name: 'Coordination',
  managerId: '',
  monthlyBudget: 0,
  isActive: true,
};

export function DepartmentsPage() {
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const { t } = usePreferences();
  const { departments, isLoading, isMutating, error, createDepartment, updateDepartment, deleteDepartment, renameDepartmentName } = useDepartments();
  const { branches } = useBranches();
  const [query, setQuery] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState<DepartmentFormState>(initialForm);

  // Search & custom lists for department selection inside Modal
  const [availableNames, setAvailableNames] = useState<string[]>(() => {
    const saved = localStorage.getItem('ecnd.available_departments');
    return saved ? JSON.parse(saved) : defaultDepartmentOptions;
  });
  const [selectedNames, setSelectedNames] = useState<string[]>([]);
  const [searchDeptQuery, setSearchDeptQuery] = useState('');
  const [budgetDept, setBudgetDept] = useState<any>(null);
  const [budgetVal, setBudgetVal] = useState(0);
  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);
  const [isCreateDeptNameModalOpen, setIsCreateDeptNameModalOpen] = useState(false);
  const [newDeptName, setNewDeptName] = useState('');
  const [createDeptNameError, setCreateDeptNameError] = useState<string | null>(null);

  // States for custom modals to replace native prompts
  const [editingAvailableName, setEditingAvailableName] = useState<string | null>(null);
  const [editAvailableNameValue, setEditAvailableNameValue] = useState('');
  const [editAvailableNameError, setEditAvailableNameError] = useState<string | null>(null);
  const [deletingAvailableName, setDeletingAvailableName] = useState<string | null>(null);

  const existingDeptsForBranch = useMemo(() => {
    if (!form.branchId) return [];
    return departments
      .filter((d) => d.branchId === form.branchId)
      .map((d) => d.name);
  }, [departments, form.branchId]);

  const branchOptions = useMemo(() => {
    if (!user) return [];
    return branches
      .filter((branch) => (user.role === 'superadmin' ? true : branch.id === user.branchId))
      .map((branch) => ({ value: branch.id, label: branch.name }));
  }, [branches, user]);

  const editDeptNameOptions = useMemo(() => {
    const list = availableNames.filter((name) => name === form.name || !existingDeptsForBranch.includes(name));
    if (form.name && !availableNames.includes(form.name)) {
      list.unshift(form.name);
    }
    return list.map((name) => ({ value: name, label: name }));
  }, [availableNames, form.name, existingDeptsForBranch]);

  const branchMap = useMemo(() => new Map(branches.map((branch) => [branch.id, branch.name])), [branches]);
  const canCreate = user ? hasModulePermission(user.role, 'departments', 'create') : false;
  const canUpdate = user ? hasModulePermission(user.role, 'departments', 'update') : false;
  const canDelete = user ? hasModulePermission(user.role, 'departments', 'delete') : false;
  const canManage = canCreate || canUpdate || canDelete;

  const scopedDepartments = useMemo(() => {
    if (!user) {
      return [];
    }

    const all = departments.map(toBaseDepartment);

    if (user.role === 'superadmin') {
      return departments;
    }

    if (user.role === 'admin') {
      return departments.filter((department) => department.branchId === user.branchId);
    }

    return all
      .filter((department) => user.departmentIds.includes(department.id))
      .map((department) => departments.find((item) => item.id === department.id) ?? { ...department, responsibleName: undefined });
  }, [departments, user]);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) {
      return scopedDepartments;
    }

    return scopedDepartments.filter((department) =>
      [department.name, branchMap.get(department.branchId) ?? ''].join(' ').toLowerCase().includes(normalized),
    );
  }, [branchMap, query, scopedDepartments]);

  // Sync Form name field when exactly 1 department is selected in creation mode
  useEffect(() => {
    if (!editingId && selectedNames.length === 1) {
      setForm((prev) => ({ ...prev, name: selectedNames[0] }));
    }
  }, [selectedNames, editingId]);

  const resetForm = () => {
    setForm({
      ...initialForm,
      branchId: user?.branchId ?? '',
      name: availableNames[0] || 'Coordination',
    });
  };

  const openCreateModal = () => {
    setEditingId(null);
    resetForm();
    setSelectedNames([]);
    setSearchDeptQuery('');
    setIsModalOpen(true);
  };

  const openEditModal = (department: (typeof filtered)[number]) => {
    setEditingId(department.id);
    setForm({
      branchId: department.branchId,
      name: department.name,
      managerId: department.managerId || '',
      monthlyBudget: department.monthlyBudget || 0,
      isActive: department.isActive,
    });
    setSelectedNames([department.name]);
    setIsModalOpen(true);
  };

  // Add, Edit & Delete dynamic department names options
  const handleAddCustomName = (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    if (availableNames.some((item) => item.toLowerCase() === trimmed.toLowerCase())) return;
    const updated = [...availableNames, trimmed];
    setAvailableNames(updated);
    localStorage.setItem('ecnd.available_departments', JSON.stringify(updated));
    setSelectedNames((prev) => [...prev, trimmed]); // automatically check the newly created option
  };

  const handleEditAvailableName = (oldName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setEditingAvailableName(oldName);
    setEditAvailableNameValue(oldName);
    setEditAvailableNameError(null);
  };

  const saveEditedAvailableName = async () => {
    setEditAvailableNameError(null);
    if (!editingAvailableName) return;
    const trimmed = editAvailableNameValue.trim();
    if (!trimmed) {
      setEditAvailableNameError("Le nom du département est obligatoire.");
      return;
    }
    if (trimmed === editingAvailableName) {
      setEditingAvailableName(null);
      return;
    }
    if (availableNames.some((item) => item.toLowerCase() === trimmed.toLowerCase() && item !== editingAvailableName)) {
      setEditAvailableNameError("Ce département existe déjà.");
      return;
    }
    const ok = await renameDepartmentName(editingAvailableName, trimmed);
    if (ok) {
      const updated = availableNames.map((name) => (name === editingAvailableName ? trimmed : name));
      setAvailableNames(updated);
      localStorage.setItem('ecnd.available_departments', JSON.stringify(updated));
      setSelectedNames((prev) => prev.map((name) => (name === editingAvailableName ? trimmed : name)));
      setEditingAvailableName(null);
    }
  };

  const handleDeleteAvailableName = (nameToDelete: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setDeletingAvailableName(nameToDelete);
  };

  const confirmDeleteAvailableName = () => {
    if (!deletingAvailableName) return;
    const updated = availableNames.filter((name) => name !== deletingAvailableName);
    setAvailableNames(updated);
    localStorage.setItem('ecnd.available_departments', JSON.stringify(updated));
    setSelectedNames((prev) => prev.filter((name) => name !== deletingAvailableName));
    setDeletingAvailableName(null);
  };

  // Select all checkbox logic (excluding already assigned)
  const isAllSelected = useMemo(() => {
    const filteredDepts = availableNames.filter((name) => {
      const norm = searchDeptQuery.trim().toLowerCase();
      const matchesSearch = !norm || name.toLowerCase().includes(norm);
      const isAlreadyAssigned = existingDeptsForBranch.includes(name);
      return matchesSearch && !isAlreadyAssigned;
    });
    return filteredDepts.length > 0 && filteredDepts.every((name) => selectedNames.includes(name));
  }, [availableNames, selectedNames, searchDeptQuery, existingDeptsForBranch]);

  const handleSelectAll = (checked: boolean) => {
    const filteredDepts = availableNames.filter((name) => {
      const norm = searchDeptQuery.trim().toLowerCase();
      const matchesSearch = !norm || name.toLowerCase().includes(norm);
      const isAlreadyAssigned = existingDeptsForBranch.includes(name);
      return matchesSearch && !isAlreadyAssigned;
    });

    if (checked) {
      setSelectedNames((prev) => {
        const next = [...prev];
        filteredDepts.forEach((name) => {
          if (!next.includes(name)) next.push(name);
        });
        return next;
      });
    } else {
      setSelectedNames((prev) => prev.filter((name) => !filteredDepts.includes(name)));
    }
  };

  const handleSubmit = async () => {
    if (!form.branchId) {
      toast.error('Veuillez remplir les champs obligatoires.');
      return;
    }

    if (editingId) {
      // Single edit submit: managers and budgets are preserved from loaded form state
      const payload = {
        branchId: form.branchId,
        name: form.name,
        managerId: form.managerId || undefined,
        monthlyBudget: form.monthlyBudget,
        isActive: form.isActive,
      };
      const ok = await updateDepartment(editingId, payload);
      if (ok) {
        toast.success('Modification r?ussie.');
        setIsModalOpen(false);
        resetForm();
        setEditingId(null);
      }
    } else {
      // Multiple / Single create submit: created directly under branch
      if (selectedNames.length === 0) {
        toast.error('Veuillez s?lectionner au moins un d?partement.');
        return;
      }
      try {
        for (const name of selectedNames) {
          // Guard: Skip department insertion if it is already assigned to this branch
          if (existingDeptsForBranch.includes(name)) {
            continue;
          }
          await createDepartment({
            branchId: form.branchId,
            name,
            managerId: undefined,
            monthlyBudget: 0,
            isActive: form.isActive, // apply active checkbox to all newly assigned
          });
        }
        toast.success('Enregistrement r?ussi.');
        setIsModalOpen(false);
        resetForm();
        setSelectedNames([]);
      } catch (err) {
        toast.error('Enregistrement impossible.');
      }
    }
  };

  const handleSaveBudget = async () => {
    if (!budgetDept) return;
    const payload = {
      branchId: budgetDept.branchId,
      name: budgetDept.name,
      managerId: budgetDept.managerId || undefined,
      monthlyBudget: budgetVal,
      isActive: budgetDept.isActive,
    };
    const ok = await updateDepartment(budgetDept.id, payload);
    if (ok) {
      toast.success('Modification r?ussie.');
      setIsBudgetModalOpen(false);
      setBudgetDept(null);
    }
  };

  const handleCreateDeptName = () => {
    setCreateDeptNameError(null);
    const trimmed = newDeptName.trim();
    if (!trimmed) {
      setCreateDeptNameError("Le nom du département est obligatoire.");
      return;
    }
    if (availableNames.some((n) => n.toLowerCase() === trimmed.toLowerCase())) {
      setCreateDeptNameError("Ce département existe déjà dans la liste.");
      return;
    }
    setAvailableNames((prev) => {
      const next = [...prev, trimmed];
      localStorage.setItem('ecnd.available_departments', JSON.stringify(next));
      return next;
    });
    setNewDeptName('');
    setIsCreateDeptNameModalOpen(false);
  };

  const handleDelete = async () => {
    if (!deleteId) {
      return;
    }

    const ok = await deleteDepartment(deleteId);
    if (ok) {
      toast.success('Suppression r?ussie.');
      setDeleteId(null);
    }
  };

  // Filter department names checklist in modal
  const filteredDeptNames = useMemo(() => {
    const norm = searchDeptQuery.trim().toLowerCase();
    if (!norm) return availableNames;
    return availableNames.filter((name) => name.toLowerCase().includes(norm));
  }, [availableNames, searchDeptQuery]);

  if (!user) {
    return null;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('departments.title')}
        description={t('departments.subtitle')}
        actions={
          canManage ? (
            <div className="flex gap-2">
              <AppButton variant="secondary" onClick={openCreateModal}>
                {t('departments.assign')}
              </AppButton>
              <AppButton onClick={() => setIsCreateDeptNameModalOpen(true)}>
                {t('departments.create')}
              </AppButton>
            </div>
          ) : undefined
        }
      >
        <SearchInput value={query} onChange={setQuery} placeholder="Rechercher un departement..." />
      </PageHeader>

      {error ? <EmptyState title="Donnees partiellement disponibles" description={error} /> : null}

      {isLoading ? (
        <LoadingState message="Chargement des departements..." />
      ) : (
        <DataTable
          data={filtered}
          keyExtractor={(department) => department.id}
          columns={[
            { key: 'name', label: 'Departement', render: (department) => <DepartmentBadge name={department.name} /> },
            {
              key: 'branch',
              label: 'Extension',
              render: (department) => branchMap.get(department.branchId) ?? 'N/A',
            },
            {
              key: 'responsible',
              label: 'Responsable',
              render: (department) => {
                const isDeptManager = user?.role === 'department_manager' && user.departmentIds.includes(department.id);
                const items = [
                  { label: 'Ouvrir', onClick: () => navigate(`/departments/${department.id}`) },
                  canUpdate ? { label: 'Modifier', onClick: () => openEditModal(department) } : null,
                  canDelete ? { label: 'Supprimer', variant: 'danger' as const, onClick: () => setDeleteId(department.id) } : null,
                  !canUpdate && isDeptManager ? {
                    label: 'Modifier le budget',
                    onClick: () => {
                      setBudgetDept(department);
                      setBudgetVal(department.monthlyBudget);
                      setIsBudgetModalOpen(true);
                    },
                  } : null,
                ].filter(Boolean);
                return <ActionMenu items={items} />;
              },
            },
          ]}
        />
      )}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingId ? 'Modifier departement' : 'Nouveau departement'}>
        <div className="space-y-4">
          <FormFieldWrapper label="Extension" required>
            <AppCombobox
              value={form.branchId}
              onChange={(val) => setForm((prev) => ({ ...prev, branchId: val }))}
              options={branchOptions}
              disabled={user.role === 'admin' || Boolean(editingId)}
            />
          </FormFieldWrapper>

          {editingId ? (
            /* Edit Mode: Simple dropdown select for the single department name */
            <FormFieldWrapper label="Nom du departement" required>
              <AppCombobox
                value={form.name}
                onChange={(val) => setForm((prev) => ({ ...prev, name: val }))}
                options={editDeptNameOptions}
              />
            </FormFieldWrapper>
          ) : (
            /* Creation Mode: Searchable Checklist with Add/Edit/Delete options */
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-700 block">
                Nom du département (Sélectionnez un ou plusieurs) *
              </label>
              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm bg-white">
                {/* Search / Add Bar */}
                <div className="bg-slate-50 border-b border-slate-100 p-2.5 flex items-center gap-2">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      value={searchDeptQuery}
                      onChange={(e) => setSearchDeptQuery(e.target.value)}
                      placeholder="Rechercher ou ajouter..."
                      className="w-full text-xs bg-white border border-slate-200 rounded-lg pl-3 pr-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500"
                    />
                  </div>
                  {searchDeptQuery.trim() && !availableNames.some((n) => n.toLowerCase() === searchDeptQuery.trim().toLowerCase()) && (
                    <button
                      type="button"
                      onClick={() => {
                        handleAddCustomName(searchDeptQuery);
                        setSearchDeptQuery('');
                      }}
                      className="bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-semibold px-3 py-1.5 transition-colors shrink-0 flex items-center gap-1 cursor-pointer select-none"
                    >
                      <Plus size={12} />
                      Créer
                    </button>
                  )}
                </div>

                {/* Checklist options */}
                <div className="max-h-48 overflow-y-auto p-2 divide-y divide-slate-50">
                  {/* Select All Checkbox */}
                  {filteredDeptNames.length > 0 && (
                    <div className="flex items-center justify-between py-2 px-2 hover:bg-slate-50 transition-colors rounded-lg select-none">
                      <label className="flex items-center gap-2 cursor-pointer flex-1 py-0.5 text-xs font-semibold text-slate-800">
                        <input
                          type="checkbox"
                          checked={isAllSelected}
                          onChange={(e) => handleSelectAll(e.target.checked)}
                          className="rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                        />
                        <span>Sélectionner tout ({filteredDeptNames.filter((n) => !existingDeptsForBranch.includes(n)).length})</span>
                      </label>
                    </div>
                  )}

                  {filteredDeptNames.length === 0 ? (
                    <p className="text-xs text-slate-400 text-center py-4">Aucun département trouvé. Saisissez son nom pour le créer.</p>
                  ) : (
                    filteredDeptNames.map((name) => {
                      const isChecked = selectedNames.includes(name);
                      const isAlreadyAssigned = existingDeptsForBranch.includes(name);
                      return (
                        <div
                          key={name}
                          className="flex items-center justify-between py-2 px-2 hover:bg-slate-50 transition-colors rounded-lg select-none group"
                        >
                          <label className={cn(
                            "flex items-center gap-2 flex-1 py-0.5 text-xs font-medium text-slate-700",
                            isAlreadyAssigned ? "cursor-not-allowed text-slate-400" : "cursor-pointer"
                          )}>
                            <input
                              type="checkbox"
                              checked={isChecked || isAlreadyAssigned}
                              disabled={isAlreadyAssigned}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedNames((prev) => [...prev, name]);
                                } else {
                                  setSelectedNames((prev) => prev.filter((n) => n !== name));
                                }
                              }}
                              className={cn(
                                "rounded border-slate-300 text-teal-600 focus:ring-teal-500",
                                isAlreadyAssigned && "opacity-50 cursor-not-allowed"
                              )}
                            />
                            <span className={isAlreadyAssigned ? "text-slate-400 italic line-through" : ""}>{name}</span>
                            {isAlreadyAssigned && (
                              <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-normal shrink-0">
                                Déjà assigné
                              </span>
                            )}
                          </label>
                          
                          {/* Edit and Delete available names */}
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                            <button
                              type="button"
                              onClick={(e) => handleEditAvailableName(name, e)}
                              className="text-slate-400 hover:text-teal-600 transition-colors p-1"
                              title="Modifier le nom de l'option"
                            >
                              <Edit2 size={12} />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => handleDeleteAvailableName(name, e)}
                              className="text-slate-400 hover:text-rose-600 transition-colors p-1"
                              title="Supprimer cette option de la liste"
                            >
                              <X size={12} />
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Active status checkbox */}
          <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(event) => setForm((prev) => ({ ...prev, isActive: event.target.checked }))}
            />
            Departement actif
          </label>

          {/* User notice about mass assignments */}
          {!editingId && selectedNames.length > 1 && (
            <div className="rounded-lg bg-sky-50 border border-sky-100 p-3.5 text-xs text-sky-800 flex items-start gap-2.5 shadow-sm">
              <Info size={16} className="text-sky-600 shrink-0 mt-0.5" />
              <span>
                Vous avez sélectionné <strong>{selectedNames.length}</strong> départements. Ils seront créés sous l'extension choisie avec un statut actif.
              </span>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 mt-2">
            <AppButton variant="secondary" onClick={() => setIsModalOpen(false)}>
              Annuler
            </AppButton>
            <AppButton
              isLoading={isMutating}
              onClick={handleSubmit}
              disabled={!editingId && selectedNames.length === 0}
            >
              Enregistrer
            </AppButton>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={Boolean(deleteId)}
        title="Supprimer ce departement ?"
        description="Les affectations associees peuvent etre impactees."
        onCancel={() => setDeleteId(null)}
        onConfirm={handleDelete}
        confirmLabel={isMutating ? 'Suppression...' : 'Supprimer'}
      />

      <Modal
        isOpen={isBudgetModalOpen}
        onClose={() => {
          setIsBudgetModalOpen(false);
          setBudgetDept(null);
        }}
        title={budgetDept ? `Modifier le budget - ${budgetDept.name}` : 'Modifier le budget'}
      >
        <div className="space-y-4">
          <FormFieldWrapper label="Budget mensuel (USD)" required>
            <input
              type="number"
              min={0}
              value={String(budgetVal)}
              onChange={(e) => setBudgetVal(Number(e.target.value) || 0)}
              className="w-full text-sm bg-white border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500"
            />
          </FormFieldWrapper>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 mt-2">
            <AppButton variant="secondary" onClick={() => {
              setIsBudgetModalOpen(false);
              setBudgetDept(null);
            }}>
              Annuler
            </AppButton>
            <AppButton isLoading={isMutating} onClick={handleSaveBudget}>
              Enregistrer
            </AppButton>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={isCreateDeptNameModalOpen}
        onClose={() => {
          setIsCreateDeptNameModalOpen(false);
          setNewDeptName('');
          setCreateDeptNameError(null);
        }}
        title="Créer un département"
      >
        <div className="space-y-4">
          <FormFieldWrapper label="Nom du département" required>
            <input
              type="text"
              value={newDeptName}
              onChange={(e) => setNewDeptName(e.target.value)}
              placeholder="Ex: Secrétariat, Logistique..."
              className="w-full text-sm bg-white border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500"
            />
          </FormFieldWrapper>

          {createDeptNameError && (
            <p className="text-xs text-rose-500 font-semibold">{createDeptNameError}</p>
          )}

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 mt-2">
            <AppButton variant="secondary" onClick={() => {
              setIsCreateDeptNameModalOpen(false);
              setNewDeptName('');
              setCreateDeptNameError(null);
            }}>
              Annuler
            </AppButton>
            <AppButton onClick={handleCreateDeptName}>
              Enregistrer
            </AppButton>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={Boolean(editingAvailableName)}
        onClose={() => setEditingAvailableName(null)}
        title="Modifier l'option de département"
      >
        <div className="space-y-4">
          <FormFieldWrapper label="Nom du département" required>
            <input
              type="text"
              value={editAvailableNameValue}
              onChange={(e) => setEditAvailableNameValue(e.target.value)}
              className="w-full text-sm bg-white border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500"
            />
          </FormFieldWrapper>

          {editAvailableNameError && (
            <p className="text-xs text-rose-500 font-semibold">{editAvailableNameError}</p>
          )}

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 mt-2">
            <AppButton variant="secondary" onClick={() => setEditingAvailableName(null)}>
              Annuler
            </AppButton>
            <AppButton onClick={saveEditedAvailableName}>
              Enregistrer
            </AppButton>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={Boolean(deletingAvailableName)}
        title="Supprimer l'option de département ?"
        description={deletingAvailableName ? `Cette action retirera "${deletingAvailableName}" de la liste des choix proposés pour les nouvelles affectations. Cela n'affectera pas les départements déjà créés en base de données pour vos extensions.` : ''}
        onCancel={() => setDeletingAvailableName(null)}
        onConfirm={confirmDeleteAvailableName}
        confirmLabel="Supprimer"
      />
    </div>
  );
}

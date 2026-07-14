import { DataTable, EmptyState, LoadingState, PageHeader } from '@/components/common';
import { AppButton, AppInput, AppTextarea, FormFieldWrapper } from '@/components/ui';
import { ConfirmDialog, Modal } from '@/components/ui/Modal';
import { useAuth } from '@/hooks/useAuth';
import {
  createAnnualTheme,
  getAnnualThemes,
  setAnnualThemeActive,
  updateAnnualTheme,
  type AnnualTheme,
  type AnnualThemeInput,
} from '@/services/teachingPrograms.service';
import { Archive, CheckCircle2, Edit, Plus } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

const currentYear = new Date().getFullYear();

const emptyForm: AnnualThemeInput = {
  year: currentYear,
  title: '',
  description: '',
  isActive: true,
};

export function AnnualThemesPage() {
  const { user } = useAuth();
  const [themes, setThemes] = useState<AnnualTheme[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<AnnualThemeInput>(emptyForm);
  const [editingTheme, setEditingTheme] = useState<AnnualTheme | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toggleTheme, setToggleTheme] = useState<AnnualTheme | null>(null);

  const canManage = user?.role === 'superadmin';

  const activeThemesCount = useMemo(() => themes.filter((theme) => theme.isActive).length, [themes]);

  const loadThemes = async () => {
    setIsLoading(true);
    setError(null);
    try {
      setThemes(await getAnnualThemes());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Impossible de charger les thèmes annuels.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadThemes();
  }, []);

  const openCreate = () => {
    setEditingTheme(null);
    setForm(emptyForm);
    setError(null);
    setIsModalOpen(true);
  };

  const openEdit = (theme: AnnualTheme) => {
    setEditingTheme(theme);
    setForm({
      year: theme.year,
      title: theme.title,
      description: theme.description,
      isActive: theme.isActive,
    });
    setError(null);
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!user || !canManage) return;
    if (!form.title.trim()) {
      setError('Le titre du thème annuel est obligatoire.');
      return;
    }

    setIsSaving(true);
    setError(null);
    try {
      if (editingTheme) {
        await updateAnnualTheme(editingTheme.id, form);
      } else {
        await createAnnualTheme(form, user.id);
      }
      setIsModalOpen(false);
      setEditingTheme(null);
      await loadThemes();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Enregistrement impossible.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggle = async () => {
    if (!toggleTheme) return;
    setIsSaving(true);
    setError(null);
    try {
      await setAnnualThemeActive(toggleTheme.id, !toggleTheme.isActive);
      setToggleTheme(null);
      await loadThemes();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Changement de statut impossible.');
    } finally {
      setIsSaving(false);
    }
  };

  if (!user) return null;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Thèmes annuels"
        description="Configuration du thème spirituel de l’année pour les programmes d’enseignement."
        actions={
          canManage ? (
            <AppButton onClick={openCreate}>
              <Plus className="size-4" /> Nouveau thème
            </AppButton>
          ) : null
        }
      />

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Thèmes enregistrés</p>
          <p className="mt-2 text-3xl font-black text-slate-900">{themes.length}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Thèmes actifs</p>
          <p className="mt-2 text-3xl font-black text-emerald-700">{activeThemesCount}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Accès</p>
          <p className="mt-2 text-sm font-semibold text-slate-800">{canManage ? 'Gestion super admin' : 'Consultation uniquement'}</p>
        </div>
      </div>

      {error ? <EmptyState title="Information" description={error} /> : null}

      {isLoading ? (
        <LoadingState message="Chargement des thèmes annuels..." />
      ) : (
        <DataTable
          data={themes}
          keyExtractor={(theme) => theme.id}
          emptyMessage="Aucune donnée. Aucun thème annuel n’est encore configuré."
          columns={[
            { key: 'year', label: 'Année', render: (theme) => <span className="font-bold text-slate-900">{theme.year}</span> },
            { key: 'title', label: 'Thème', render: (theme) => theme.title },
            { key: 'description', label: 'Description', render: (theme) => theme.description || 'Aucune donnée' },
            {
              key: 'status',
              label: 'Statut',
              render: (theme) => (
                <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${theme.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                  {theme.isActive ? 'Actif' : 'Archivé'}
                </span>
              ),
            },
            {
              key: 'actions',
              label: 'Actions',
              render: (theme) => canManage ? (
                <div className="flex flex-wrap gap-2">
                  <AppButton size="sm" variant="secondary" onClick={() => openEdit(theme)}>
                    <Edit className="size-4" /> Modifier
                  </AppButton>
                  <AppButton size="sm" variant={theme.isActive ? 'ghost' : 'secondary'} onClick={() => setToggleTheme(theme)}>
                    {theme.isActive ? <Archive className="size-4" /> : <CheckCircle2 className="size-4" />}
                    {theme.isActive ? 'Archiver' : 'Activer'}
                  </AppButton>
                </div>
              ) : 'Consultation',
            },
          ]}
        />
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingTheme ? 'Modifier le thème annuel' : 'Créer un thème annuel'}
        className="max-w-2xl"
      >
        <div className="space-y-4">
          <FormFieldWrapper label="Année" required>
            <AppInput type="number" value={form.year} onChange={(e) => setForm((prev) => ({ ...prev, year: Number(e.target.value) }))} />
          </FormFieldWrapper>
          <FormFieldWrapper label="Titre du thème" required>
            <AppInput value={form.title} onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))} placeholder="Ex : Année de l’envol" />
          </FormFieldWrapper>
          <FormFieldWrapper label="Description">
            <AppTextarea value={form.description} onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))} rows={4} />
          </FormFieldWrapper>
          <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
            <input type="checkbox" checked={form.isActive} onChange={(e) => setForm((prev) => ({ ...prev, isActive: e.target.checked }))} className="size-4 accent-teal-600" />
            Activer ce thème pour l’année
          </label>
          {error ? <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p> : null}
          <div className="flex justify-end gap-2">
            <AppButton variant="secondary" onClick={() => setIsModalOpen(false)}>Annuler</AppButton>
            <AppButton onClick={handleSave} isLoading={isSaving}>Enregistrer</AppButton>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={!!toggleTheme}
        title={toggleTheme?.isActive ? 'Archiver ce thème ?' : 'Activer ce thème ?'}
        description={toggleTheme?.isActive ? 'Le thème ne sera plus proposé comme thème actif.' : 'Supabase empêchera deux thèmes actifs pour la même année.'}
        onCancel={() => setToggleTheme(null)}
        onConfirm={handleToggle}
        confirmLabel={toggleTheme?.isActive ? 'Archiver' : 'Activer'}
      />
    </div>
  );
}

import { EmptyState, LoadingState, PageHeader } from '@/components/common';
import { AppButton, AppInput, AppSelect, AppTextarea, FormFieldWrapper } from '@/components/ui';
import {
  useSettingsData,
  type ModulePermissionAction,
  type ModulePermissionKey,
} from '@/hooks/useSettingsData';
import { zodResolver } from '@hookform/resolvers/zod';
import type { LucideIcon } from 'lucide-react';
import {
  BarChart3,
  Building2,
  CalendarDays,
  Church,
  LayoutDashboard,
  Network,
  Settings,
  UserCircle2,
  UserCog,
  Users,
  Wallet,
} from 'lucide-react';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

const settingsSchema = z.object({
  churchName: z.string().min(2, 'Le nom est requis'),
  churchCode: z.string().min(2, 'Le code est requis'),
  pastorName: z.string(),
  contactEmail: z.string().email('Email invalide'),
  contactPhone: z.string().min(8, 'Telephone invalide'),
  addressLine: z.string(),
  city: z.string().min(2, 'Ville requise'),
  country: z.string().min(2, 'Pays requis'),
  timezone: z.string().min(2, 'Fuseau requis'),
  currency: z.enum(['USD', 'CDF']),
  language: z.enum(['fr', 'en']),
  notificationsEmail: z.boolean(),
  notificationsSms: z.boolean(),
  weeklySummary: z.boolean(),
  autoBackup: z.boolean(),
  strongPassword: z.boolean(),
  minPasswordLength: z.number().min(6, 'Minimum 6').max(32, 'Maximum 32'),
});

type SettingsSchema = z.infer<typeof settingsSchema>;

interface ModuleCard {
  key: ModulePermissionKey;
  label: string;
  description: string;
  icon: LucideIcon;
}

const moduleCards: ModuleCard[] = [
  { key: 'dashboard', label: 'Dashboard', description: 'Vue d ensemble et statistiques', icon: LayoutDashboard },
  { key: 'branches', label: 'Extensions', description: 'Gestion des extensions', icon: Building2 },
  { key: 'users', label: 'Utilisateurs', description: 'Comptes et roles', icon: UserCog },
  { key: 'members', label: 'Membres', description: 'Fiches membres', icon: Users },
  { key: 'departments', label: 'Departements', description: 'Organisation des groupes', icon: Network },
  { key: 'finances', label: 'Finances', description: 'Recettes, depenses, budget', icon: Wallet },
  { key: 'services', label: 'Cultes / Services', description: 'Planification des cultes', icon: Church },
  { key: 'events', label: 'Evenements', description: 'Calendrier des evenements', icon: CalendarDays },
  { key: 'reports', label: 'Rapports', description: 'Rapports et exports', icon: BarChart3 },
  { key: 'settings', label: 'Parametres', description: 'Configuration globale', icon: Settings },
  { key: 'profile', label: 'Profil', description: 'Informations personnelles', icon: UserCircle2 },
];

export function SettingsPage() {
  const {
    initialValues,
    isLoading,
    isSaving,
    saveError,
    saveSuccess,
    modulePermissions,
    setModulePermissions,
    saveSettings,
  } = useSettingsData();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<SettingsSchema>({
    resolver: zodResolver(settingsSchema),
    defaultValues: initialValues,
  });

  useEffect(() => {
    reset(initialValues);
  }, [initialValues, reset]);

  const onSubmit = async (values: SettingsSchema) => {
    await saveSettings(values);
  };

  const setModuleAction = (moduleKey: ModulePermissionKey, action: ModulePermissionAction, checked: boolean) => {
    setModulePermissions((current) => {
      const nextModule = {
        ...current[moduleKey],
        [action]: checked,
      };

      if (action === 'view' && !checked) {
        nextModule.create = false;
        nextModule.update = false;
        nextModule.delete = false;
      }

      if (action !== 'view' && checked) {
        nextModule.view = true;
      }

      return {
        ...current,
        [moduleKey]: nextModule,
      };
    });
  };

  const setModuleAllActions = (moduleKey: ModulePermissionKey, checked: boolean) => {
    setModulePermissions((current) => ({
      ...current,
      [moduleKey]: {
        view: checked,
        create: checked,
        update: checked,
        delete: checked,
      },
    }));
  };

  if (isLoading) {
    return <LoadingState message="Chargement des parametres..." />;
  }

  if (!initialValues.contactEmail) {
    return <EmptyState title="Session requise" description="Reconnectez-vous pour acceder aux parametres." />;
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Parametres" description="Configuration generale de l'application et de l'eglise." />

      {saveError ? <EmptyState title="Echec de sauvegarde" description={saveError} /> : null}
      {saveSuccess ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{saveSuccess}</div>
      ) : null}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="grid gap-4 md:grid-cols-2">
          <FormFieldWrapper label="Nom de l'eglise" error={errors.churchName?.message} required>
            <AppInput {...register('churchName')} />
          </FormFieldWrapper>
          <FormFieldWrapper label="Code extension" error={errors.churchCode?.message} required>
            <AppInput {...register('churchCode')} />
          </FormFieldWrapper>
        </div>

        <FormFieldWrapper label="Responsable / Pasteur" error={errors.pastorName?.message}>
          <AppInput {...register('pastorName')} />
        </FormFieldWrapper>

        <div className="grid gap-4 md:grid-cols-2">
          <FormFieldWrapper label="Email de contact" error={errors.contactEmail?.message} required>
            <AppInput type="email" {...register('contactEmail')} disabled />
          </FormFieldWrapper>
          <FormFieldWrapper label="Telephone" error={errors.contactPhone?.message} required>
            <AppInput {...register('contactPhone')} />
          </FormFieldWrapper>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <FormFieldWrapper label="Ville" error={errors.city?.message} required>
            <AppInput {...register('city')} />
          </FormFieldWrapper>
          <FormFieldWrapper label="Pays" error={errors.country?.message} required>
            <AppInput {...register('country')} />
          </FormFieldWrapper>
        </div>

        <FormFieldWrapper label="Adresse detaillee" error={errors.addressLine?.message}>
          <AppTextarea rows={3} {...register('addressLine')} />
        </FormFieldWrapper>

        <div className="grid gap-4 md:grid-cols-3">
          <FormFieldWrapper label="Fuseau horaire" error={errors.timezone?.message} required>
            <AppSelect {...register('timezone')}>
              <option value="Africa/Lubumbashi">Africa/Lubumbashi</option>
              <option value="Africa/Kinshasa">Africa/Kinshasa</option>
              <option value="Europe/Paris">Europe/Paris</option>
            </AppSelect>
          </FormFieldWrapper>
          <FormFieldWrapper label="Devise" error={errors.currency?.message} required>
            <AppSelect {...register('currency')}>
              <option value="USD">USD</option>
              <option value="CDF">CDF</option>
            </AppSelect>
          </FormFieldWrapper>
          <FormFieldWrapper label="Langue" error={errors.language?.message} required>
            <AppSelect {...register('language')}>
              <option value="fr">Francais</option>
              <option value="en">English</option>
            </AppSelect>
          </FormFieldWrapper>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-3 rounded-lg border border-slate-200 p-4">
            <p className="text-sm font-semibold text-slate-700">Notifications</p>
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input type="checkbox" {...register('notificationsEmail')} />
              Email actif
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input type="checkbox" {...register('notificationsSms')} />
              SMS actif
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input type="checkbox" {...register('weeklySummary')} />
              Resume hebdomadaire
            </label>
          </div>

          <div className="space-y-3 rounded-lg border border-slate-200 p-4">
            <p className="text-sm font-semibold text-slate-700">Securite</p>
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input type="checkbox" {...register('strongPassword')} />
              Mot de passe fort requis
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input type="checkbox" {...register('autoBackup')} />
              Sauvegarde automatique
            </label>
            <FormFieldWrapper label="Longueur min mot de passe" error={errors.minPasswordLength?.message}>
              <AppInput type="number" min={6} max={32} {...register('minPasswordLength', { valueAsNumber: true })} />
            </FormFieldWrapper>
          </div>
        </div>

        <div className="space-y-3 rounded-lg border border-slate-200 p-4">
          <div className="space-y-1">
            <p className="text-sm font-semibold text-slate-700">Gouvernance des modules</p>
            <p className="text-xs text-slate-500">
              L admin peut definir ici les droits de base par module: inserer, mettre a jour et supprimer.
            </p>
          </div>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {moduleCards.map((moduleItem) => {
              const Icon = moduleItem.icon;
              const permissions = modulePermissions[moduleItem.key];
              const isAllEnabled = permissions.view && permissions.create && permissions.update && permissions.delete;

              return (
                <div key={moduleItem.key} className="rounded-lg border border-slate-200 p-3">
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2">
                      <span className="mt-0.5 inline-flex h-8 w-8 items-center justify-center rounded-md bg-slate-100 text-slate-700">
                        <Icon size={16} />
                      </span>
                      <div>
                        <p className="text-sm font-semibold text-slate-800">{moduleItem.label}</p>
                        <p className="text-xs text-slate-500">{moduleItem.description}</p>
                      </div>
                    </div>

                    <label className="flex items-center gap-1 text-xs text-slate-600">
                      <input
                        type="checkbox"
                        checked={isAllEnabled}
                        onChange={(event) => setModuleAllActions(moduleItem.key, event.target.checked)}
                      />
                      Tout
                    </label>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs text-slate-700">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={permissions.view}
                        onChange={(event) => setModuleAction(moduleItem.key, 'view', event.target.checked)}
                      />
                      Lire
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={permissions.create}
                        onChange={(event) => setModuleAction(moduleItem.key, 'create', event.target.checked)}
                      />
                      Inserer
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={permissions.update}
                        onChange={(event) => setModuleAction(moduleItem.key, 'update', event.target.checked)}
                      />
                      Mettre a jour
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={permissions.delete}
                        onChange={(event) => setModuleAction(moduleItem.key, 'delete', event.target.checked)}
                      />
                      Supprimer
                    </label>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-lg border border-sky-200 bg-sky-50 px-3 py-2 text-xs text-sky-700">
          Les informations sont sauvegardees dans app_settings. Les droits modules sont egalement sauvegardes localement comme fallback.
        </div>

        <AppButton type="submit" isLoading={isSaving}>
          Enregistrer
        </AppButton>
      </form>
    </div>
  );
}

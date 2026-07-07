import { EmptyState, LoadingState, PageHeader } from '@/components/common';
import { AppButton, AppInput, AppSelect, FormFieldWrapper, AppSwitch, Modal } from '@/components/ui';
import {
  useSettingsData,
  type ModulePermissionAction,
  type ModulePermissionKey,
  getDefaultRolePermissions,
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
  Mail,
  Phone,
  Clock,
  Coins,
  Globe,
  Shield,
  Plus,
  Minus,
  MapPin,
  Home,
  User,
  Database,
  Bell,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { cn } from '@/lib/cn';

const settingsSchema = z.object({
  churchName: z.string().min(2, 'Le nom est requis'),
  churchCode: z.string().min(2, 'Le code est requis'),
  pastorName: z.string(),
  contactEmail: z.string().email('Email invalide'),
  contactPhone: z.string().min(8, 'Téléphone invalide'),
  addressLine: z.string(),
  city: z.string().min(2, 'Ville requise'),
  country: z.string().min(2, 'Pays requis'),
  timezone: z.string().min(2, 'Fuseau requis'),
  currency: z.enum(['USD', 'CDF']),
  language: z.enum(['fr', 'en']),
  exchangeRate: z.number().min(1, 'Le taux doit être supérieur à 0'),
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
  { key: 'dashboard', label: 'Dashboard', description: "Vue d'ensemble et statistiques", icon: LayoutDashboard },
  { key: 'branches', label: 'Extensions', description: 'Gestion des extensions', icon: Building2 },
  { key: 'users', label: 'Utilisateurs', description: 'Comptes et rôles', icon: UserCog },
  { key: 'members', label: 'Membres', description: 'Fiches membres', icon: Users },
  { key: 'departments', label: 'Départements', description: 'Organisation des groupes', icon: Network },
  { key: 'finances', label: 'Finances', description: 'Recettes, dépenses, budget', icon: Wallet },
  { key: 'services', label: 'Cultes / Services', description: 'Planification des cultes', icon: Church },
  { key: 'events', label: 'Événements', description: 'Calendrier des événements', icon: CalendarDays },
  { key: 'reports', label: 'Rapports', description: 'Rapports et exports', icon: BarChart3 },
  { key: 'settings', label: 'Paramètres', description: 'Configuration de l’application', icon: Settings },
  { key: 'profile', label: 'Profil', description: 'Informations personnelles', icon: UserCircle2 },
];

const configurableModulesPerRole: Record<'admin' | 'department_manager' | 'department_member', ModulePermissionKey[]> = {
  admin: [
    'dashboard',
    'branches',
    'users',
    'members',
    'departments',
    'finances',
    'services',
    'events',
    'reports',
    'settings',
    'profile',
  ],
  department_manager: [
    'dashboard',
    'members',
    'departments',
    'services',
    'events',
    'reports',
    'profile',
  ],
  department_member: [
    'dashboard',
    'departments',
    'profile',
  ],
};

/* Reusable components for Settings Design Layout */
interface SettingsSectionCardProps {
  title: string;
  subtitle?: string;
  icon: LucideIcon;
  children: React.ReactNode;
  className?: string;
  headerAction?: React.ReactNode;
}

function SettingsSectionCard({ title, subtitle, icon: Icon, children, className, headerAction }: SettingsSectionCardProps) {
  return (
    <div className={cn("bg-white rounded-xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between", className)}>
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-4 mb-4 gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-50 text-teal-600 border border-teal-100/50">
              <Icon size={18} />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-800">{title}</h3>
              {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
            </div>
          </div>
          {headerAction}
        </div>
        {children}
      </div>
    </div>
  );
}

interface SettingsInputProps {
  label: string;
  error?: string;
  required?: boolean;
  icon: LucideIcon;
  children: React.ReactNode;
}

function SettingsInput({ label, error, required, icon: Icon, children }: SettingsInputProps) {
  return (
    <FormFieldWrapper label={label} error={error} required={required}>
      <div className="relative">
        <Icon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 pointer-events-none" />
        {children}
      </div>
    </FormFieldWrapper>
  );
}

interface ModulePermissionCardProps {
  moduleKey: ModulePermissionKey;
  label: string;
  description: string;
  icon: LucideIcon;
  permissions: {
    view: boolean;
    create: boolean;
    update: boolean;
    delete: boolean;
  };
  onToggleAll: (checked: boolean) => void;
  onToggleAction: (action: ModulePermissionAction, checked: boolean) => void;
}

function ModulePermissionCard({
  label,
  description,
  icon: Icon,
  permissions,
  onToggleAll,
  onToggleAction,
}: ModulePermissionCardProps) {
  const isAllEnabled = permissions.view && permissions.create && permissions.update && permissions.delete;

  return (
    <div className="bg-white rounded-xl border border-slate-200 hover:shadow-md transition-all duration-200 flex flex-col justify-between overflow-hidden p-5 space-y-4">
      {/* Header */}
      <div className="flex items-start gap-3 select-none">
        <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-teal-50 text-teal-600 border border-teal-100">
          <Icon size={18} />
        </span>
        <div>
          <p className="text-sm font-semibold text-slate-800">{label}</p>
          <p className="text-xs text-slate-500 leading-normal mt-0.5">{description}</p>
        </div>
      </div>

      {/* Permissions Content */}
      <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
        {/* Row 1: Activer tout */}
        <label className="flex items-center justify-between py-1.5 cursor-pointer select-none">
          <span className="text-xs font-medium text-slate-700">Activer tout le module</span>
          <AppSwitch
            checked={isAllEnabled}
            onChange={(event) => onToggleAll(event.target.checked)}
          />
        </label>
        {/* Row 2: Lecture */}
        <label className="flex items-center justify-between py-1.5 cursor-pointer select-none">
          <span className="text-xs font-medium text-slate-700">Autoriser la lecture</span>
          <AppSwitch
            checked={permissions.view}
            onChange={(event) => onToggleAction('view', event.target.checked)}
          />
        </label>
        {/* Row 3: Ajout */}
        <label className="flex items-center justify-between py-1.5 cursor-pointer select-none">
          <span className="text-xs font-medium text-slate-700">Autoriser l'ajout</span>
          <AppSwitch
            checked={permissions.create}
            onChange={(event) => onToggleAction('create', event.target.checked)}
          />
        </label>
        {/* Row 4: Modification */}
        <label className="flex items-center justify-between py-1.5 cursor-pointer select-none">
          <span className="text-xs font-medium text-slate-700">Autoriser la modification</span>
          <AppSwitch
            checked={permissions.update}
            onChange={(event) => onToggleAction('update', event.target.checked)}
          />
        </label>
        {/* Row 5: Suppression */}
        <label className="flex items-center justify-between py-1.5 cursor-pointer select-none">
          <span className="text-xs font-medium text-slate-700">Autoriser la suppression</span>
          <AppSwitch
            checked={permissions.delete}
            onChange={(event) => onToggleAction('delete', event.target.checked)}
          />
        </label>
      </div>
    </div>
  );
}

import { useAuth } from '@/hooks/useAuth';
import { useUsersManagement } from '@/hooks/useUsersManagement';
import { roleLabels } from '@/lib/permissions';

export function SettingsPage() {
  const { user } = useAuth();
  const {
    initialValues,
    isLoading,
    isSaving,
    saveError,
    saveSuccess,
    modulePermissions,
    setModulePermissions,
    saveSettings,
    saveModulePermissionsOnly,
    userPermissions,
    saveUserPermissionsOnly,
  } = useSettingsData();

  const { users } = useUsersManagement();
  const [selectedUserId, setSelectedUserId] = useState<string>('');

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<SettingsSchema>({
    resolver: zodResolver(settingsSchema),
    defaultValues: initialValues,
  });

  const [activeTab, setActiveTab] = useState<'general' | 'notifications' | 'security' | 'permissions' | 'backups' | 'profile'>(
    user?.role === 'superadmin' ? 'permissions' : 'general'
  );
  const [selectedRole, setSelectedRole] = useState<'admin' | 'department_manager' | 'department_member'>('admin');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [localSuccess, setLocalSuccess] = useState<string | null>(null);

  useEffect(() => {
    reset(initialValues);
  }, [initialValues, reset]);

  useEffect(() => {
    setSelectedUserId('');
  }, [selectedRole]);

  // Handle auto-clear success alert message
  useEffect(() => {
    if (saveSuccess) {
      setLocalSuccess("Enregistrement automatique effectué avec succès.");
      const timer = setTimeout(() => {
        setLocalSuccess(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [saveSuccess]);

  const onSubmit = async (values: SettingsSchema) => {
    await saveSettings(values);
  };

  // Stepper values
  const minLen = watch('minPasswordLength') || 8;

  const handleDecrement = () => {
    if (minLen > 6) {
      setValue('minPasswordLength', minLen - 1, { shouldValidate: true, shouldDirty: true });
      setTimeout(() => handleSubmit(onSubmit)(), 50);
    }
  };

  const handleIncrement = () => {
    if (minLen < 32) {
      setValue('minPasswordLength', minLen + 1, { shouldValidate: true, shouldDirty: true });
      setTimeout(() => handleSubmit(onSubmit)(), 50);
    }
  };

  const currencyValue = watch('currency') || 'USD';
  const languageValue = watch('language') || 'fr';

  // Mutual exclusion handlers (which trigger save)
  const handleCurrencyChange = (val: 'USD' | 'CDF', checked: boolean) => {
    if (checked) {
      setValue('currency', val, { shouldValidate: true, shouldDirty: true });
    } else {
      setValue('currency', val === 'USD' ? 'CDF' : 'USD', { shouldValidate: true, shouldDirty: true });
    }
    setTimeout(() => handleSubmit(onSubmit)(), 50);
  };

  const handleLanguageChange = (val: 'fr' | 'en', checked: boolean) => {
    if (checked) {
      setValue('language', val, { shouldValidate: true, shouldDirty: true });
    } else {
      setValue('language', val === 'fr' ? 'en' : 'fr', { shouldValidate: true, shouldDirty: true });
    }
    setTimeout(() => handleSubmit(onSubmit)(), 50);
  };

  const setModuleAction = (moduleKey: ModulePermissionKey, action: ModulePermissionAction, checked: boolean) => {
    if (selectedUserId) {
      const currentRolePerms = modulePermissions[selectedRole] || getDefaultRolePermissions()[selectedRole];
      const currentUserPerms = userPermissions[selectedUserId] || currentRolePerms;
      
      const nextModule = {
        ...currentUserPerms[moduleKey],
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

      const nextUserPermissions = {
        ...userPermissions,
        [selectedUserId]: {
          ...currentUserPerms,
          [moduleKey]: nextModule,
        },
      };

      saveUserPermissionsOnly(nextUserPermissions);
    } else {
      let updated: any;
      setModulePermissions((current) => {
        const rolePerms = current[selectedRole] || getDefaultRolePermissions()[selectedRole];
        const nextModule = {
          ...rolePerms[moduleKey],
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

        updated = {
          ...current,
          [selectedRole]: {
            ...rolePerms,
            [moduleKey]: nextModule,
          },
        };
        return updated;
      });

      setTimeout(() => {
        if (updated) {
          saveModulePermissionsOnly(updated);
        }
      }, 50);
    }
  };

  const setModuleAllActions = (moduleKey: ModulePermissionKey, checked: boolean) => {
    if (selectedUserId) {
      const currentRolePerms = modulePermissions[selectedRole] || getDefaultRolePermissions()[selectedRole];
      const currentUserPerms = userPermissions[selectedUserId] || currentRolePerms;

      const nextUserPermissions = {
        ...userPermissions,
        [selectedUserId]: {
          ...currentUserPerms,
          [moduleKey]: {
            view: checked,
            create: checked,
            update: checked,
            delete: checked,
          },
        },
      };

      saveUserPermissionsOnly(nextUserPermissions);
    } else {
      let updated: any;
      setModulePermissions((current) => {
        const rolePerms = current[selectedRole] || getDefaultRolePermissions()[selectedRole];
        updated = {
          ...current,
          [selectedRole]: {
            ...rolePerms,
            [moduleKey]: {
              view: checked,
              create: checked,
              update: checked,
              delete: checked,
            },
          },
        };
        return updated;
      });

      setTimeout(() => {
        if (updated) {
          saveModulePermissionsOnly(updated);
        }
      }, 50);
    }
  };

  if (isLoading) {
    return <LoadingState message="Chargement des paramètres..." />;
  }

  if (!initialValues.contactEmail) {
    return <EmptyState title="Session requise" description="Reconnectez-vous pour accéder aux paramètres." />;
  }

  const tabs = [
    { id: 'general' as const, label: 'Général' },
    { id: 'notifications' as const, label: 'Notifications' },
    { id: 'security' as const, label: 'Sécurité' },
    ...(user?.role === 'superadmin'
      ? [
          { id: 'permissions' as const, label: 'Permissions des modules' },
          { id: 'backups' as const, label: 'Sauvegardes' },
        ]
      : []),
    { id: 'profile' as const, label: 'Profil système' },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <PageHeader title="Paramètres" description="Configuration générale de l'application et de l'église." />

      {saveError ? <EmptyState title="Échec de sauvegarde" description={saveError} /> : null}
      {localSuccess ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 shadow-sm transition-all duration-200">
          {localSuccess}
        </div>
      ) : null}

      <div className="space-y-6 mt-6">
        {/* Horizontal Tabs Menu */}
        <div className="flex flex-wrap gap-2.5 pb-2">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "px-4 py-2.5 text-sm font-medium rounded-lg border shadow-sm transition-all duration-200 select-none cursor-pointer",
                  isActive
                    ? "bg-teal-600 text-white border-teal-600"
                    : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:text-slate-900"
                )}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Render Tab Contents */}
        <div className="transition-all duration-200">
          
          {/* GENERAL TAB */}
          {activeTab === 'general' && (
            <div className="space-y-6 animate-fadeIn">
              {/* Card 1: Details summary read-only layout */}
              <SettingsSectionCard
                title="Informations générales"
                subtitle="Détails d'identification de l'église et de l'extension"
                icon={Building2}
                className="w-full"
                headerAction={
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(true)}
                    className="text-xs font-semibold text-teal-600 border border-teal-200 hover:bg-teal-50/50 px-3.5 py-2 rounded-lg transition-colors flex items-center gap-1.5 select-none cursor-pointer"
                  >
                    <Settings size={14} />
                    Modifier
                  </button>
                }
              >
                <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 text-sm">
                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100/50 flex items-start gap-3">
                    <Church className="text-teal-600 mt-0.5 shrink-0" size={16} />
                    <div>
                      <span className="text-xs text-slate-500 block">Nom de l'église</span>
                      <span className="font-semibold text-slate-800">{initialValues.churchName}</span>
                    </div>
                  </div>
                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100/50 flex items-start gap-3">
                    <Network className="text-teal-600 mt-0.5 shrink-0" size={16} />
                    <div>
                      <span className="text-xs text-slate-500 block">Code extension</span>
                      <span className="font-semibold text-slate-800">{initialValues.churchCode}</span>
                    </div>
                  </div>
                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100/50 flex items-start gap-3">
                    <User className="text-teal-600 mt-0.5 shrink-0" size={16} />
                    <div>
                      <span className="text-xs text-slate-500 block">Responsable / Pasteur</span>
                      <span className="font-semibold text-slate-800">{initialValues.pastorName || 'Non spécifié'}</span>
                    </div>
                  </div>
                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100/50 flex items-start gap-3">
                    <Mail className="text-teal-600 mt-0.5 shrink-0" size={16} />
                    <div>
                      <span className="text-xs text-slate-500 block">Email de contact</span>
                      <span className="font-semibold text-slate-800">{initialValues.contactEmail}</span>
                    </div>
                  </div>
                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100/50 flex items-start gap-3">
                    <Phone className="text-teal-600 mt-0.5 shrink-0" size={16} />
                    <div>
                      <span className="text-xs text-slate-500 block">Téléphone</span>
                      <span className="font-semibold text-slate-800">{initialValues.contactPhone || 'Non spécifié'}</span>
                    </div>
                  </div>
                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100/50 flex items-start gap-3">
                    <MapPin className="text-teal-600 mt-0.5 shrink-0" size={16} />
                    <div>
                      <span className="text-xs text-slate-500 block">Ville & Pays</span>
                      <span className="font-semibold text-slate-800">{initialValues.city}, {initialValues.country}</span>
                    </div>
                  </div>
                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100/50 flex items-start gap-3 sm:col-span-2">
                    <Home className="text-teal-600 mt-0.5 shrink-0" size={16} />
                    <div>
                      <span className="text-xs text-slate-500 block">Adresse détaillée</span>
                      <span className="font-semibold text-slate-800">{initialValues.addressLine || 'Non spécifiée'}</span>
                    </div>
                  </div>
                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100/50 flex items-start gap-3">
                    <Clock className="text-teal-600 mt-0.5 shrink-0" size={16} />
                    <div>
                      <span className="text-xs text-slate-500 block">Fuseau horaire</span>
                      <span className="font-semibold text-slate-800">{initialValues.timezone}</span>
                    </div>
                  </div>
                </div>
              </SettingsSectionCard>

              {/* Card 2: Currency and Language selectors as mutually exclusive toggle switches */}
              <SettingsSectionCard
                title="Préférences système"
                subtitle="Gérez la devise par défaut de la comptabilité et la langue d'affichage."
                icon={Settings}
                className="w-full mt-6"
              >
                <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
                  {/* Devise switches */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                      <Coins size={16} className="text-teal-600" />
                      Devise comptable
                    </h4>
                    <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl p-3 bg-slate-50/50">
                      <label className="flex items-center justify-between py-2 cursor-pointer select-none">
                        <span className="text-xs font-medium text-slate-700">Activer le Dollar Américain (USD)</span>
                        <AppSwitch
                          checked={currencyValue === 'USD'}
                          onChange={(e) => handleCurrencyChange('USD', e.target.checked)}
                        />
                      </label>
                      <label className="flex items-center justify-between py-2 cursor-pointer select-none">
                        <span className="text-xs font-medium text-slate-700">Activer le Franc Congolais (CDF)</span>
                        <AppSwitch
                          checked={currencyValue === 'CDF'}
                          onChange={(e) => handleCurrencyChange('CDF', e.target.checked)}
                        />
                      </label>
                    </div>
                  </div>

                  {/* Langue switches */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                      <Globe size={16} className="text-teal-600" />
                      Langue d'affichage
                    </h4>
                    <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl p-3 bg-slate-50/50">
                      <label className="flex items-center justify-between py-2 cursor-pointer select-none">
                        <span className="text-xs font-medium text-slate-700">Activer le Français</span>
                        <AppSwitch
                          checked={languageValue === 'fr'}
                          onChange={(e) => handleLanguageChange('fr', e.target.checked)}
                        />
                      </label>
                      <label className="flex items-center justify-between py-2 cursor-pointer select-none">
                        <span className="text-xs font-medium text-slate-700">Activer l'Anglais (English)</span>
                        <AppSwitch
                          checked={languageValue === 'en'}
                          onChange={(e) => handleLanguageChange('en', e.target.checked)}
                        />
                      </label>
                    </div>
                  </div>
                </div>

                {/* Taux de change config */}
                <div className="mt-6 pt-4 border-t border-slate-100 max-w-xs text-left">
                  <h4 className="text-sm font-semibold text-slate-800 flex items-center gap-2 mb-2">
                    <Coins size={16} className="text-teal-600" />
                    Taux de change (1 USD en CDF)
                  </h4>
                  <FormFieldWrapper label="" error={errors.exchangeRate?.message}>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-500 font-bold">1 USD =</span>
                      <input
                        type="number"
                        min={1}
                        {...register('exchangeRate', {
                          valueAsNumber: true,
                          onChange: () => setTimeout(() => handleSubmit(onSubmit)(), 100)
                        })}
                        className="w-full text-xs font-semibold bg-white border border-slate-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500"
                      />
                      <span className="text-xs text-slate-500 font-bold">CDF</span>
                    </div>
                  </FormFieldWrapper>
                </div>
              </SettingsSectionCard>
            </div>
          )}

          {/* NOTIFICATIONS TAB */}
          {activeTab === 'notifications' && (
            <div className="max-w-2xl mx-auto animate-fadeIn">
              <SettingsSectionCard
                title="Notifications"
                subtitle="Préférences d'alerte et de communication"
                icon={Bell}
                className="w-full"
              >
                <div className="divide-y divide-slate-100">
                  <label className="flex items-center justify-between py-4 cursor-pointer select-none">
                    <div>
                      <span className="text-sm font-medium text-slate-800 block">Email activé</span>
                      <span className="text-xs text-slate-500">Recevoir des alertes de supervision par email</span>
                    </div>
                    <AppSwitch
                      {...register('notificationsEmail', {
                        onChange: () => setTimeout(() => handleSubmit(onSubmit)(), 50),
                      })}
                    />
                  </label>
                  <label className="flex items-center justify-between py-4 cursor-pointer select-none">
                    <div>
                      <span className="text-sm font-medium text-slate-800 block">SMS activé</span>
                      <span className="text-xs text-slate-500">Recevoir des alertes de supervision par SMS</span>
                    </div>
                    <AppSwitch
                      {...register('notificationsSms', {
                        onChange: () => setTimeout(() => handleSubmit(onSubmit)(), 50),
                      })}
                    />
                  </label>
                  <label className="flex items-center justify-between py-4 cursor-pointer select-none">
                    <div>
                      <span className="text-sm font-medium text-slate-800 block">Résumé hebdomadaire</span>
                      <span className="text-xs text-slate-500">Recevoir un rapport d'activité tous les dimanches</span>
                    </div>
                    <AppSwitch
                      {...register('weeklySummary', {
                        onChange: () => setTimeout(() => handleSubmit(onSubmit)(), 50),
                      })}
                    />
                  </label>
                </div>
              </SettingsSectionCard>
            </div>
          )}

          {/* SECURITY TAB */}
          {activeTab === 'security' && (
            <div className="max-w-2xl mx-auto animate-fadeIn">
              <SettingsSectionCard
                title="Sécurité"
                subtitle="Paramètres de mot de passe et de sécurité"
                icon={Shield}
                className="w-full"
              >
                <div className="divide-y divide-slate-100">
                  <label className="flex items-center justify-between py-4 cursor-pointer select-none">
                    <div>
                      <span className="text-sm font-medium text-slate-800 block">Mot de passe fort requis</span>
                      <span className="text-xs text-slate-500">Exiger des majuscules, minuscules et chiffres</span>
                    </div>
                    <AppSwitch
                      {...register('strongPassword', {
                        onChange: () => setTimeout(() => handleSubmit(onSubmit)(), 50),
                      })}
                    />
                  </label>
                  <label className="flex items-center justify-between py-4 cursor-pointer select-none">
                    <div>
                      <span className="text-sm font-medium text-slate-800 block">Sauvegarde automatique</span>
                      <span className="text-xs text-slate-500">Sauvegarder les données de l'église quotidiennement</span>
                    </div>
                    <AppSwitch
                      {...register('autoBackup', {
                        onChange: () => setTimeout(() => handleSubmit(onSubmit)(), 50),
                      })}
                    />
                  </label>
                  <div className="flex items-center justify-between py-4">
                    <div>
                      <span className="text-sm font-medium text-slate-800 block">Longueur min. mot de passe</span>
                      <span className="text-xs text-slate-500">Longueur minimale requise pour les utilisateurs</span>
                    </div>
                    <div className="flex h-9 w-28 items-center justify-between rounded-lg border border-slate-200 bg-white p-1 shadow-sm">
                      <button
                        type="button"
                        onClick={handleDecrement}
                        className="flex h-7 w-7 items-center justify-center rounded bg-slate-50 text-slate-600 hover:bg-slate-100 transition-colors"
                      >
                        <Minus size={12} />
                      </button>
                      <span className="text-xs font-semibold text-slate-800">{minLen}</span>
                      <button
                        type="button"
                        onClick={handleIncrement}
                        className="flex h-7 w-7 items-center justify-center rounded bg-slate-50 text-slate-600 hover:bg-slate-100 transition-colors"
                      >
                        <Plus size={12} />
                      </button>
                    </div>
                    <input type="hidden" {...register('minPasswordLength', { valueAsNumber: true })} />
                  </div>
                </div>
              </SettingsSectionCard>
            </div>
          )}

          {/* PERMISSIONS TAB */}
          {activeTab === 'permissions' && user?.role === 'superadmin' && (
            <div className="animate-fadeIn">
              <SettingsSectionCard
                title="Permissions des modules"
                subtitle="Définissez précisément les accès par module."
                icon={UserCog}
                headerAction={
                  <div className="flex items-center gap-6">
                    {/* Legend */}
                    <div className="flex items-center gap-4 text-xs text-slate-500 font-medium">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-4 rounded-full bg-teal-600/20 relative flex items-center px-0.5">
                          <div className="w-3 h-3 rounded-full bg-teal-600 absolute right-0.5" />
                        </div>
                        <span>Activé</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-4 rounded-full bg-slate-200 relative flex items-center px-0.5">
                          <div className="w-3 h-3 rounded-full bg-white border border-slate-300 absolute left-0.5" />
                        </div>
                        <span>Désactivé</span>
                      </div>
                    </div>
                  </div>
                }
              >
                {/* Role Selector Segment Control */}
                <div className="flex flex-wrap gap-2 border-b border-slate-100 pb-5 mb-5">
                  <button
                    type="button"
                    onClick={() => setSelectedRole('admin')}
                    className={cn(
                      "px-4 py-2 text-xs font-bold rounded-xl transition-all border",
                      selectedRole === 'admin'
                        ? "bg-teal-600 border-teal-600 text-white shadow-md shadow-teal-600/10"
                        : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                    )}
                  >
                    Administrateur
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedRole('department_manager')}
                    className={cn(
                      "px-4 py-2 text-xs font-bold rounded-xl transition-all border",
                      selectedRole === 'department_manager'
                        ? "bg-teal-600 border-teal-600 text-white shadow-md shadow-teal-600/10"
                        : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                    )}
                  >
                    Responsable Département
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedRole('department_member')}
                    className={cn(
                      "px-4 py-2 text-xs font-bold rounded-xl transition-all border",
                      selectedRole === 'department_member'
                        ? "bg-teal-600 border-teal-600 text-white shadow-md shadow-teal-600/10"
                        : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                    )}
                  >
                    Membre Département
                  </button>
                </div>

                {/* User Selector Dropdown */}
                <div className="max-w-md mb-6">
                  <FormFieldWrapper label={`Sélectionner un utilisateur pour personnaliser ses droits (${roleLabels[selectedRole] || selectedRole}) (Optionnel)`}>
                    <AppSelect
                      value={selectedUserId}
                      onChange={(e) => setSelectedUserId(e.target.value)}
                    >
                      <option value="">Tous les utilisateurs (Par défaut pour le rôle)</option>
                      {users
                        .filter((u) => u.role === selectedRole)
                        .map((u) => (
                          <option key={u.id} value={u.id}>
                            {u.fullName} ({u.email})
                          </option>
                        ))}
                    </AppSelect>
                  </FormFieldWrapper>
                </div>

                <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 pt-2">
                  {moduleCards
                    .filter((moduleItem) => {
                      const allowed = configurableModulesPerRole[selectedRole];
                      return allowed ? allowed.includes(moduleItem.key) : false;
                    })
                    .map((moduleItem) => {
                      const currentRolePerms = modulePermissions[selectedRole] || getDefaultRolePermissions()[selectedRole];
                      const currentUserPerms = selectedUserId ? (userPermissions[selectedUserId] || currentRolePerms) : currentRolePerms;
                      const permissions = currentUserPerms[moduleItem.key];

                      return (
                        <ModulePermissionCard
                          key={moduleItem.key}
                          moduleKey={moduleItem.key}
                          label={moduleItem.label}
                          description={moduleItem.description}
                          icon={moduleItem.icon}
                          permissions={permissions}
                          onToggleAll={(checked) => setModuleAllActions(moduleItem.key, checked)}
                          onToggleAction={(action, checked) => setModuleAction(moduleItem.key, action, checked)}
                        />
                      );
                    })}
                </div>
              </SettingsSectionCard>
            </div>
          )}

          {/* BACKUPS TAB */}
          {activeTab === 'backups' && user?.role === 'superadmin' && (
            <div className="max-w-2xl mx-auto animate-fadeIn">
              <SettingsSectionCard
                title="Sauvegardes automatiques"
                subtitle="Gérez l'historique et la fréquence des sauvegardes système."
                icon={Database}
              >
                <div className="space-y-4">
                  <label className="flex items-center justify-between py-3 cursor-pointer select-none">
                    <div>
                      <span className="text-sm font-medium text-slate-800 block">Sauvegarde automatique active</span>
                      <span className="text-xs text-slate-500">Sauvegarder les données de l'église quotidiennement</span>
                    </div>
                    <AppSwitch
                      {...register('autoBackup', {
                        onChange: () => setTimeout(() => handleSubmit(onSubmit)(), 50),
                      })}
                    />
                  </label>
                  <div className="rounded-lg bg-slate-50 p-4 text-xs text-slate-600 space-y-2 border border-slate-100">
                    <p className="font-semibold text-slate-700">Informations de sauvegarde :</p>
                    <p>• Les sauvegardes sont exécutées de manière sécurisée toutes les nuits à 02:00 UTC.</p>
                    <p>• Les fichiers SQL et les médias sont stockés sur un cloud sécurisé avec chiffrement AES-256.</p>
                    <p>• Vous pouvez restaurer vos données en contactant l'administrateur principal de la supervision.</p>
                  </div>
                </div>
              </SettingsSectionCard>
            </div>
          )}

          {/* SYSTEM PROFILE TAB */}
          {activeTab === 'profile' && (
            <div className="max-w-2xl mx-auto animate-fadeIn">
              <SettingsSectionCard
                title="Profil système"
                subtitle="Vue d'ensemble des informations de connexion globale."
                icon={User}
              >
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                      <span className="text-xs text-slate-500 block">Email de contact principal</span>
                      <span className="font-medium text-slate-800">{initialValues.contactEmail}</span>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                      <span className="text-xs text-slate-500 block">Numéro de téléphone</span>
                      <span className="font-medium text-slate-800">{initialValues.contactPhone || 'Non configuré'}</span>
                    </div>
                  </div>
                  <div className="rounded-lg bg-teal-50/50 p-4 text-xs text-teal-800 border border-teal-100">
                    <p className="font-semibold">Gestion du profil individuel</p>
                    <p className="mt-1">Pour modifier vos informations personnelles, votre photo de profil ou vos identifiants de connexion individuels, rendez-vous sur la page dédiée <strong>Profil</strong> dans la barre latérale.</p>
                  </div>
                </div>
              </SettingsSectionCard>
            </div>
          )}

        </div>
      </div>

      {/* Modal Dialog for editing General Information */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          reset(initialValues);
        }}
        title="Modifier les informations générales"
        className="max-w-3xl"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="space-y-4">
            {/* Nom de l'église, Code, Responsable */}
            <div className="grid gap-4 md:grid-cols-3">
              <SettingsInput label="Nom de l'église" error={errors.churchName?.message} required icon={Church}>
                <AppInput className="pl-9" {...register('churchName')} />
              </SettingsInput>
              <SettingsInput label="Code extension" error={errors.churchCode?.message} required icon={Network}>
                <AppInput className="pl-9" {...register('churchCode')} />
              </SettingsInput>
              <SettingsInput label="Responsable / Pasteur" error={errors.pastorName?.message} icon={User}>
                <AppInput className="pl-9" {...register('pastorName')} />
              </SettingsInput>
            </div>

            {/* Email de contact, Téléphone */}
            <div className="grid gap-4 md:grid-cols-2">
              <SettingsInput label="Email de contact" error={errors.contactEmail?.message} required icon={Mail}>
                <AppInput type="email" className="pl-9 bg-slate-50 cursor-not-allowed" {...register('contactEmail')} disabled />
              </SettingsInput>
              <SettingsInput label="Téléphone" error={errors.contactPhone?.message} required icon={Phone}>
                <AppInput className="pl-9" {...register('contactPhone')} />
              </SettingsInput>
            </div>

            {/* Ville, Pays, Adresse */}
            <div className="grid gap-4 md:grid-cols-4">
              <SettingsInput label="Ville" error={errors.city?.message} required icon={MapPin}>
                <AppInput className="pl-9" {...register('city')} />
              </SettingsInput>
              <SettingsInput label="Pays" error={errors.country?.message} required icon={Globe}>
                <AppInput className="pl-9" {...register('country')} />
              </SettingsInput>
              <div className="md:col-span-2">
                <SettingsInput label="Adresse détaillée" error={errors.addressLine?.message} icon={Home}>
                  <AppInput className="pl-9" {...register('addressLine')} />
                </SettingsInput>
              </div>
            </div>

            {/* Fuseau horaire */}
            <SettingsInput label="Fuseau horaire" error={errors.timezone?.message} required icon={Clock}>
              <AppSelect className="pl-9" {...register('timezone')}>
                <option value="Africa/Lubumbashi">Africa/Lubumbashi</option>
                <option value="Africa/Kinshasa">Africa/Kinshasa</option>
                <option value="Europe/Paris">Europe/Paris</option>
              </AppSelect>
            </SettingsInput>
          </div>

          {/* Modal Actions */}
          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 mt-5">
            <AppButton
              type="button"
              variant="secondary"
              onClick={() => {
                setIsModalOpen(false);
                reset(initialValues);
              }}
              className="cursor-pointer"
            >
              Annuler
            </AppButton>
            <AppButton
              type="submit"
              className="bg-teal-600 hover:bg-teal-700 text-white cursor-pointer"
              isLoading={isSaving}
            >
              Enregistrer
            </AppButton>
          </div>
        </form>
      </Modal>

    </div>
  );
}

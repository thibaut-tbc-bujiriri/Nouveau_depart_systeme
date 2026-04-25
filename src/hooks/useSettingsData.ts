import { useAuth } from '@/hooks/useAuth';
import { useBranches } from '@/hooks/useBranches';
import { supabase } from '@/lib/supabaseClient';
import { updateCurrentProfile } from '@/services/profile.service';
import { useEffect, useMemo, useState } from 'react';

export type ModulePermissionAction = 'view' | 'create' | 'update' | 'delete';

export const modulePermissionKeys = [
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
] as const;

export type ModulePermissionKey = (typeof modulePermissionKeys)[number];

export interface ModulePermissionEntry {
  view: boolean;
  create: boolean;
  update: boolean;
  delete: boolean;
}

export type ModulePermissionMap = Record<ModulePermissionKey, ModulePermissionEntry>;

const MODULE_PERMISSIONS_STORAGE_KEY = 'ecnd.module_permissions';

const getDefaultModulePermissions = (): ModulePermissionMap => ({
  dashboard: { view: true, create: false, update: false, delete: false },
  branches: { view: true, create: true, update: true, delete: true },
  users: { view: true, create: true, update: true, delete: true },
  members: { view: true, create: true, update: true, delete: true },
  departments: { view: true, create: true, update: true, delete: true },
  finances: { view: true, create: true, update: true, delete: true },
  services: { view: true, create: true, update: true, delete: true },
  events: { view: true, create: true, update: true, delete: true },
  reports: { view: true, create: true, update: true, delete: true },
  settings: { view: true, create: true, update: true, delete: false },
  profile: { view: true, create: false, update: true, delete: false },
});

function sanitizeModulePermissions(value: unknown): ModulePermissionMap {
  const defaults = getDefaultModulePermissions();

  if (!value || typeof value !== 'object') {
    return defaults;
  }

  const source = value as Record<string, unknown>;
  return modulePermissionKeys.reduce<ModulePermissionMap>((acc, key) => {
    const current = source[key];
    const currentAsObject =
      current && typeof current === 'object' ? (current as Record<string, unknown>) : ({} as Record<string, unknown>);

    acc[key] = {
      view: typeof currentAsObject.view === 'boolean' ? currentAsObject.view : defaults[key].view,
      create: typeof currentAsObject.create === 'boolean' ? currentAsObject.create : defaults[key].create,
      update: typeof currentAsObject.update === 'boolean' ? currentAsObject.update : defaults[key].update,
      delete: typeof currentAsObject.delete === 'boolean' ? currentAsObject.delete : defaults[key].delete,
    };

    return acc;
  }, getDefaultModulePermissions());
}

function getModulePermissionsFromLocalStorage(): ModulePermissionMap {
  try {
    if (typeof window === 'undefined') {
      return getDefaultModulePermissions();
    }

    const raw = window.localStorage.getItem(MODULE_PERMISSIONS_STORAGE_KEY);
    if (!raw) {
      return getDefaultModulePermissions();
    }

    return sanitizeModulePermissions(JSON.parse(raw) as unknown);
  } catch {
    return getDefaultModulePermissions();
  }
}

function persistModulePermissionsInLocalStorage(value: ModulePermissionMap) {
  try {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(MODULE_PERMISSIONS_STORAGE_KEY, JSON.stringify(value));
    }
  } catch {
    // Ignore local storage errors.
  }
}

function isMissingColumnError(error: unknown, columnName: string): boolean {
  if (!error || typeof error !== 'object') {
    return false;
  }

  const candidate = error as { message?: unknown; code?: unknown; details?: unknown; hint?: unknown };
  const message = [candidate.message, candidate.details, candidate.hint]
    .filter((part) => typeof part === 'string')
    .join(' ')
    .toLowerCase();
  const code = typeof candidate.code === 'string' ? candidate.code : '';

  return code === '42703' || code === 'PGRST204' || (message.includes(columnName.toLowerCase()) && message.includes('column'));
}

export interface SettingsFormValues {
  churchName: string;
  churchCode: string;
  pastorName: string;
  contactEmail: string;
  contactPhone: string;
  addressLine: string;
  city: string;
  country: string;
  timezone: string;
  currency: 'USD' | 'CDF';
  language: 'fr' | 'en';
  notificationsEmail: boolean;
  notificationsSms: boolean;
  weeklySummary: boolean;
  autoBackup: boolean;
  strongPassword: boolean;
  minPasswordLength: number;
}

interface StoredSettings {
  churchName?: string;
  churchCode?: string;
  pastorName?: string;
  contactEmail?: string;
  contactPhone?: string;
  addressLine?: string;
  city?: string;
  country?: string;
  timezone?: string;
  currency?: 'USD' | 'CDF';
  language?: 'fr' | 'en';
  notificationsEmail?: boolean;
  notificationsSms?: boolean;
  weeklySummary?: boolean;
  autoBackup?: boolean;
  strongPassword?: boolean;
  minPasswordLength?: number;
  modulePermissions?: ModulePermissionMap;
}

function mapAppSettingsRowToStoredSettings(row: Record<string, unknown> | null | undefined): StoredSettings {
  if (!row) {
    return {};
  }

  const rawModulePermissions =
    typeof row.module_permissions === 'string'
      ? (() => {
          try {
            return JSON.parse(row.module_permissions) as unknown;
          } catch {
            return null;
          }
        })()
      : row.module_permissions;

  return {
    churchName: typeof row.church_name === 'string' ? row.church_name : undefined,
    churchCode: typeof row.church_code === 'string' ? row.church_code : undefined,
    pastorName: typeof row.pastor_name === 'string' ? row.pastor_name : undefined,
    contactEmail: typeof row.contact_email === 'string' ? row.contact_email : undefined,
    contactPhone: typeof row.contact_phone === 'string' ? row.contact_phone : undefined,
    addressLine: typeof row.address_line === 'string' ? row.address_line : undefined,
    city: typeof row.city === 'string' ? row.city : undefined,
    country: typeof row.country === 'string' ? row.country : undefined,
    timezone: typeof row.timezone === 'string' ? row.timezone : undefined,
    currency: row.currency === 'CDF' ? 'CDF' : row.currency === 'USD' ? 'USD' : undefined,
    language: row.language === 'en' ? 'en' : row.language === 'fr' ? 'fr' : undefined,
    notificationsEmail: typeof row.notifications_email === 'boolean' ? row.notifications_email : undefined,
    notificationsSms: typeof row.notifications_sms === 'boolean' ? row.notifications_sms : undefined,
    weeklySummary: typeof row.weekly_summary === 'boolean' ? row.weekly_summary : undefined,
    autoBackup: typeof row.auto_backup === 'boolean' ? row.auto_backup : undefined,
    strongPassword: typeof row.strong_password === 'boolean' ? row.strong_password : undefined,
    minPasswordLength:
      typeof row.min_password_length === 'number' && Number.isFinite(row.min_password_length)
        ? row.min_password_length
        : undefined,
    modulePermissions: sanitizeModulePermissions(rawModulePermissions),
  };
}

export function useSettingsData() {
  const { user } = useAuth();
  const { branches, isLoading: isBranchesLoading } = useBranches();
  const [stored, setStored] = useState<StoredSettings>({});
  const [isPrefsLoading, setIsPrefsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [modulePermissions, setModulePermissions] = useState<ModulePermissionMap>(getDefaultModulePermissions());

  const branch = useMemo(() => branches.find((item) => item.id === user?.branchId), [branches, user?.branchId]);

  useEffect(() => {
    let isMounted = true;

    const loadSettings = async () => {
      if (!user?.id) {
        if (isMounted) {
          setStored({});
          setModulePermissions(getModulePermissionsFromLocalStorage());
          setIsPrefsLoading(false);
        }
        return;
      }

      setIsPrefsLoading(true);
      const scopedQuery = user.branchId
        ? supabase.from('app_settings').select('*').eq('branch_id', user.branchId).maybeSingle()
        : supabase.from('app_settings').select('*').is('branch_id', null).maybeSingle();
      const { data, error } = await scopedQuery;

      if (!isMounted) {
        return;
      }

      if (error && error.code !== 'PGRST116') {
        setStored({});
        setModulePermissions(getModulePermissionsFromLocalStorage());
        setIsPrefsLoading(false);
        return;
      }

      if (!data && user.branchId) {
        const { data: globalData } = await supabase.from('app_settings').select('*').is('branch_id', null).maybeSingle();
        const globalStored = mapAppSettingsRowToStoredSettings(globalData as Record<string, unknown> | null);
        setStored(globalStored);
        setModulePermissions(globalStored.modulePermissions ?? getModulePermissionsFromLocalStorage());
        setIsPrefsLoading(false);
        return;
      }

      const mapped = mapAppSettingsRowToStoredSettings(data as Record<string, unknown> | null);
      setStored(mapped);
      setModulePermissions(mapped.modulePermissions ?? getModulePermissionsFromLocalStorage());
      setIsPrefsLoading(false);
    };

    void loadSettings();
    return () => {
      isMounted = false;
    };
  }, [user?.id, user?.branchId]);

  const initialValues = useMemo<SettingsFormValues>(
    () => ({
      churchName: stored.churchName ?? branch?.name ?? 'ECND',
      churchCode: stored.churchCode ?? branch?.code ?? 'ECND',
      pastorName: stored.pastorName ?? branch?.pastorName ?? '',
      contactEmail: stored.contactEmail ?? user?.email ?? '',
      contactPhone: stored.contactPhone ?? user?.phone ?? '',
      addressLine: stored.addressLine ?? '',
      city: stored.city ?? branch?.city ?? 'Goma',
      country: stored.country ?? branch?.country ?? 'RDC',
      timezone: stored.timezone ?? 'Africa/Lubumbashi',
      currency: stored.currency ?? 'USD',
      language: stored.language ?? 'fr',
      notificationsEmail: stored.notificationsEmail ?? true,
      notificationsSms: stored.notificationsSms ?? false,
      weeklySummary: stored.weeklySummary ?? true,
      autoBackup: stored.autoBackup ?? true,
      strongPassword: stored.strongPassword ?? true,
      minPasswordLength: stored.minPasswordLength ?? 8,
    }),
    [branch, stored, user?.email, user?.phone],
  );

  const saveSettings = async (values: SettingsFormValues) => {
    if (!user) {
      setSaveError('Session absente.');
      return false;
    }

    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(null);

    try {
      const updatedProfile = await updateCurrentProfile(user.id, {
        fullName: user.fullName,
        phone: values.contactPhone,
      });
      if (!updatedProfile) {
        throw new Error('Profil introuvable apres mise a jour.');
      }

      if (user.branchId) {
        const { error: branchError } = await supabase
          .from('branches')
          .update({
            name: values.churchName,
            code: values.churchCode,
            pastor_name: values.pastorName || null,
            city: values.city,
            country: values.country,
          })
          .eq('id', user.branchId);
        if (branchError) {
          throw branchError;
        }
      }

      const payload = {
        branch_id: user.branchId || null,
        church_name: values.churchName,
        church_code: values.churchCode,
        pastor_name: values.pastorName || null,
        contact_email: values.contactEmail || null,
        contact_phone: values.contactPhone || null,
        address_line: values.addressLine || null,
        city: values.city,
        country: values.country,
        timezone: values.timezone,
        currency: values.currency,
        language: values.language,
        notifications_email: values.notificationsEmail,
        notifications_sms: values.notificationsSms,
        weekly_summary: values.weeklySummary,
        auto_backup: values.autoBackup,
        strong_password: values.strongPassword,
        min_password_length: values.minPasswordLength,
        module_permissions: modulePermissions,
        updated_by: user.id,
      };

      const existingQuery = user.branchId
        ? supabase.from('app_settings').select('id').eq('branch_id', user.branchId).maybeSingle()
        : supabase.from('app_settings').select('id').is('branch_id', null).maybeSingle();
      const { data: existingRow, error: existingError } = await existingQuery;
      if (existingError && existingError.code !== 'PGRST116') {
        throw existingError;
      }

      if (existingRow?.id) {
        let usedFallbackWithoutModulePermissions = false;
        const { error: updateSettingsError } = await supabase
          .from('app_settings')
          .update(payload)
          .eq('id', existingRow.id);

        if (updateSettingsError && isMissingColumnError(updateSettingsError, 'module_permissions')) {
          usedFallbackWithoutModulePermissions = true;
          const { module_permissions: _modulePermissions, ...fallbackPayload } = payload;
          const { error: fallbackUpdateError } = await supabase
            .from('app_settings')
            .update(fallbackPayload)
            .eq('id', existingRow.id);

          if (fallbackUpdateError) {
            throw fallbackUpdateError;
          }
        } else if (updateSettingsError) {
          throw updateSettingsError;
        }

        persistModulePermissionsInLocalStorage(modulePermissions);
        setStored(mapAppSettingsRowToStoredSettings(payload as unknown as Record<string, unknown>));
        setSaveSuccess(
          usedFallbackWithoutModulePermissions
            ? 'Parametres sauvegardes. Les droits modules sont stockes localement (colonne module_permissions absente en base).'
            : 'Parametres sauvegardes avec succes.',
        );
      } else {
        let usedFallbackWithoutModulePermissions = false;
        const { error: insertSettingsError } = await supabase
          .from('app_settings')
          .insert({
            ...payload,
            created_by: user.id,
          });

        if (insertSettingsError && isMissingColumnError(insertSettingsError, 'module_permissions')) {
          usedFallbackWithoutModulePermissions = true;
          const { module_permissions: _modulePermissions, ...fallbackPayload } = payload;
          const { error: fallbackInsertError } = await supabase
            .from('app_settings')
            .insert({
              ...fallbackPayload,
              created_by: user.id,
            });

          if (fallbackInsertError) {
            throw fallbackInsertError;
          }
        } else if (insertSettingsError) {
          throw insertSettingsError;
        }

        persistModulePermissionsInLocalStorage(modulePermissions);
        setStored(mapAppSettingsRowToStoredSettings(payload as unknown as Record<string, unknown>));
        setSaveSuccess(
          usedFallbackWithoutModulePermissions
            ? 'Parametres sauvegardes. Les droits modules sont stockes localement (colonne module_permissions absente en base).'
            : 'Parametres sauvegardes avec succes.',
        );
      }

      return true;
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'Erreur lors de la sauvegarde des parametres.');
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  return {
    initialValues,
    isLoading: isBranchesLoading || isPrefsLoading,
    isSaving,
    saveError,
    saveSuccess,
    modulePermissions,
    setModulePermissions,
    saveSettings,
  };
}


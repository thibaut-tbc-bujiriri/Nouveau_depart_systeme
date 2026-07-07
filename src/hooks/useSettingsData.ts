import { useAuth } from '@/hooks/useAuth';
import { useBranches } from '@/hooks/useBranches';
import { supabase } from '@/lib/supabaseClient';
import { updateCurrentProfile } from '@/services/profile.service';
import { useEffect, useMemo, useState, useRef } from 'react';

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
export type ConfigurableRole = 'admin' | 'department_manager' | 'department_member';
export type RoleModulePermissionsMap = Record<ConfigurableRole, ModulePermissionMap>;

const ROLE_PERMISSIONS_STORAGE_KEY = 'ecnd.role_permissions';

export const getDefaultRolePermissions = (): RoleModulePermissionsMap => ({
  admin: {
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
  },
  department_manager: {
    dashboard: { view: true, create: false, update: false, delete: false },
    branches: { view: false, create: false, update: false, delete: false },
    users: { view: false, create: false, update: false, delete: false },
    members: { view: true, create: true, update: true, delete: false },
    departments: { view: true, create: false, update: true, delete: false },
    finances: { view: false, create: false, update: false, delete: false },
    services: { view: true, create: true, update: true, delete: true },
    events: { view: true, create: true, update: true, delete: true },
    reports: { view: true, create: true, update: true, delete: false },
    settings: { view: false, create: false, update: false, delete: false },
    profile: { view: true, create: false, update: true, delete: false },
  },
  department_member: {
    dashboard: { view: true, create: false, update: false, delete: false },
    branches: { view: false, create: false, update: false, delete: false },
    users: { view: false, create: false, update: false, delete: false },
    members: { view: false, create: false, update: false, delete: false },
    departments: { view: true, create: false, update: false, delete: false },
    finances: { view: false, create: false, update: false, delete: false },
    services: { view: false, create: false, update: false, delete: false },
    events: { view: false, create: false, update: false, delete: false },
    reports: { view: false, create: false, update: false, delete: false },
    settings: { view: false, create: false, update: false, delete: false },
    profile: { view: true, create: false, update: true, delete: false },
  },
});

function sanitizeSingleModulePermissions(value: unknown, defaults: ModulePermissionMap): ModulePermissionMap {
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
  }, { ...defaults });
}

function sanitizeRoleModulePermissions(value: unknown): RoleModulePermissionsMap {
  const defaults = getDefaultRolePermissions();

  if (!value || typeof value !== 'object') {
    return defaults;
  }

  const obj = value as Record<string, unknown>;
  const isOldFormat = 'dashboard' in obj || 'branches' in obj || 'users' in obj;

  if (isOldFormat) {
    return {
      admin: sanitizeSingleModulePermissions(obj, defaults.admin),
      department_manager: defaults.department_manager,
      department_member: defaults.department_member,
    };
  }

  return {
    admin: sanitizeSingleModulePermissions(obj.admin, defaults.admin),
    department_manager: sanitizeSingleModulePermissions(obj.department_manager, defaults.department_manager),
    department_member: sanitizeSingleModulePermissions(obj.department_member, defaults.department_member),
  };
}

export function getRolePermissionsFromLocalStorage(): RoleModulePermissionsMap {
  try {
    if (typeof window === 'undefined') {
      return getDefaultRolePermissions();
    }

    const raw = window.localStorage.getItem(ROLE_PERMISSIONS_STORAGE_KEY);
    if (!raw) {
      return getDefaultRolePermissions();
    }

    return sanitizeRoleModulePermissions(JSON.parse(raw) as unknown);
  } catch {
    return getDefaultRolePermissions();
  }
}

export function persistRolePermissionsInLocalStorage(value: RoleModulePermissionsMap) {
  try {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(ROLE_PERMISSIONS_STORAGE_KEY, JSON.stringify(value));
      window.dispatchEvent(new Event('storage'));
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
  exchangeRate: number;
  notificationsEmail: boolean;
  notificationsSms: boolean;
  weeklySummary: boolean;
  autoBackup: boolean;
  strongPassword: boolean;
  minPasswordLength: number;
}

export type UserPermissionsMap = Record<string, ModulePermissionMap>;

export interface StoredSettings {
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
  exchangeRate?: number;
  notificationsEmail?: boolean;
  notificationsSms?: boolean;
  weeklySummary?: boolean;
  autoBackup?: boolean;
  strongPassword?: boolean;
  minPasswordLength?: number;
  modulePermissions?: RoleModulePermissionsMap;
  userPermissions?: UserPermissionsMap;
  metadata?: Record<string, any>;
}

export function mapAppSettingsRowToStoredSettings(row: Record<string, unknown> | null | undefined): StoredSettings {
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

  const metadata =
    row.metadata && typeof row.metadata === 'object'
      ? (row.metadata as Record<string, any>)
      : typeof row.metadata === 'string'
      ? (() => {
          try {
            return JSON.parse(row.metadata) as Record<string, any>;
          } catch {
            return {};
          }
        })()
      : {};

  let finalPermissions = rawModulePermissions;
  if (finalPermissions === undefined || finalPermissions === null) {
    finalPermissions = metadata.module_permissions;
  }

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
    exchangeRate:
      typeof row.exchange_rate === 'number' && Number.isFinite(row.exchange_rate)
        ? row.exchange_rate
        : undefined,
    notificationsEmail: typeof row.notifications_email === 'boolean' ? row.notifications_email : undefined,
    notificationsSms: typeof row.notifications_sms === 'boolean' ? row.notifications_sms : undefined,
    weeklySummary: typeof row.weekly_summary === 'boolean' ? row.weekly_summary : undefined,
    autoBackup: typeof row.auto_backup === 'boolean' ? row.auto_backup : undefined,
    strongPassword: typeof row.strong_password === 'boolean' ? row.strong_password : undefined,
    minPasswordLength:
      typeof row.min_password_length === 'number' && Number.isFinite(row.min_password_length)
        ? row.min_password_length
        : undefined,
    modulePermissions: sanitizeRoleModulePermissions(finalPermissions),
    metadata,
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
  const [modulePermissions, setModulePermissionsState] = useState<RoleModulePermissionsMap>(getDefaultRolePermissions());
  const modulePermissionsRef = useRef(modulePermissions);
  const [userPermissions, setUserPermissions] = useState<UserPermissionsMap>({});

  const setModulePermissions = (val: RoleModulePermissionsMap | ((current: RoleModulePermissionsMap) => RoleModulePermissionsMap)) => {
    setModulePermissionsState((current) => {
      const next = typeof val === 'function' ? val(current) : val;
      modulePermissionsRef.current = next;
      return next;
    });
  };

  const branch = useMemo(() => branches.find((item) => item.id === user?.branchId), [branches, user?.branchId]);

  useEffect(() => {
    let isMounted = true;

    const loadSettings = async () => {
      if (!user?.id) {
        if (isMounted) {
          setStored({});
          setModulePermissions(getRolePermissionsFromLocalStorage());
          setUserPermissions({});
          setIsPrefsLoading(false);
        }
        return;
      }

      setIsPrefsLoading(true);

      const scopedQuery = user.branchId
        ? supabase.from('app_settings').select('*').eq('branch_id', user.branchId).maybeSingle()
        : supabase.from('app_settings').select('*').is('branch_id', null).maybeSingle();
      
      const [branchResult, globalResult] = await Promise.all([
        scopedQuery,
        supabase.from('app_settings').select('*').is('branch_id', null).maybeSingle()
      ]);

      if (!isMounted) {
        return;
      }

      if (branchResult.error && branchResult.error.code !== 'PGRST116') {
        setStored({});
        setModulePermissions(getRolePermissionsFromLocalStorage());
        setUserPermissions({});
        setIsPrefsLoading(false);
        return;
      }

      const branchData = branchResult.data;
      const globalData = globalResult.data;

      const branchMapped = mapAppSettingsRowToStoredSettings(branchData as Record<string, unknown> | null);
      const globalMapped = mapAppSettingsRowToStoredSettings(globalData as Record<string, unknown> | null);

      const finalStored: StoredSettings = {
        ...globalMapped,
        ...branchMapped,
        // Force permissions to come from global settings
        modulePermissions: globalMapped.modulePermissions ?? branchMapped.modulePermissions,
        userPermissions: globalMapped.userPermissions ?? branchMapped.userPermissions,
        metadata: {
          ...(globalMapped.metadata || {}),
          ...(branchMapped.metadata || {}),
          module_permissions: globalMapped.metadata?.module_permissions ?? branchMapped.metadata?.module_permissions,
          user_permissions: globalMapped.metadata?.user_permissions ?? branchMapped.metadata?.user_permissions,
        }
      };

      setStored(finalStored);
      setModulePermissions(finalStored.modulePermissions ?? getRolePermissionsFromLocalStorage());
      setUserPermissions(finalStored.userPermissions ?? {});

      // Sync local storage to match database settings
      if (finalStored.language) localStorage.setItem('ecnd.pref_language', finalStored.language);
      if (finalStored.currency) localStorage.setItem('ecnd.pref_currency', finalStored.currency);
      if (finalStored.exchangeRate) localStorage.setItem('ecnd.pref_exchange_rate', String(finalStored.exchangeRate));
      if (finalStored.modulePermissions) {
        persistRolePermissionsInLocalStorage(finalStored.modulePermissions);
      }
      if (finalStored.userPermissions && finalStored.userPermissions[user.id]) {
        localStorage.setItem('ecnd.custom_permissions', JSON.stringify(finalStored.userPermissions[user.id]));
      } else {
        localStorage.removeItem('ecnd.custom_permissions');
      }
      window.dispatchEvent(new Event('storage'));

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
      exchangeRate: stored.exchangeRate ?? Number(localStorage.getItem('ecnd.pref_exchange_rate') || '2500'),
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

      // Save settings to localStorage globally
      localStorage.setItem('ecnd.pref_language', values.language);
      localStorage.setItem('ecnd.pref_currency', values.currency);
      localStorage.setItem('ecnd.pref_exchange_rate', String(values.exchangeRate));
      // Dispatch storage event to notify context
      window.dispatchEvent(new Event('storage'));

      const payload: any = {
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
        exchange_rate: values.exchangeRate,
        notifications_email: values.notificationsEmail,
        notifications_sms: values.notificationsSms,
        weekly_summary: values.weeklySummary,
        auto_backup: values.autoBackup,
        strong_password: values.strongPassword,
        min_password_length: values.minPasswordLength,
        module_permissions: modulePermissionsRef.current,
        metadata: {
          ...(stored?.metadata || {}),
          module_permissions: modulePermissionsRef.current,
          user_permissions: userPermissions,
        },
        updated_by: user.id,
      };

      const existingQuery = user.branchId
        ? supabase.from('app_settings').select('id').eq('branch_id', user.branchId).maybeSingle()
        : supabase.from('app_settings').select('id').is('branch_id', null).maybeSingle();
      const { data: existingRow, error: existingError } = await existingQuery;
      if (existingError && existingError.code !== 'PGRST116') {
        throw existingError;
      }

      const executeQuery = async (payloadData: any, isUpdate: boolean, rowId?: string) => {
        let result;
        if (isUpdate) {
          result = await supabase.from('app_settings').update(payloadData).eq('id', rowId);
        } else {
          result = await supabase.from('app_settings').insert({ ...payloadData, created_by: user.id });
        }

        if (result.error) {
          let strippedPayload = { ...payloadData };
          let hasChanges = false;
          
          if (isMissingColumnError(result.error, 'exchange_rate')) {
            delete strippedPayload.exchange_rate;
            hasChanges = true;
          }
          if (isMissingColumnError(result.error, 'module_permissions')) {
            delete strippedPayload.module_permissions;
            strippedPayload.metadata = {
              ...(strippedPayload.metadata || {}),
              module_permissions: payloadData.module_permissions,
            };
            hasChanges = true;
          }

          if (hasChanges) {
            if (isUpdate) {
              result = await supabase.from('app_settings').update(strippedPayload).eq('id', rowId);
            } else {
              result = await supabase.from('app_settings').insert({ ...strippedPayload, created_by: user.id });
            }
            
            if (result.error) {
              let strippedPayload2 = { ...strippedPayload };
              let hasChanges2 = false;
              if (isMissingColumnError(result.error, 'exchange_rate')) {
                delete strippedPayload2.exchange_rate;
                hasChanges2 = true;
              }
              if (isMissingColumnError(result.error, 'module_permissions')) {
                delete strippedPayload2.module_permissions;
                strippedPayload2.metadata = {
                  ...(strippedPayload2.metadata || {}),
                  module_permissions: payloadData.module_permissions,
                };
                hasChanges2 = true;
              }
              if (hasChanges2) {
                if (isUpdate) {
                  result = await supabase.from('app_settings').update(strippedPayload2).eq('id', rowId);
                } else {
                  result = await supabase.from('app_settings').insert({ ...strippedPayload2, created_by: user.id });
                }
              }
            }
          }
        }

        if (result.error) {
          throw result.error;
        }
      };

      if (existingRow?.id) {
        await executeQuery(payload, true, existingRow.id);
      } else {
        await executeQuery(payload, false);
      }

      persistRolePermissionsInLocalStorage(modulePermissions);
      setStored(mapAppSettingsRowToStoredSettings(payload as unknown as Record<string, unknown>));
      setSaveSuccess('Parametres sauvegardes avec succes.');

      return true;
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'Erreur lors de la sauvegarde des parametres.');
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const saveModulePermissionsOnly = async (nextPermissions: RoleModulePermissionsMap) => {
    if (!user) {
      setSaveError('Session absente.');
      return false;
    }

    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(null);

    try {
      persistRolePermissionsInLocalStorage(nextPermissions);

      // Always query the global settings row (where branch_id is null)
      const scopedQuery = supabase.from('app_settings').select('id, metadata').is('branch_id', null).maybeSingle();
      const { data: existingRow } = await scopedQuery;

      const currentMetadata = existingRow?.metadata && typeof existingRow.metadata === 'object' 
        ? (existingRow.metadata as Record<string, any>) 
        : {};

      const payload: any = {
        branch_id: null,
        module_permissions: nextPermissions,
        metadata: {
          ...currentMetadata,
          module_permissions: nextPermissions,
        },
        updated_by: user.id,
      };

      if (existingRow?.id) {
        let { error } = await supabase.from('app_settings').update(payload).eq('id', existingRow.id);
        if (error) {
          if (isMissingColumnError(error, 'module_permissions')) {
            const stripped = {
              branch_id: null,
              metadata: {
                ...currentMetadata,
                module_permissions: nextPermissions,
              },
              updated_by: user.id,
            };
            const res = await supabase.from('app_settings').update(stripped).eq('id', existingRow.id);
            if (res.error) throw res.error;
          } else {
            throw error;
          }
        }
      } else {
        let { error } = await supabase.from('app_settings').insert({ ...payload, created_by: user.id });
        if (error) {
          if (isMissingColumnError(error, 'module_permissions')) {
            const stripped = {
              branch_id: null,
              metadata: {
                ...currentMetadata,
                module_permissions: nextPermissions,
              },
              created_by: user.id,
            };
            const res = await supabase.from('app_settings').insert(stripped);
            if (res.error) throw res.error;
          } else {
            throw error;
          }
        }
      }

      setStored((prev) => ({
        ...prev,
        modulePermissions: nextPermissions,
        metadata: {
          ...(prev?.metadata || {}),
          module_permissions: nextPermissions,
        },
      }));
      setSaveSuccess('Permissions sauvegardées avec succès.');
      return true;
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'Erreur lors de la sauvegarde des permissions.');
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const saveUserPermissionsOnly = async (nextUserPermissions: UserPermissionsMap) => {
    if (!user) {
      setSaveError('Session absente.');
      return false;
    }

    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(null);

    try {
      // Always query the global settings row (where branch_id is null)
      const scopedQuery = supabase.from('app_settings').select('id, metadata').is('branch_id', null).maybeSingle();
      const { data: existingRow } = await scopedQuery;

      const currentMetadata = existingRow?.metadata && typeof existingRow.metadata === 'object' 
        ? (existingRow.metadata as Record<string, any>) 
        : {};

      const payload: any = {
        branch_id: null,
        metadata: {
          ...currentMetadata,
          user_permissions: nextUserPermissions,
        },
        updated_by: user.id,
      };

      if (existingRow?.id) {
        const { error } = await supabase.from('app_settings').update(payload).eq('id', existingRow.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('app_settings').insert({ ...payload, created_by: user.id });
        if (error) throw error;
      }

      setStored((prev) => ({
        ...prev,
        metadata: {
          ...(prev?.metadata || {}),
          user_permissions: nextUserPermissions,
        },
      }));
      setUserPermissions(nextUserPermissions);

      if (nextUserPermissions[user.id]) {
        localStorage.setItem('ecnd.custom_permissions', JSON.stringify(nextUserPermissions[user.id]));
      } else {
        localStorage.removeItem('ecnd.custom_permissions');
      }
      window.dispatchEvent(new Event('storage'));

      setSaveSuccess('Permissions utilisateur sauvegardées avec succès.');
      return true;
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'Erreur lors de la sauvegarde des permissions.');
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
    saveModulePermissionsOnly,
    userPermissions,
    saveUserPermissionsOnly,
  };
}


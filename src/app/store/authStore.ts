import type { Session, User } from '@supabase/supabase-js';
import type { Profile } from '@/types';
import { create } from 'zustand';
import { getSession, signInWithPassword, signOut } from '@/services/auth.service';
import { getCurrentProfile } from '@/services/profile.service';

interface AuthState {
  profile: Profile | null;
  authUser: User | null;
  session: Session | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  initializeAuth: () => Promise<void>;
  refreshFromSession: (session: Session | null) => Promise<void>;
  login: (email: string, password: string) => Promise<{ error: string | null }>;
  logout: () => Promise<void>;
  clearError: () => void;
}

async function syncPermissionsForUser(userId: string) {
  try {
    const { supabase } = await import('@/lib/supabaseClient');
    const { mapAppSettingsRowToStoredSettings } = await import('@/hooks/useSettingsData');
    const { persistRolePermissionsInLocalStorage } = await import('@/hooks/useSettingsData');

    const { data: globalData, error } = await supabase
      .from('app_settings')
      .select('*')
      .is('branch_id', null)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      return;
    }

    if (globalData) {
      const mapped = mapAppSettingsRowToStoredSettings(globalData as Record<string, unknown>);
      if (mapped.language) localStorage.setItem('ecnd.pref_language', mapped.language);
      if (mapped.currency) localStorage.setItem('ecnd.pref_currency', mapped.currency);
      if (mapped.exchangeRate) localStorage.setItem('ecnd.pref_exchange_rate', String(mapped.exchangeRate));
      
      if (mapped.modulePermissions) {
        persistRolePermissionsInLocalStorage(mapped.modulePermissions);
      }
      
      if (mapped.userPermissions && mapped.userPermissions[userId]) {
        localStorage.setItem('ecnd.custom_permissions', JSON.stringify(mapped.userPermissions[userId]));
      } else {
        localStorage.removeItem('ecnd.custom_permissions');
      }
      window.dispatchEvent(new Event('storage'));
    }
  } catch (err) {
    console.error('Error syncing permissions:', err);
  }
}

async function resolveProfileFromSession(session: Session | null) {
  if (!session?.user) {
    return { profile: null, fetchError: null as string | null };
  }

  try {
    const profile = await getCurrentProfile(session.user.id);
    if (profile) {
      await syncPermissionsForUser(session.user.id);
    }
    return { profile, fetchError: null as string | null };
  } catch (error) {
    return {
      profile: null,
      fetchError: error instanceof Error ? error.message : 'Erreur de connexion au serveur.',
    };
  }
}

function resolveAuthError({
  hasSessionUser,
  profile,
  fetchError,
  fallbackMissingProfileMessage,
}: {
  hasSessionUser: boolean;
  profile: Profile | null;
  fetchError: string | null;
  fallbackMissingProfileMessage: string;
}) {
  if (!hasSessionUser) {
    return null;
  }

  if (fetchError) {
    return 'Connexion au serveur impossible. Verifiez internet puis reessayez.';
  }

  if (!profile) {
    return fallbackMissingProfileMessage;
  }

  return null;
}

function toUserFacingAuthErrorMessage(error: unknown) {
  const raw =
    error instanceof Error
      ? error.message
      : typeof error === 'string'
      ? error
      : typeof error === 'object' && error !== null && 'message' in error
      ? String((error as { message?: unknown }).message ?? '')
      : String(error ?? '');
  const normalized = raw.toLowerCase();

  if (
    normalized.includes('failed to fetch') ||
    normalized.includes('network') ||
    normalized.includes('timed out') ||
    normalized.includes('connection')
  ) {
    return 'Connexion au serveur impossible. Verifiez internet puis reessayez.';
  }

  if (normalized.includes('invalid login credentials') || normalized.includes('invalid_credentials')) {
    return 'Connexion refusee. Verifiez email/mot de passe, ou confirmez l email si la confirmation est active.';
  }

  if (normalized.includes('email not confirmed')) {
    return 'Connexion refusee: email non confirme. Ouvrez votre boite mail et confirmez le compte.';
  }

  return raw || 'Une erreur est survenue pendant la connexion.';
}

export const useAuthStore = create<AuthState>((set, get) => ({
  profile: null,
  authUser: null,
  session: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
  initializeAuth: async () => {
    set({ isLoading: true, error: null });

    const { data, error } = await getSession();

    if (error) {
      set({
        session: null,
        authUser: null,
        profile: null,
        isAuthenticated: false,
        isLoading: false,
        error: error.message,
      });
      return;
    }

    const session = data.session;
    const { profile, fetchError } = await resolveProfileFromSession(session);

    set({
      session,
      authUser: session?.user ?? null,
      profile,
      isAuthenticated: Boolean(session?.user),
      isLoading: false,
      error: resolveAuthError({
        hasSessionUser: Boolean(session?.user),
        profile,
        fetchError,
        fallbackMissingProfileMessage: 'Profil introuvable pour cet utilisateur.',
      }),
    });
  },
  refreshFromSession: async (session) => {
    if (!session?.user) {
      set({
        session: null,
        authUser: null,
        profile: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      });
      return;
    }

    const state = get();
    const isSameUser = state.authUser?.id === session.user.id;
    const shouldKeepUiStable = state.isAuthenticated && Boolean(state.profile) && isSameUser;

    if (!shouldKeepUiStable) {
      set({ isLoading: true, error: null });
    }
    const { profile, fetchError } = await resolveProfileFromSession(session);

    set({
      session,
      authUser: session.user,
      profile,
      isAuthenticated: true,
      isLoading: false,
      error: resolveAuthError({
        hasSessionUser: true,
        profile,
        fetchError,
        fallbackMissingProfileMessage: 'Profil introuvable pour cet utilisateur.',
      }),
    });
  },
  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const { data, error } = await signInWithPassword(email, password);

      if (error) {
        const safeError = toUserFacingAuthErrorMessage(error);
        set({ isLoading: false, error: safeError });
        try {
          const { createActivityLog } = await import('@/services/activityLogService');
          await createActivityLog({
            actionType: 'login_failed',
            module: 'auth',
            title: 'Échec de connexion',
            description: `Tentative de connexion échouée pour l'adresse ${email}.`,
            status: 'failed',
            metadata: { email }
          });
        } catch (err) {
          console.error("Log login failed error:", err);
        }
        return { error: safeError };
      }

      const session = data.session;
      const { profile, fetchError } = await resolveProfileFromSession(session);
      const resolvedError = resolveAuthError({
        hasSessionUser: Boolean(data.user),
        profile,
        fetchError,
        fallbackMissingProfileMessage: 'Connexion reussie, mais profil introuvable.',
      });

      if (data.session) {
        localStorage.setItem('ecnd.current_session_password', btoa(password));
      }

      set({
        session,
        authUser: data.user,
        profile,
        isAuthenticated: Boolean(data.user),
        isLoading: false,
        error: resolvedError,
      });

      try {
        const { createActivityLog } = await import('@/services/activityLogService');
        await createActivityLog({
          actionType: 'login_success',
          module: 'auth',
          title: 'Connexion réussie',
          description: `L'utilisateur ${profile?.fullName || email} s'est connecté.`,
          status: 'success',
          metadata: { email }
        });
      } catch (err) {
        console.error("Log login success error:", err);
      }

      return { error: resolvedError };
    } catch (error) {
      const safeError = toUserFacingAuthErrorMessage(error);
      set({
        session: null,
        authUser: null,
        profile: null,
        isAuthenticated: false,
        isLoading: false,
        error: safeError,
      });
      try {
        const { createActivityLog } = await import('@/services/activityLogService');
        await createActivityLog({
          actionType: 'login_failed',
          module: 'auth',
          title: 'Échec de connexion',
          description: `Tentative de connexion échouée pour l'adresse ${email}.`,
          status: 'failed',
          metadata: { email }
        });
      } catch (err) {
        console.error("Log login failed error:", err);
      }
      return { error: safeError };
    }
  },
  logout: async () => {
    try {
      const { createActivityLog } = await import('@/services/activityLogService');
      await createActivityLog({
        actionType: 'logout',
        module: 'auth',
        title: 'Déconnexion',
        description: 'L\'utilisateur s\'est déconnecté de la plateforme.',
        status: 'success'
      });
    } catch (err) {
      console.error("Log logout error:", err);
    }

    await signOut();
    localStorage.removeItem('ecnd.current_session_password');
    set({
      session: null,
      authUser: null,
      profile: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    });
  },
  clearError: () => set({ error: null }),
}));


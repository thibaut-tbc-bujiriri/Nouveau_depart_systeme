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

async function resolveProfileFromSession(session: Session | null) {
  if (!session?.user) {
    return null;
  }

  return getCurrentProfile(session.user.id);
}

export const useAuthStore = create<AuthState>((set) => ({
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
    const profile = await resolveProfileFromSession(session);

    set({
      session,
      authUser: session?.user ?? null,
      profile,
      isAuthenticated: Boolean(session?.user),
      isLoading: false,
      error: session?.user && !profile ? 'Profil introuvable pour cet utilisateur.' : null,
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

    set({ isLoading: true, error: null });
    const profile = await resolveProfileFromSession(session);

    set({
      session,
      authUser: session.user,
      profile,
      isAuthenticated: true,
      isLoading: false,
      error: profile ? null : 'Profil introuvable pour cet utilisateur.',
    });
  },
  login: async (email, password) => {
    set({ isLoading: true, error: null });
    const { data, error } = await signInWithPassword(email, password);

    if (error) {
      set({ isLoading: false, error: error.message });
      return { error: error.message };
    }

    const session = data.session;
    const profile = await resolveProfileFromSession(session);

    set({
      session,
      authUser: data.user,
      profile,
      isAuthenticated: Boolean(data.user),
      isLoading: false,
      error: profile ? null : 'Connexion reussie, mais profil introuvable.',
    });

    return { error: profile ? null : 'Profil utilisateur non trouve.' };
  },
  logout: async () => {
    await signOut();
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


import { useAuthStore } from '@/app/store/authStore';

export const useAuth = () => {
  const profile = useAuthStore((state) => state.profile);
  const authUser = useAuthStore((state) => state.authUser);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isLoading = useAuthStore((state) => state.isLoading);
  const error = useAuthStore((state) => state.error);
  const initializeAuth = useAuthStore((state) => state.initializeAuth);
  const refreshFromSession = useAuthStore((state) => state.refreshFromSession);
  const login = useAuthStore((state) => state.login);
  const logout = useAuthStore((state) => state.logout);
  const clearError = useAuthStore((state) => state.clearError);

  return {
    user: profile,
    authUser,
    isAuthenticated,
    isLoading,
    error,
    initializeAuth,
    refreshFromSession,
    login,
    logout,
    clearError,
  };
};


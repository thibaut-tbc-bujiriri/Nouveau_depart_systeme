import { useAuthStore } from '@/app/store/authStore';

export function useCurrentProfile() {
  const profile = useAuthStore((state) => state.profile);
  const isLoading = useAuthStore((state) => state.isLoading);
  const error = useAuthStore((state) => state.error);

  return {
    profile,
    isLoading,
    error,
  };
}


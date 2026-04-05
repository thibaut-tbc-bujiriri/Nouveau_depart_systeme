import { onAuthStateChange } from '@/services/auth.service';
import { useEffect } from 'react';
import { useAuthStore } from '@/app/store/authStore';
import { AppRouter } from '@/app/router/AppRouter';
import { BrowserRouter } from 'react-router-dom';

export function AppProviders() {
  const initializeAuth = useAuthStore((state) => state.initializeAuth);
  const refreshFromSession = useAuthStore((state) => state.refreshFromSession);

  useEffect(() => {
    void initializeAuth();

    const { data: subscription } = onAuthStateChange((_event, session) => {
      void refreshFromSession(session);
    });

    return () => {
      subscription.subscription.unsubscribe();
    };
  }, [initializeAuth, refreshFromSession]);

  return (
    <BrowserRouter>
      <AppRouter />
    </BrowserRouter>
  );
}


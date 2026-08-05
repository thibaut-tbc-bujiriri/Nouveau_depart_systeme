import { onAuthStateChange } from '@/services/auth.service';
import { useEffect } from 'react';
import { useAuthStore } from '@/app/store/authStore';
import { AppRouter } from '@/app/router/AppRouter';
import { PwaInstallPrompt } from '@/components/common/PwaInstallPrompt';
import { BrowserRouter } from 'react-router-dom';
import { PreferencesProvider } from '@/contexts/PreferencesContext';
import { ToastProvider } from '@/components/ui';

export function AppProviders() {
  const initializeAuth = useAuthStore((state) => state.initializeAuth);
  const refreshFromSession = useAuthStore((state) => state.refreshFromSession);

  useEffect(() => {
    void initializeAuth();

    const { data: subscription } = onAuthStateChange((event, session) => {
      // Ignore high-frequency token refresh events to prevent UI flicker/reload feeling.
      if (event === 'TOKEN_REFRESHED' || event === 'INITIAL_SESSION') {
        return;
      }

      void refreshFromSession(session);
    });

    return () => {
      subscription.subscription.unsubscribe();
    };
  }, [initializeAuth, refreshFromSession]);

  return (
    <PreferencesProvider>
      <ToastProvider>
        <BrowserRouter>
          <AppRouter />
          <PwaInstallPrompt />
        </BrowserRouter>
      </ToastProvider>
    </PreferencesProvider>
  );
}

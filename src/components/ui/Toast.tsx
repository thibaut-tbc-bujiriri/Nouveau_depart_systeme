import { cn } from '@/lib/cn';
import { AlertCircle, CheckCircle2, X } from 'lucide-react';
import { useCallback, useMemo, useState, type PropsWithChildren } from 'react';
import { ToastContext } from './ToastContext';

type ToastType = 'success' | 'error';

interface ToastItem {
  id: string;
  type: ToastType;
  message: string;
}

export function ToastProvider({ children }: PropsWithChildren) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const show = useCallback(
    (type: ToastType, message: string) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      setToasts((current) => [...current, { id, type, message }].slice(-4));
      window.setTimeout(() => dismiss(id), 4500);
    },
    [dismiss],
  );

  const value = useMemo(
    () => ({
      success: (message: string) => show('success', message),
      error: (message: string) => show('error', message),
    }),
    [show],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="toast-viewport" aria-live="polite" aria-atomic="true">
        {toasts.map((toast) => {
          const Icon = toast.type === 'success' ? CheckCircle2 : AlertCircle;
          return (
            <div key={toast.id} className={cn('app-toast', toast.type === 'success' ? 'app-toast-success' : 'app-toast-error')}>
              <Icon className="size-4 shrink-0" />
              <span>{toast.message}</span>
              <button type="button" onClick={() => dismiss(toast.id)} aria-label="Fermer">
                <X className="size-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

import { AppButton } from '@/components/ui/AppButton';
import { cn } from '@/lib/cn';
import { X } from 'lucide-react';
import type { PropsWithChildren } from 'react';

interface ModalProps extends PropsWithChildren {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  className?: string;
}

export function Modal({ isOpen, onClose, title, subtitle, className, children }: ModalProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/50 p-2 sm:items-center sm:p-4">
      <div className={cn('flex max-h-[calc(100dvh-1rem)] w-full max-w-xl flex-col overflow-hidden rounded-xl bg-white shadow-xl sm:max-h-[88vh]', className)}>
        <div className="flex items-start justify-between gap-3 border-b border-slate-200 px-4 py-3 sm:px-5 sm:py-4">
          <div className="min-w-0">
            <h3 className="break-words text-sm font-semibold text-slate-900 sm:text-base">{title}</h3>
            {subtitle && <p className="text-xs text-slate-500 mt-0.5 font-normal">{subtitle}</p>}
          </div>
          <button onClick={onClose} className="shrink-0 rounded-md p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-700" aria-label="Fermer">
            <X className="size-4" />
          </button>
        </div>
        <div className="overflow-y-auto p-4 sm:p-5">{children}</div>
      </div>
    </div>
  );
}

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  description: string;
  onCancel: () => void;
  onConfirm: () => void;
  confirmLabel?: string;
}

export function ConfirmDialog({
  isOpen,
  title,
  description,
  onCancel,
  onConfirm,
  confirmLabel = 'Confirmer',
}: ConfirmDialogProps) {
  return (
    <Modal isOpen={isOpen} onClose={onCancel} title={title} className="max-w-md">
      <p className="text-sm text-slate-600">{description}</p>
      <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <AppButton variant="secondary" onClick={onCancel}>
          Annuler
        </AppButton>
        <AppButton variant="danger" onClick={onConfirm}>
          {confirmLabel}
        </AppButton>
      </div>
    </Modal>
  );
}


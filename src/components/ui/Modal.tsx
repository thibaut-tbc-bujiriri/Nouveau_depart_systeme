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
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/45 p-2 sm:items-center sm:p-4">
      <div
        className={cn(
          'flex max-h-[calc(100dvh-1rem)] w-full max-w-xl flex-col overflow-hidden rounded-[var(--radius-md)] bg-[var(--surface-container-lowest)] shadow-[var(--shadow-card)] sm:max-h-[88vh]',
          className,
        )}
      >
        <div className="flex min-h-[58px] items-center justify-between gap-3 border-b border-[var(--outline)] px-5 py-4">
          <div className="min-w-0">
            <h3 className="break-words font-[var(--font-heading)] text-[15px] font-medium leading-5 text-[var(--on-surface)]">
              {title}
            </h3>
            {subtitle ? <p className="mt-1 text-[var(--text-sm)] text-[var(--on-surface-variant)]">{subtitle}</p> : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid size-7 shrink-0 place-items-center rounded-[var(--radius-md)] bg-transparent text-[var(--on-surface-variant)] transition hover:bg-[var(--surface-container-low)] hover:text-[var(--on-surface)]"
            aria-label="Fermer"
          >
            <X className="size-4" />
          </button>
        </div>
        <div className="overflow-y-auto px-5 py-4">{children}</div>
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
      <p className="text-[var(--text-base)] text-[var(--on-surface-variant)]">{description}</p>
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

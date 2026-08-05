import { cn } from '@/lib/cn';
import type { PropsWithChildren } from 'react';

interface FormFieldWrapperProps extends PropsWithChildren {
  label: string;
  error?: string;
  hint?: string;
  required?: boolean;
  className?: string;
}

export function FormFieldWrapper({
  label,
  error,
  hint,
  required,
  className,
  children,
}: FormFieldWrapperProps) {
  return (
    <label className={cn('flex w-full flex-col gap-1.5 text-[var(--text-sm)]', className)}>
      <span className="font-medium text-[var(--on-surface)]">
        {label}
        {required ? <span className="text-[var(--error)]"> *</span> : null}
      </span>
      {children}
      {error ? <span className="text-[var(--text-sm)] text-[var(--error)]">{error}</span> : null}
      {!error && hint ? <span className="text-[var(--text-sm)] text-[var(--on-surface-variant)]">{hint}</span> : null}
    </label>
  );
}

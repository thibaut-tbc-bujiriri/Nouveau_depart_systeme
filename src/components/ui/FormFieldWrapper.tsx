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
    <label className={cn('flex w-full flex-col gap-1.5 text-sm', className)}>
      <span className="font-medium text-slate-700">
        {label}
        {required ? <span className="text-rose-600"> *</span> : null}
      </span>
      {children}
      {error ? <span className="text-xs text-rose-600">{error}</span> : null}
      {!error && hint ? <span className="text-xs text-slate-500">{hint}</span> : null}
    </label>
  );
}


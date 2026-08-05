import { cn } from '@/lib/cn';
import { Loader2 } from 'lucide-react';
import type { ButtonHTMLAttributes, PropsWithChildren } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

interface AppButtonProps extends ButtonHTMLAttributes<HTMLButtonElement>, PropsWithChildren {
  variant?: Variant;
  size?: Size;
  isLoading?: boolean;
}

const variantClasses: Record<Variant, string> = {
  primary: 'bg-[var(--primary)] text-[var(--on-primary)] hover:bg-[var(--primary-container)]',
  secondary: 'border border-[var(--primary)] bg-[var(--surface-container-lowest)] text-[var(--primary)] hover:bg-[var(--surface-container-low)]',
  ghost: 'bg-transparent text-[var(--on-surface-variant)] hover:bg-[var(--surface-container-low)] hover:text-[var(--on-surface)]',
  danger: 'bg-[var(--error)] text-[var(--on-error)] hover:bg-[var(--error-container)]',
};

const sizeClasses: Record<Size, string> = {
  sm: 'h-8 px-3 text-[var(--text-sm)]',
  md: 'h-9 px-4 text-[var(--text-sm)]',
  lg: 'h-10 px-5 text-[var(--text-base)]',
};

export function AppButton({
  children,
  className,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled,
  ...props
}: AppButtonProps) {
  return (
    <button
      data-variant={variant}
      className={cn(
        'app-button inline-flex items-center justify-center gap-2 rounded-[var(--radius-md)] font-medium leading-none shadow-none transition-colors disabled:cursor-not-allowed disabled:opacity-60',
        variantClasses[variant],
        sizeClasses[size],
        className,
      )}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? <Loader2 className="size-4 animate-spin" /> : null}
      {isLoading ? 'Chargement...' : children}
    </button>
  );
}

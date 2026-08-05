import { cn } from '@/lib/cn';
import { forwardRef, type SelectHTMLAttributes } from 'react';

export const AppSelect = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, children, ...props }, ref) => {
    return (
      <select
        ref={ref}
        className={cn(
          'app-field h-9 w-full rounded-[var(--radius-md)] border border-[var(--outline-variant)] bg-[var(--surface-container-lowest)] px-3 text-[var(--text-base)] text-[var(--on-surface)] outline-none transition focus:border-[#6675e9] focus:ring-0',
          className,
        )}
        {...props}
      >
        {children}
      </select>
    );
  },
);

AppSelect.displayName = 'AppSelect';

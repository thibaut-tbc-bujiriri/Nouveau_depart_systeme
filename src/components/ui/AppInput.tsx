import { cn } from '@/lib/cn';
import { forwardRef, type InputHTMLAttributes } from 'react';

export const AppInput = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={cn(
          'app-field h-9 w-full rounded-[var(--radius-md)] border border-[var(--outline-variant)] bg-[var(--surface-container-lowest)] px-3 text-[var(--text-base)] text-[var(--on-surface)] outline-none transition placeholder:text-[var(--on-surface-variant)] focus:border-[#6675e9] focus:ring-0',
          className,
        )}
        {...props}
      />
    );
  },
);

AppInput.displayName = 'AppInput';

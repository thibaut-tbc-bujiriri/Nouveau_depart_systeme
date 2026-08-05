import { cn } from '@/lib/cn';
import { forwardRef, type TextareaHTMLAttributes } from 'react';

export const AppTextarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        className={cn(
          'app-field min-h-20 w-full rounded-[var(--radius-md)] border border-[var(--outline-variant)] bg-[var(--surface-container-lowest)] px-3 py-2 text-[var(--text-base)] text-[var(--on-surface)] outline-none transition placeholder:text-[var(--on-surface-variant)] focus:border-[#6675e9] focus:ring-0',
          className,
        )}
        {...props}
      />
    );
  },
);

AppTextarea.displayName = 'AppTextarea';

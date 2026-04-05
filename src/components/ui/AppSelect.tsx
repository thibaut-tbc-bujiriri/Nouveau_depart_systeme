import { cn } from '@/lib/cn';
import { forwardRef, type SelectHTMLAttributes } from 'react';

export const AppSelect = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, children, ...props }, ref) => {
    return (
      <select
        ref={ref}
        className={cn(
          'h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200',
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


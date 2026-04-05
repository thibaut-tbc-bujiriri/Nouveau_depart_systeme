import { cn } from '@/lib/cn';
import { forwardRef, type InputHTMLAttributes } from 'react';

export const AppInput = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={cn(
          'h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200',
          className,
        )}
        {...props}
      />
    );
  },
);

AppInput.displayName = 'AppInput';


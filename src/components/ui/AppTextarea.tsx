import { cn } from '@/lib/cn';
import { forwardRef, type TextareaHTMLAttributes } from 'react';

export const AppTextarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        className={cn(
          'w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200',
          className,
        )}
        {...props}
      />
    );
  },
);

AppTextarea.displayName = 'AppTextarea';


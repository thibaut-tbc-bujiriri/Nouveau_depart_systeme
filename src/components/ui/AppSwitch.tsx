import { cn } from '@/lib/cn';
import { forwardRef, type InputHTMLAttributes } from 'react';

export interface AppSwitchProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  // Add any specific props if needed
}

export const AppSwitch = forwardRef<HTMLInputElement, AppSwitchProps>(
  ({ className, checked, onChange, disabled, ...props }, ref) => {
    return (
      <span
        className={cn(
          'relative inline-flex items-center transition-opacity duration-200 select-none',
          disabled ? 'opacity-50' : 'hover:opacity-90',
        )}
      >
        <input
          type="checkbox"
          ref={ref}
          className="sr-only peer"
          checked={checked}
          onChange={onChange}
          disabled={disabled}
          {...props}
        />
        <div
          className={cn(
            "w-11 h-6 bg-slate-200 rounded-full transition-all duration-300 ease-in-out cursor-pointer",
            "peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-teal-100",
            "after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all after:duration-300 after:ease-in-out",
            "peer-checked:bg-teal-600 peer-checked:after:translate-x-full peer-checked:after:border-white",
            disabled && "cursor-not-allowed",
            className,
          )}
        />
      </span>
    );
  },
);

AppSwitch.displayName = 'AppSwitch';

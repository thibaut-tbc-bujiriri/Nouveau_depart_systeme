import logo from '@/assets/ecdn_logo.png';
import { cn } from '@/lib/cn';

interface AppLoaderProps {
  className?: string;
  overlay?: boolean;
  message?: string;
  subMessage?: string;
}

export function AppLoader({
  className,
  overlay = true,
  message = 'Chargement en cours...',
  subMessage = 'Veuillez patienter',
}: AppLoaderProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center transition-all duration-300 ease-in-out',
        overlay ? 'fixed inset-0 z-[9999] backdrop-blur-md bg-white/70' : 'w-full py-12',
        className
      )}
    >
      <div className="relative flex flex-col items-center">
        {/* Loading Spinner Circles */}
        <div className="relative size-48 flex items-center justify-center">
          {/* Outer rotating gradient ring */}
          <div className="absolute inset-0 rounded-full border-4 border-slate-100/50" />
          <div className="absolute inset-0 rounded-full border-4 border-t-cyan-500 border-r-teal-400 border-b-transparent border-l-transparent animate-spin" />
          
          {/* Outer reverse thin navy ring */}
          <div className="absolute -inset-2.5 rounded-full border border-t-slate-800/40 border-r-transparent border-b-slate-800/40 border-l-transparent animate-[spin_3s_linear_infinite_reverse]" />

          {/* Inner Logo circular card container */}
          <div className="relative size-36 bg-white rounded-full shadow-lg flex items-center justify-center border border-slate-100 p-4 transition-transform hover:scale-105 duration-300">
            <img
              src={logo}
              alt="ECND Logo"
              className="size-full object-contain pointer-events-none select-none animate-[pulse_3s_infinite_ease-in-out]"
            />
          </div>
        </div>

        {/* Loading Text */}
        <div className="mt-8 text-center">
          <h3 className="text-xl font-bold text-slate-800 tracking-wide font-sans">
            {message}
          </h3>
          <p className="text-sm font-medium text-slate-500 mt-1.5 font-sans">
            {subMessage}
          </p>
        </div>

        {/* Bouncing teal dots */}
        <div className="flex gap-2 justify-center mt-4">
          <div className="size-2.5 rounded-full bg-teal-500/80 animate-[bounce_1.2s_infinite_100ms]" />
          <div className="size-2.5 rounded-full bg-teal-500/80 animate-[bounce_1.2s_infinite_300ms]" />
          <div className="size-2.5 rounded-full bg-teal-500/80 animate-[bounce_1.2s_infinite_500ms]" />
        </div>
      </div>
    </div>
  );
}

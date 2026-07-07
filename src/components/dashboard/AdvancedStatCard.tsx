import { cn } from '@/lib/cn';
import type { LucideIcon } from 'lucide-react';

interface AdvancedStatCardProps {
  label: string;
  value: string;
  subtitle?: string;
  trend?: number;
  icon: LucideIcon;
  color?: 'teal' | 'blue' | 'purple' | 'orange';
  tone?: string;
}

const colorConfigs = {
  teal: {
    iconCircle: 'bg-teal-500/10 text-teal-600',
    trendColor: 'text-teal-600',
    sparklineStroke: '#0d9488',
    sparklinePath: 'M0,45 C20,10 40,55 60,35 C80,15 100,5 120,20',
  },
  blue: {
    iconCircle: 'bg-blue-500/10 text-blue-600',
    trendColor: 'text-blue-600',
    sparklineStroke: '#2563eb',
    sparklinePath: 'M0,40 C15,45 30,20 45,35 C60,50 75,5 90,15 C105,25 110,10 120,5',
  },
  purple: {
    iconCircle: 'bg-purple-500/10 text-purple-600',
    trendColor: 'text-purple-600',
    sparklineStroke: '#9333ea',
    sparklinePath: 'M0,45 C20,55 40,25 60,40 C80,55 100,5 120,15',
  },
  orange: {
    iconCircle: 'bg-orange-500/10 text-orange-600',
    trendColor: 'text-orange-600',
    sparklineStroke: '#ea580c',
    sparklinePath: 'M0,35 C15,30 30,55 45,30 C60,5 75,45 90,20 C105,-5 110,15 120,5',
  },
};

export function AdvancedStatCard({
  label,
  value,
  subtitle = 'ce mois',
  trend,
  icon: Icon,
  color = 'teal',
}: AdvancedStatCardProps) {
  const config = colorConfigs[color];

  return (
    <div className="relative rounded-2xl border border-slate-200/60 bg-white p-5 shadow-sm transition-all hover:shadow-md flex flex-col justify-between h-[155px] overflow-hidden">
      {/* Top Section */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={cn('grid size-10 place-items-center rounded-full', config.iconCircle)}>
            <Icon className="size-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">{label}</p>
            <p className="text-2xl font-extrabold text-slate-800 mt-0.5">{value}</p>
          </div>
        </div>
      </div>

      {/* Bottom Section */}
      <div className="flex items-end justify-between mt-auto">
        <div className="flex items-center gap-1 text-sm font-semibold">
          {typeof trend === 'number' && (
            <span className={config.trendColor}>
              ↑ {trend}%
            </span>
          )}
          <span className="text-[11px] text-slate-400 font-medium">{subtitle}</span>
        </div>

        {/* Sparkline Decorative SVG */}
        <div className="w-28 h-10 shrink-0">
          <svg className="w-full h-full" viewBox="0 0 120 60" fill="none">
            <path
              d={config.sparklinePath}
              stroke={config.sparklineStroke}
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </div>
    </div>
  );
}

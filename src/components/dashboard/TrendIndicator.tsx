import { cn } from '@/lib/cn';
import { TrendingDown, TrendingUp } from 'lucide-react';

interface TrendIndicatorProps {
  value: number;
  className?: string;
}

export function TrendIndicator({ value, className }: TrendIndicatorProps) {
  const isPositive = value >= 0;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold',
        isPositive ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700',
        className,
      )}
    >
      {isPositive ? <TrendingUp className="size-3.5" /> : <TrendingDown className="size-3.5" />}
      {isPositive ? '+' : ''}
      {value}%
    </span>
  );
}


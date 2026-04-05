import { cn } from '@/lib/cn';
import type { PropsWithChildren } from 'react';

interface SectionCardProps extends PropsWithChildren {
  className?: string;
}

export function SectionCard({ children, className }: SectionCardProps) {
  return <section className={cn('rounded-2xl border border-slate-200 bg-white p-5 shadow-sm', className)}>{children}</section>;
}


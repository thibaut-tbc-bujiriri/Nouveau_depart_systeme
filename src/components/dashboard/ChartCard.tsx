import { DashboardSectionHeader } from '@/components/dashboard/DashboardSectionHeader';
import { SectionCard } from '@/components/dashboard/SectionCard';
import type { PropsWithChildren } from 'react';

interface ChartCardProps extends PropsWithChildren {
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function ChartCard({ title, description, action, className, children }: ChartCardProps) {
  return (
    <SectionCard className={className}>
      <DashboardSectionHeader title={title} description={description} action={action} />
      <div className="h-72">{children}</div>
    </SectionCard>
  );
}


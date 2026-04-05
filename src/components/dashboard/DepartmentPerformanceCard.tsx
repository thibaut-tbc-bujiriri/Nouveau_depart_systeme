import { DashboardSectionHeader } from '@/components/dashboard/DashboardSectionHeader';
import { SectionCard } from '@/components/dashboard/SectionCard';
import type { DepartmentPerformancePoint } from '@/features/dashboard/types';

interface DepartmentPerformanceCardProps {
  items: DepartmentPerformancePoint[];
}

export function DepartmentPerformanceCard({ items }: DepartmentPerformanceCardProps) {
  return (
    <SectionCard>
      <DashboardSectionHeader title="Performance departements" />
      <div className="space-y-3">
        {items.map((item) => (
          <div key={item.departmentId}>
            <div className="mb-1 flex items-center justify-between text-sm">
              <p className="font-medium text-slate-700">{item.departmentName}</p>
              <p className="text-slate-500">
                {item.achieved}/{item.target}
              </p>
            </div>
            <div className="h-2 rounded-full bg-slate-100">
              <div className="h-2 rounded-full bg-emerald-500" style={{ width: `${item.completionRate}%` }} />
            </div>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}


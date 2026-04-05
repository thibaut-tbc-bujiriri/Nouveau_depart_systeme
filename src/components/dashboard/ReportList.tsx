import { DashboardSectionHeader } from '@/components/dashboard/DashboardSectionHeader';
import { SectionCard } from '@/components/dashboard/SectionCard';
import { formatDate } from '@/utils/format';
import type { ReportItem } from '@/features/dashboard/types';

interface ReportListProps {
  reports: ReportItem[];
  title?: string;
}

export function ReportList({ reports, title = 'Rapports recents' }: ReportListProps) {
  const statusClasses = {
    soumis: 'bg-emerald-100 text-emerald-700',
    en_attente: 'bg-amber-100 text-amber-700',
    en_retard: 'bg-rose-100 text-rose-700',
  } as const;

  return (
    <SectionCard>
      <DashboardSectionHeader title={title} />
      <ul className="space-y-2">
        {reports.map((report) => (
          <li key={report.id} className="rounded-xl border border-slate-200 px-3 py-2">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-semibold text-slate-800">{report.title}</p>
              {report.status ? (
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${statusClasses[report.status]}`}>
                  {report.status.replace('_', ' ')}
                </span>
              ) : null}
            </div>
            {report.departmentName ? <p className="mt-0.5 text-xs font-medium text-slate-600">{report.departmentName}</p> : null}
            {report.summary ? <p className="mt-1 text-xs text-slate-500">{report.summary}</p> : null}
            <p className="text-xs text-slate-500">
              {report.period} - {formatDate(report.generatedAt)}
            </p>
          </li>
        ))}
      </ul>
    </SectionCard>
  );
}


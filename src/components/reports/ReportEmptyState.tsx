import { FileWarning } from 'lucide-react';

interface ReportEmptyStateProps {
  title?: string;
  description?: string;
}

export function ReportEmptyState({
  title = 'Aucune donnée disponible',
  description = 'Veuillez modifier vos filtres ou charger de nouvelles données.',
}: ReportEmptyStateProps) {
  return (
    <div className="bg-slate-50 border border-dashed border-slate-300 rounded-2xl p-12 text-center my-6 flex flex-col items-center justify-center">
      <FileWarning className="size-10 text-slate-400 mb-3" />
      <h3 className="text-sm font-bold text-slate-800 mb-1">{title}</h3>
      <p className="text-xs text-slate-500 max-w-sm">{description}</p>
    </div>
  );
}

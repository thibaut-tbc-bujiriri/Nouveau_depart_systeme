import { BarChart3 } from 'lucide-react';

interface EmptyChartStateProps {
  message?: string;
}

export function EmptyChartState({ message = 'Donnees insuffisantes pour afficher le graphique.' }: EmptyChartStateProps) {
  return (
    <div className="grid h-full place-items-center rounded-xl border border-dashed border-slate-300 bg-slate-50 text-center">
      <div>
        <BarChart3 className="mx-auto size-5 text-slate-400" />
        <p className="mt-2 text-sm text-slate-500">{message}</p>
      </div>
    </div>
  );
}


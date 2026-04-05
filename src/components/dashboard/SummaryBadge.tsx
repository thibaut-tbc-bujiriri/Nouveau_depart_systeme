interface SummaryBadgeProps {
  label: string;
  value: string;
}

export function SummaryBadge({ label, value }: SummaryBadgeProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-3 py-2">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="text-sm font-semibold text-slate-800">{value}</p>
    </div>
  );
}


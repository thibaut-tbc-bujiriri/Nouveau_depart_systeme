import React from 'react';

interface ReportFiltersProps {
  children: React.ReactNode;
}

export function ReportFilters({ children }: ReportFiltersProps) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-wrap gap-4 items-end mb-6 print:hidden shadow-sm">
      {children}
    </div>
  );
}

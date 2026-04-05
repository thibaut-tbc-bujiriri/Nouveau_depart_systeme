import { SummaryBadge } from '@/components/dashboard/SummaryBadge';
import { TrendIndicator } from '@/components/dashboard/TrendIndicator';
import { formatCurrency } from '@/utils/format';
import { Wallet } from 'lucide-react';

interface FinanceSummaryCardProps {
  income: number;
  expense: number;
}

export function FinanceSummaryCard({ income, expense }: FinanceSummaryCardProps) {
  const balance = income - expense;
  const trend = income === 0 ? 0 : Number.parseFloat((((balance / income) * 100) / 2).toFixed(1));

  return (
    <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-900 to-slate-700 p-5 text-white shadow-sm">
      <div className="mb-3 flex items-start justify-between gap-2">
        <div>
          <p className="text-sm text-slate-200">Synthese financiere</p>
          <p className="mt-1 text-2xl font-semibold">{formatCurrency(balance)}</p>
        </div>
        <div className="grid size-10 place-items-center rounded-xl bg-white/15">
          <Wallet className="size-5" />
        </div>
      </div>
      <div className="mb-3">
        <TrendIndicator value={trend} className="bg-white/15 text-white" />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <SummaryBadge label="Revenus" value={formatCurrency(income)} />
        <SummaryBadge label="Depenses" value={formatCurrency(expense)} />
      </div>
    </div>
  );
}


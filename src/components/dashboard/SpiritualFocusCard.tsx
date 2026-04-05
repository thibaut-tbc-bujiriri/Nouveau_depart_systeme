import { SectionCard } from '@/components/dashboard/SectionCard';
import type { SpiritualFocus } from '@/features/dashboard/types';
import { Quote, Sparkles } from 'lucide-react';

interface SpiritualFocusCardProps {
  content: SpiritualFocus;
}

export function SpiritualFocusCard({ content }: SpiritualFocusCardProps) {
  return (
    <SectionCard className="bg-gradient-to-r from-emerald-50 via-cyan-50 to-slate-50">
      <div className="grid gap-4 lg:grid-cols-3">
        <article className="rounded-xl border border-emerald-100 bg-white/80 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Verset du jour</p>
          <p className="mt-2 text-sm font-semibold text-slate-900">{content.verseReference}</p>
          <p className="mt-2 text-sm text-slate-700">{content.verseText}</p>
        </article>
        <article className="rounded-xl border border-cyan-100 bg-white/80 p-4">
          <div className="flex items-center gap-2">
            <Sparkles className="size-4 text-cyan-700" />
            <p className="text-xs font-semibold uppercase tracking-wide text-cyan-700">{content.visionTitle}</p>
          </div>
          <p className="mt-2 text-sm text-slate-700">{content.visionText}</p>
        </article>
        <article className="rounded-xl border border-slate-200 bg-white/80 p-4">
          <div className="flex items-center gap-2">
            <Quote className="size-4 text-slate-600" />
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">Message inspirant</p>
          </div>
          <p className="mt-2 text-sm font-medium text-slate-800">{content.inspirationalMessage}</p>
        </article>
      </div>
    </SectionCard>
  );
}


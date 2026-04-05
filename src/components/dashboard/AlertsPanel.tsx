import { DashboardSectionHeader } from '@/components/dashboard/DashboardSectionHeader';
import { SectionCard } from '@/components/dashboard/SectionCard';
import type { SmartAlertItem } from '@/features/dashboard/types';
import { AlertTriangle, Info, Siren } from 'lucide-react';

interface AlertsPanelProps {
  alerts: SmartAlertItem[];
}

const iconMap = {
  warning: AlertTriangle,
  critical: Siren,
  info: Info,
};

const toneMap = {
  warning: 'bg-amber-50 text-amber-700 border-amber-200',
  critical: 'bg-rose-50 text-rose-700 border-rose-200',
  info: 'bg-blue-50 text-blue-700 border-blue-200',
};

export function AlertsPanel({ alerts }: AlertsPanelProps) {
  return (
    <SectionCard>
      <DashboardSectionHeader title="Alertes intelligentes" />
      <ul className="space-y-2">
        {alerts.map((alert) => {
          const Icon = iconMap[alert.level];
          return (
            <li key={alert.id} className={`rounded-xl border px-3 py-2 ${toneMap[alert.level]}`}>
              <div className="flex items-start gap-2">
                <Icon className="mt-0.5 size-4" />
                <div>
                  <p className="text-sm font-semibold">{alert.title}</p>
                  <p className="text-xs">{alert.description}</p>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </SectionCard>
  );
}


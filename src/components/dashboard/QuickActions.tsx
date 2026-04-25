import { DashboardSectionHeader } from '@/components/dashboard/DashboardSectionHeader';
import { SectionCard } from '@/components/dashboard/SectionCard';
import { AppButton } from '@/components/ui';
import { CalendarPlus, FileClock, Landmark, UsersRound } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface QuickActionsProps {
  role: 'superadmin' | 'admin' | 'department_manager' | 'department_member';
}

const actionByRole = {
  superadmin: [
    { id: 'qa-1', icon: UsersRound, label: 'Nouveau membre' },
    { id: 'qa-2', icon: Landmark, label: 'Nouvelle extension' },
    { id: 'qa-3', icon: FileClock, label: 'Generer rapport' },
  ],
  admin: [
    { id: 'qa-4', icon: UsersRound, label: 'Ajouter membre' },
    { id: 'qa-5', icon: CalendarPlus, label: 'Planifier evenement' },
    { id: 'qa-6', icon: FileClock, label: 'Exporter finances' },
  ],
  department_manager: [
    { id: 'qa-7', icon: CalendarPlus, label: 'Ajouter activite' },
    { id: 'qa-8', icon: FileClock, label: 'Envoyer rapport' },
  ],
  department_member: [{ id: 'qa-9', icon: CalendarPlus, label: 'Voir calendrier' }],
};

export function QuickActions({ role }: QuickActionsProps) {
  const navigate = useNavigate();

  const handleActionClick = (actionId: string) => {
    if (actionId === 'qa-1' || actionId === 'qa-4') {
      navigate('/members');
      return;
    }

    if (actionId === 'qa-2') {
      navigate('/branches');
      return;
    }

    if (actionId === 'qa-3' || actionId === 'qa-8') {
      navigate('/reports', { state: { openCreate: true } });
      return;
    }

    if (actionId === 'qa-5' || actionId === 'qa-7') {
      navigate('/events', { state: { openCreate: true } });
      return;
    }

    if (actionId === 'qa-6') {
      navigate('/finances');
      return;
    }

    if (actionId === 'qa-9') {
      navigate('/events');
    }
  };

  return (
    <SectionCard>
      <DashboardSectionHeader title="Actions rapides" />
      <div className="grid gap-2">
        {actionByRole[role].map((action) => {
          const Icon = action.icon;
          return (
            <AppButton
              key={action.id}
              variant="secondary"
              className="justify-start"
              onClick={() => handleActionClick(action.id)}
            >
              <Icon className="size-4" />
              {action.label}
            </AppButton>
          );
        })}
      </div>
    </SectionCard>
  );
}


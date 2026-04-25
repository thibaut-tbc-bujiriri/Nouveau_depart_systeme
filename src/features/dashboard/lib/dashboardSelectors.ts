import type { KpiItem, SpiritualFocus, WeeklyProgramItem } from '@/features/dashboard/types';
import type { Role } from '@/types';

export const roleDashboardConfig: Record<Role, { title: string; subtitle: string }> = {
  superadmin: {
    title: 'Centre de Supervision ECND',
    subtitle: 'Vue globale multi-extensions, finances et activites strategiques.',
  },
  admin: {
    title: 'Pilotage de votre extension',
    subtitle: 'Suivi local des membres, finances et activites de votre eglise.',
  },
  department_manager: {
    title: 'Performance departementale',
    subtitle: 'Suivi des objectifs, de la participation et des activites du departement.',
  },
  department_member: {
    title: 'Espace departement',
    subtitle: 'Vue simplifiee des annonces, activites et calendrier du departement.',
  },
};

export const getSpiritualFocus = (): SpiritualFocus => ({
  verseReference: '',
  verseText: '',
  visionTitle: '',
  visionText: '',
  inspirationalMessage: '',
});

export const getWeeklyProgram = (): WeeklyProgramItem[] => [];

export const getScopedKpis = (): KpiItem[] => [];

import type { Report } from '@/types';

export const reports: Report[] = [
  { id: 'rep-001', branchId: 'branch-goma', title: 'Rapport Financier Mars 2026', type: 'finance', period: 'Mars 2026', summary: 'Revenus en hausse de 12% avec depenses stables.', generatedAt: '2026-04-01' },
  { id: 'rep-002', branchId: 'branch-goma', title: 'Rapport Presence Culte', type: 'attendance', period: 'T1 2026', summary: 'Taux de presence moyen a 87% sur les cultes dominicaux.', generatedAt: '2026-03-30' },
  { id: 'rep-003', branchId: 'branch-lubumbashi', title: 'Rapport Departement Informatique', type: 'department', period: 'Mars 2026', summary: 'Mise a niveau du parc multimedia terminee a 75%.', generatedAt: '2026-03-28' },
  { id: 'rep-004', branchId: 'branch-kinshasa', title: 'Rapport Nouveaux Membres', type: 'members', period: 'T1 2026', summary: '27 nouvelles integrations confirmees.', generatedAt: '2026-03-25' },
];


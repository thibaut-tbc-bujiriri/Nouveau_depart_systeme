import type { Event } from '@/types';

export const events: Event[] = [
  { id: 'evt-001', branchId: 'branch-goma', title: 'Conference des Familles', date: '2026-04-19', location: 'Temple Principal Goma', organizerDepartmentId: 'dep-mamans', status: 'scheduled', expectedParticipants: 400 },
  { id: 'evt-002', branchId: 'branch-lubumbashi', title: 'Formation Equipe Media', date: '2026-04-13', location: 'Salle Annexe L1', organizerDepartmentId: 'dep-info', status: 'scheduled', expectedParticipants: 45 },
  { id: 'evt-003', branchId: 'branch-goma', title: 'Sortie Evangelisation Quartier Katindo', date: '2026-04-08', location: 'Katindo', organizerDepartmentId: 'dep-evangelisation', status: 'scheduled', expectedParticipants: 80 },
  { id: 'evt-004', branchId: 'branch-kinshasa', title: 'Rencontre des Responsables', date: '2026-03-22', location: 'Bureau Administratif', organizerDepartmentId: 'dep-coordination', status: 'completed', expectedParticipants: 35 },
];


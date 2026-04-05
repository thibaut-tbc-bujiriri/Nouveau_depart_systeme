import type { Service } from '@/types';

export const services: Service[] = [
  { id: 'srv-001', branchId: 'branch-goma', title: 'Culte Dominical', date: '2026-04-05', startTime: '08:30', endTime: '11:30', preacher: 'Apotre Jean-Claude Mufungizi', attendance: 610, type: 'sunday' },
  { id: 'srv-002', branchId: 'branch-goma', title: 'Veillee de Priere', date: '2026-04-10', startTime: '21:00', endTime: '00:30', preacher: 'Pasteur Emmanuel Ndoli', attendance: 280, type: 'prayer' },
  { id: 'srv-003', branchId: 'branch-lubumbashi', title: 'Etude Biblique', date: '2026-04-07', startTime: '17:30', endTime: '19:00', preacher: 'Pasteur Joel Mpoyi', attendance: 190, type: 'midweek' },
  { id: 'srv-004', branchId: 'branch-kinshasa', title: 'Service Special Jeunesse', date: '2026-04-14', startTime: '15:00', endTime: '18:00', preacher: 'Pasteure Grace Mbuyi', attendance: 250, type: 'special' },
];


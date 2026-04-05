import type { ChurchMember, DepartmentMember } from '@/types';

export const members: ChurchMember[] = [
  { id: 'mem-001', branchId: 'branch-goma', firstName: 'Grace', lastName: 'Kambale', gender: 'female', phone: '+243 970 111 001', email: 'grace.k@ecnd.org', departmentIds: ['dep-mamans'], joinedAt: '2023-02-08', status: 'active' },
  { id: 'mem-002', branchId: 'branch-goma', firstName: 'David', lastName: 'Munyaneza', gender: 'male', phone: '+243 970 111 002', email: 'david.m@ecnd.org', departmentIds: ['dep-papas', 'dep-logistique'], joinedAt: '2022-05-21', status: 'active' },
  { id: 'mem-003', branchId: 'branch-goma', firstName: 'Sarah', lastName: 'Bisimwa', gender: 'female', phone: '+243 970 111 003', departmentIds: ['dep-musique'], joinedAt: '2024-01-11', status: 'active' },
  { id: 'mem-004', branchId: 'branch-lubumbashi', firstName: 'Rene', lastName: 'Mwamba', gender: 'male', phone: '+243 970 111 004', email: 'rene.m@ecnd.org', departmentIds: ['dep-protocole'], joinedAt: '2021-09-15', status: 'active' },
  { id: 'mem-005', branchId: 'branch-lubumbashi', firstName: 'Sharon', lastName: 'Kasongo', gender: 'female', phone: '+243 970 111 005', departmentIds: ['dep-chanteurs', 'dep-interpretation'], joinedAt: '2023-07-01', status: 'active' },
  { id: 'mem-006', branchId: 'branch-lubumbashi', firstName: 'Noel', lastName: 'Mpiana', gender: 'male', phone: '+243 970 111 006', email: 'noel.mpiana@ecnd.org', departmentIds: ['dep-info'], joinedAt: '2022-11-10', status: 'inactive' },
  { id: 'mem-007', branchId: 'branch-kinshasa', firstName: 'Prisca', lastName: 'Tshibangu', gender: 'female', phone: '+243 970 111 007', departmentIds: ['dep-evangelisation'], joinedAt: '2024-04-17', status: 'active' },
  { id: 'mem-008', branchId: 'branch-kinshasa', firstName: 'Patrick', lastName: 'Mubenga', gender: 'male', phone: '+243 970 111 008', departmentIds: ['dep-media', 'dep-moderation'], joinedAt: '2023-10-20', status: 'active' },
  { id: 'mem-009', branchId: 'branch-goma', firstName: 'Ruth', lastName: 'Ndaya', gender: 'female', phone: '+243 970 111 009', email: 'ruth.ndaya@ecnd.org', departmentIds: ['dep-musique'], joinedAt: '2025-01-06', status: 'active' },
  { id: 'mem-010', branchId: 'branch-goma', firstName: 'Benjamin', lastName: 'Kalala', gender: 'male', phone: '+243 970 111 010', departmentIds: ['dep-enseignement'], joinedAt: '2023-03-13', status: 'active' },
];

export const departmentMembers: DepartmentMember[] = [
  { id: 'dm-001', departmentId: 'dep-musique', profileId: 'user-manager-musique', joinedAt: '2023-10-01', position: 'manager' },
  { id: 'dm-002', departmentId: 'dep-musique', profileId: 'user-member-musique', joinedAt: '2024-01-15', position: 'member' },
  { id: 'dm-003', departmentId: 'dep-coordination', profileId: 'user-admin-goma', joinedAt: '2022-08-05', position: 'assistant' },
  { id: 'dm-004', departmentId: 'dep-caisse', profileId: 'user-admin-lub', joinedAt: '2023-02-22', position: 'manager' },
];


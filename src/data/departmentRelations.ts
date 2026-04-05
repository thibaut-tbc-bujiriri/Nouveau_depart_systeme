import type { UserDepartmentRelation } from '@/types';

export const userDepartmentRelations: UserDepartmentRelation[] = [
  {
    id: 'udr-001',
    userId: 'user-superadmin',
    departmentId: 'dep-tresorerie',
    roleInDepartment: 'department_manager',
    joinedAt: '2022-01-10',
  },
  {
    id: 'udr-002',
    userId: 'user-admin-goma',
    departmentId: 'dep-coordination',
    roleInDepartment: 'department_manager',
    joinedAt: '2023-04-12',
  },
  {
    id: 'udr-003',
    userId: 'user-admin-lub',
    departmentId: 'dep-caisse',
    roleInDepartment: 'department_manager',
    joinedAt: '2023-05-01',
  },
  {
    id: 'udr-004',
    userId: 'user-manager-musique',
    departmentId: 'dep-musique',
    roleInDepartment: 'department_manager',
    joinedAt: '2023-10-01',
  },
  {
    id: 'udr-005',
    userId: 'user-member-musique',
    departmentId: 'dep-musique',
    roleInDepartment: 'department_member',
    joinedAt: '2024-01-15',
  },
];


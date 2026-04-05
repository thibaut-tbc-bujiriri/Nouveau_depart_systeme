import type { Branch } from '@/types';

export const branches: Branch[] = [
  {
    id: 'branch-goma',
    code: 'ECND-GOMA',
    name: 'ECND Goma',
    city: 'Goma',
    country: 'RDC',
    pastorName: 'Apotre Michel Katembo',
    createdAt: '2021-02-10',
    memberCount: 520,
    departmentCount: 17,
    isActive: true,
  },
  {
    id: 'branch-lubumbashi',
    code: 'ECND-LUB',
    name: 'ECND Lubumbashi',
    city: 'Lubumbashi',
    country: 'RDC',
    pastorName: 'Pasteur Joel Mpoyi',
    createdAt: '2022-07-18',
    memberCount: 360,
    departmentCount: 16,
    isActive: true,
  },
  {
    id: 'branch-kinshasa',
    code: 'ECND-KIN',
    name: 'ECND Kinshasa',
    city: 'Kinshasa',
    country: 'RDC',
    pastorName: 'Pasteure Grace Mbuyi',
    createdAt: '2024-03-04',
    memberCount: 190,
    departmentCount: 14,
    isActive: true,
  },
];


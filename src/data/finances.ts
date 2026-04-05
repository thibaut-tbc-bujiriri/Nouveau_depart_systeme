import type { FinanceRecord } from '@/types';

export const finances: FinanceRecord[] = [
  { id: 'fin-001', branchId: 'branch-goma', type: 'income', category: 'offering', amount: 2450, currency: 'USD', description: 'Offrandes culte dominical', recordedAt: '2026-03-03', createdBy: 'user-admin-goma' },
  { id: 'fin-002', branchId: 'branch-goma', type: 'income', category: 'tithe', amount: 3160, currency: 'USD', description: 'Dimes hebdomadaires', recordedAt: '2026-03-10', createdBy: 'user-admin-goma' },
  { id: 'fin-003', branchId: 'branch-goma', type: 'expense', category: 'logistics', amount: 780, currency: 'USD', description: 'Transport evangelisation', recordedAt: '2026-03-12', createdBy: 'user-superadmin' },
  { id: 'fin-004', branchId: 'branch-lubumbashi', type: 'income', category: 'donation', amount: 1400, currency: 'USD', description: 'Don mission jeunesse', recordedAt: '2026-03-14', createdBy: 'user-admin-lub' },
  { id: 'fin-005', branchId: 'branch-lubumbashi', type: 'expense', category: 'maintenance', amount: 620, currency: 'USD', description: 'Maintenance sonorisation', recordedAt: '2026-03-16', createdBy: 'user-admin-lub' },
  { id: 'fin-006', branchId: 'branch-kinshasa', type: 'income', category: 'offering', amount: 980, currency: 'USD', description: 'Offrandes semaine de priere', recordedAt: '2026-03-19', createdBy: 'user-superadmin' },
];


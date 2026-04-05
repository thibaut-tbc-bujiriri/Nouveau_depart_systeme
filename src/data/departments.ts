import type { Department } from '@/types';

export const departments: Department[] = [
  { id: 'dep-mamans', branchId: 'branch-goma', name: 'Mamans', managerId: 'user-mamans', memberCount: 42, monthlyBudget: 650, isActive: true },
  { id: 'dep-papas', branchId: 'branch-goma', name: 'Papas', managerId: 'user-papas', memberCount: 35, monthlyBudget: 520, isActive: true },
  { id: 'dep-ecodim', branchId: 'branch-lubumbashi', name: 'Ecodim', managerId: 'user-ecodim', memberCount: 58, monthlyBudget: 470, isActive: true },
  { id: 'dep-coordination', branchId: 'branch-goma', name: 'Coordination', managerId: 'user-coordination', memberCount: 18, monthlyBudget: 750, isActive: true },
  { id: 'dep-caisse', branchId: 'branch-lubumbashi', name: 'Caisse', managerId: 'user-caisse', memberCount: 12, monthlyBudget: 1500, isActive: true },
  { id: 'dep-protocole', branchId: 'branch-lubumbashi', name: 'Protocole', managerId: 'user-protocole', memberCount: 16, monthlyBudget: 320, isActive: true },
  { id: 'dep-proprete', branchId: 'branch-goma', name: 'Proprete', managerId: 'user-proprete', memberCount: 14, monthlyBudget: 280, isActive: true },
  { id: 'dep-musique', branchId: 'branch-goma', name: 'Musique', managerId: 'user-musique', memberCount: 27, monthlyBudget: 900, isActive: true },
  { id: 'dep-chanteurs', branchId: 'branch-lubumbashi', name: 'Chanteurs', managerId: 'user-chanteurs', memberCount: 24, monthlyBudget: 540, isActive: true },
  { id: 'dep-evangelisation', branchId: 'branch-kinshasa', name: 'Evangelisation', managerId: 'user-evangelisation', memberCount: 21, monthlyBudget: 700, isActive: true },
  { id: 'dep-moderation', branchId: 'branch-kinshasa', name: 'Moderation', managerId: 'user-moderation', memberCount: 10, monthlyBudget: 220, isActive: true },
  { id: 'dep-enseignement', branchId: 'branch-goma', name: 'Enseignement', managerId: 'user-enseignement', memberCount: 19, monthlyBudget: 480, isActive: true },
  { id: 'dep-interpretation', branchId: 'branch-lubumbashi', name: 'Interpretation', managerId: 'user-interpretation', memberCount: 11, monthlyBudget: 360, isActive: true },
  { id: 'dep-logistique', branchId: 'branch-goma', name: 'Logistique & Transport', managerId: 'user-logistique', memberCount: 20, monthlyBudget: 1100, isActive: true },
  { id: 'dep-info', branchId: 'branch-lubumbashi', name: 'Informatique', managerId: 'user-info', memberCount: 13, monthlyBudget: 800, isActive: true },
  { id: 'dep-media', branchId: 'branch-kinshasa', name: 'Media', managerId: 'user-media', memberCount: 15, monthlyBudget: 680, isActive: true },
  { id: 'dep-tresorerie', branchId: 'branch-goma', name: 'Tresorerie', managerId: 'user-tresorerie', memberCount: 9, monthlyBudget: 2000, isActive: true },
];


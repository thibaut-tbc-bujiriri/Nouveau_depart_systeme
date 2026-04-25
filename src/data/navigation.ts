import type { NavItem } from '@/types';

export const navItems: NavItem[] = [
  { key: 'dashboard', label: 'Dashboard', to: '/dashboard', icon: 'layout-dashboard', allowedRoles: ['superadmin', 'admin', 'department_manager', 'department_member'] },
  { key: 'branches', label: 'Extensions', to: '/branches', icon: 'building-2', allowedRoles: ['superadmin', 'admin'] },
  { key: 'users', label: 'Utilisateurs', to: '/users', icon: 'user-cog', allowedRoles: ['superadmin', 'admin'] },
  { key: 'members', label: 'Membres', to: '/members', icon: 'users', allowedRoles: ['superadmin', 'admin', 'department_manager'] },
  { key: 'departments', label: 'Departements', to: '/departments', icon: 'network', allowedRoles: ['superadmin', 'admin', 'department_manager', 'department_member'] },
  { key: 'finances', label: 'Finances', to: '/finances', icon: 'wallet', allowedRoles: ['superadmin', 'admin'] },
  { key: 'services', label: 'Cultes / Services', to: '/services', icon: 'church', allowedRoles: ['superadmin', 'admin', 'department_manager', 'department_member'] },
  { key: 'events', label: 'Evenements', to: '/events', icon: 'calendar-days', allowedRoles: ['superadmin', 'admin', 'department_manager', 'department_member'] },
  { key: 'reports', label: 'Rapports', to: '/reports', icon: 'bar-chart-3', allowedRoles: ['superadmin', 'admin', 'department_manager'] },
  { key: 'settings', label: 'Parametres', to: '/settings', icon: 'settings', allowedRoles: ['superadmin', 'admin'] },
  { key: 'profile', label: 'Profil', to: '/profile', icon: 'user-circle-2', allowedRoles: ['superadmin', 'admin', 'department_manager', 'department_member'] },
];


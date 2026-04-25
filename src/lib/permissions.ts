import type {
  Branch,
  Department,
  Event,
  FinanceRecord,
  NavItem,
  Profile,
  Report,
  Role,
  UserDepartmentRelation,
} from '@/types';

export type Permission =
  | 'dashboard:view'
  | 'branches:view'
  | 'users:view'
  | 'users:manage'
  | 'members:view'
  | 'departments:view'
  | 'departments:manage'
  | 'finances:view'
  | 'services:view'
  | 'events:view'
  | 'reports:view'
  | 'settings:view'
  | 'profile:view';

const ALL_PERMISSIONS = '*';

type RolePermissionMap = Record<Role, Permission[] | typeof ALL_PERMISSIONS>;
type AccessScope = 'global' | 'branch' | 'department' | 'read_limited';

export const roleLabels: Record<Role, string> = {
  superadmin: 'Super Admin',
  admin: 'Admin',
  department_manager: 'Responsable Departement',
  department_member: 'Membre Departement',
};

export const rolePermissions: RolePermissionMap = {
  superadmin: ALL_PERMISSIONS,
  admin: ALL_PERMISSIONS,
  department_manager: [
    'dashboard:view',
    'members:view',
    'departments:view',
    'departments:manage',
    'services:view',
    'events:view',
    'reports:view',
    'profile:view',
  ],
  department_member: ['dashboard:view', 'departments:view', 'profile:view'],
};

export const roleAccessScope: Record<Role, AccessScope> = {
  superadmin: 'global',
  admin: 'global',
  department_manager: 'department',
  department_member: 'read_limited',
};

export const canAccess = (role: Role, allowedRoles: Role[]) => {
  return allowedRoles.includes(role);
};

export const hasPermission = (role: Role, permission: Permission) => {
  const permissions = rolePermissions[role];
  if (permissions === ALL_PERMISSIONS) {
    return true;
  }

  return permissions.includes(permission);
};

export const filterNavItemsForRole = (items: NavItem[], role: Role) => {
  const visibleItems = items.filter(
    (item) => item.allowedRoles.includes(role) && hasPermission(role, navItemPermissionMap[item.key]),
  );

  // Contract asked by product: department_member sidebar shows only Dashboard + Departements.
  if (role === 'department_member') {
    return visibleItems.filter((item) => item.key === 'dashboard' || item.key === 'departments');
  }

  return visibleItems;
};

const navItemPermissionMap: Record<NavItem['key'], Permission> = {
  dashboard: 'dashboard:view',
  branches: 'branches:view',
  members: 'members:view',
  departments: 'departments:view',
  finances: 'finances:view',
  services: 'services:view',
  events: 'events:view',
  reports: 'reports:view',
  settings: 'settings:view',
  profile: 'profile:view',
  users: 'users:view',
};

export const hasBranchAccess = (user: Profile, branchId: string) => {
  if (user.role === 'superadmin' || user.role === 'admin') {
    return true;
  }

  return user.branchId === branchId;
};

export const hasDepartmentAccess = (user: Profile, departmentId: string) => {
  if (user.role === 'superadmin') {
    return true;
  }

  if (user.role === 'admin') {
    return true;
  }

  return user.departmentIds.includes(departmentId);
};

export const restrictBranchesByRole = (items: Branch[], user: Profile) => {
  if (user.role === 'superadmin' || user.role === 'admin') {
    return items;
  }

  return items.filter((branch) => branch.id === user.branchId);
};

export const restrictDepartmentsByRole = (
  items: Department[],
  user: Profile,
  relations?: UserDepartmentRelation[],
) => {
  if (user.role === 'superadmin' || user.role === 'admin') {
    return items;
  }

  if (relations) {
    const relatedDepartmentIds = relations
      .filter((relation) => relation.userId === user.id)
      .map((relation) => relation.departmentId);

    return items.filter((department) => relatedDepartmentIds.includes(department.id));
  }

  return items.filter((department) => user.departmentIds.includes(department.id));
};

export const restrictFinancesByRole = (items: FinanceRecord[], user: Profile) => {
  if (user.role === 'superadmin' || user.role === 'admin') {
    return items;
  }

  return items.filter((finance) => finance.branchId === user.branchId);
};

export const restrictEventsByRole = (items: Event[], user: Profile) => {
  if (user.role === 'superadmin' || user.role === 'admin') {
    return items;
  }

  return items.filter((event) => event.branchId === user.branchId);
};

export const restrictReportsByRole = (items: Report[], user: Profile) => {
  if (user.role === 'superadmin' || user.role === 'admin') {
    return items;
  }

  return items.filter((report) => report.branchId === user.branchId);
};


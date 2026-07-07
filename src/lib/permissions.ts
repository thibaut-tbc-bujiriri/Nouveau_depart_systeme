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
import type { ModulePermissionKey, ModulePermissionAction } from '@/hooks/useSettingsData';

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



type AccessScope = 'global' | 'branch' | 'department' | 'read_limited';

export const roleLabels: Record<Role, string> = {
  superadmin: 'Super Admin',
  admin: 'Admin',
  department_manager: 'Responsable Departement',
  department_member: 'Membre Departement',
};

export const defaultRolePermissions: Record<Exclude<Role, 'superadmin'>, Record<ModulePermissionKey, Record<ModulePermissionAction, boolean>>> = {
  admin: {
    dashboard: { view: true, create: false, update: false, delete: false },
    branches: { view: true, create: true, update: true, delete: true },
    users: { view: true, create: true, update: true, delete: true },
    members: { view: true, create: true, update: true, delete: true },
    departments: { view: true, create: true, update: true, delete: true },
    finances: { view: true, create: true, update: true, delete: true },
    services: { view: true, create: true, update: true, delete: true },
    events: { view: true, create: true, update: true, delete: true },
    reports: { view: true, create: true, update: true, delete: true },
    settings: { view: true, create: true, update: true, delete: false },
    profile: { view: true, create: false, update: true, delete: false },
  },
  department_manager: {
    dashboard: { view: true, create: false, update: false, delete: false },
    branches: { view: false, create: false, update: false, delete: false },
    users: { view: false, create: false, update: false, delete: false },
    members: { view: true, create: true, update: true, delete: false },
    departments: { view: true, create: false, update: true, delete: false },
    finances: { view: false, create: false, update: false, delete: false },
    services: { view: true, create: true, update: true, delete: true },
    events: { view: true, create: true, update: true, delete: true },
    reports: { view: true, create: true, update: true, delete: false },
    settings: { view: true, create: false, update: true, delete: false },
    profile: { view: true, create: false, update: true, delete: false },
  },
  department_member: {
    dashboard: { view: true, create: false, update: false, delete: false },
    branches: { view: false, create: false, update: false, delete: false },
    users: { view: false, create: false, update: false, delete: false },
    members: { view: false, create: false, update: false, delete: false },
    departments: { view: true, create: false, update: false, delete: false },
    finances: { view: false, create: false, update: false, delete: false },
    services: { view: false, create: false, update: false, delete: false },
    events: { view: false, create: false, update: false, delete: false },
    reports: { view: false, create: false, update: false, delete: false },
    settings: { view: false, create: false, update: false, delete: false },
    profile: { view: true, create: false, update: true, delete: false },
  },
};

export const maxRolePermissions: Record<Exclude<Role, 'superadmin'>, Record<ModulePermissionKey, Record<ModulePermissionAction, boolean>>> = {
  admin: {
    dashboard: { view: true, create: false, update: false, delete: false },
    branches: { view: true, create: false, update: true, delete: false },
    users: { view: true, create: true, update: true, delete: false },
    members: { view: true, create: true, update: true, delete: true },
    departments: { view: true, create: true, update: true, delete: true },
    finances: { view: true, create: true, update: true, delete: false },
    services: { view: true, create: true, update: true, delete: true },
    events: { view: true, create: true, update: true, delete: true },
    reports: { view: true, create: true, update: true, delete: false },
    settings: { view: true, create: false, update: false, delete: false },
    profile: { view: true, create: false, update: true, delete: false },
  },
  department_manager: {
    dashboard: { view: true, create: false, update: false, delete: false },
    branches: { view: false, create: false, update: false, delete: false },
    users: { view: false, create: false, update: false, delete: false },
    members: { view: true, create: true, update: true, delete: false },
    departments: { view: true, create: false, update: true, delete: false },
    finances: { view: false, create: false, update: false, delete: false },
    services: { view: true, create: false, update: true, delete: false },
    events: { view: true, create: true, update: true, delete: false },
    reports: { view: true, create: true, update: true, delete: false },
    settings: { view: true, create: false, update: true, delete: false },
    profile: { view: true, create: false, update: true, delete: false },
  },
  department_member: {
    dashboard: { view: true, create: false, update: false, delete: false },
    branches: { view: false, create: false, update: false, delete: false },
    users: { view: false, create: false, update: false, delete: false },
    members: { view: false, create: false, update: false, delete: false },
    departments: { view: true, create: false, update: false, delete: false },
    finances: { view: false, create: false, update: false, delete: false },
    services: { view: true, create: false, update: false, delete: false },
    events: { view: true, create: false, update: false, delete: false },
    reports: { view: false, create: false, update: false, delete: false },
    settings: { view: false, create: false, update: false, delete: false },
    profile: { view: true, create: false, update: true, delete: false },
  },
};

export const hasModulePermission = (
  role: Role,
  module: ModulePermissionKey,
  action: ModulePermissionAction
): boolean => {
  if (role === 'superadmin') {
    return true;
  }

  // settings module view/update must always be true for admin and department_manager to allow preference editing
  if (module === 'settings' && (role === 'admin' || role === 'department_manager') && (action === 'view' || action === 'update')) {
    return true;
  }

  // 1. Enforce max roles permissions matrix constraints dynamically
  const maxMap = maxRolePermissions[role as Exclude<Role, 'superadmin'>];
  if (maxMap && maxMap[module] && !maxMap[module][action]) {
    return false;
  }

  try {
    const customRaw = localStorage.getItem('ecnd.custom_permissions');
    if (customRaw) {
      const customMap = JSON.parse(customRaw);
      if (customMap && customMap[module]) {
        return !!customMap[module][action];
      }
    }
  } catch (e) {
    // Ignore
  }

  try {
    const raw = localStorage.getItem('ecnd.role_permissions');
    if (raw) {
      const parsed = JSON.parse(raw);
      const roleMap = parsed[role];
      if (roleMap && roleMap[module]) {
        return !!roleMap[module][action];
      }
    }
  } catch (e) {
    // Ignore
  }

  const defaultRoleMap = defaultRolePermissions[role as Exclude<Role, 'superadmin'>];
  if (defaultRoleMap && defaultRoleMap[module]) {
    return !!defaultRoleMap[module][action];
  }

  return false;
};

export const roleAccessScope: Record<Role, AccessScope> = {
  superadmin: 'global',
  admin: 'branch',
  department_manager: 'department',
  department_member: 'read_limited',
};

export const canAccess = (role: Role, allowedRoles: Role[]) => {
  return allowedRoles.includes(role);
};

export const hasPermission = (role: Role, permission: Permission): boolean => {
  if (role === 'superadmin') {
    return true;
  }

  const parts = permission.split(':');
  const moduleKey = parts[0] as ModulePermissionKey;
  const actionStr = parts[1];

  let action: ModulePermissionAction = 'view';
  if (actionStr === 'manage') {
    return (
      hasModulePermission(role, moduleKey, 'create') ||
      hasModulePermission(role, moduleKey, 'update') ||
      hasModulePermission(role, moduleKey, 'delete')
    );
  } else if (actionStr === 'create') {
    action = 'create';
  } else if (actionStr === 'update') {
    action = 'update';
  } else if (actionStr === 'delete') {
    action = 'delete';
  }

  return hasModulePermission(role, moduleKey, action);
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
  if (user.role === 'superadmin') {
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
  if (user.role === 'superadmin') {
    return items;
  }

  return items.filter((branch) => branch.id === user.branchId);
};

export const restrictDepartmentsByRole = (
  items: Department[],
  user: Profile,
  relations?: UserDepartmentRelation[],
) => {
  if (user.role === 'superadmin') {
    return items;
  }

  if (user.role === 'admin') {
    return items.filter((department) => department.branchId === user.branchId);
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
  if (user.role === 'superadmin') {
    return items;
  }

  return items.filter((finance) => finance.branchId === user.branchId);
};

export const restrictEventsByRole = (items: Event[], user: Profile) => {
  if (user.role === 'superadmin') {
    return items;
  }

  return items.filter((event) => event.branchId === user.branchId);
};

export const restrictReportsByRole = (items: Report[], user: Profile) => {
  if (user.role === 'superadmin') {
    return items;
  }

  return items.filter((report) => report.branchId === user.branchId);
};


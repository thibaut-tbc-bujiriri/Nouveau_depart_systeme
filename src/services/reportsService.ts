import type { Profile } from '@/types';

export interface ReportScopeInfo {
  scope: 'global' | 'extension' | 'department' | 'personal';
  branchId?: string;
  departmentId?: string;
}

/**
 * Validates and resolves the appropriate report scope and filters based on the user's role.
 * This guarantees that managers, admins, and members cannot bypass client-side security
 * to view records they are not authorized to access.
 */
export function resolveReportScope(
  user: Profile,
  requestedBranchId?: string,
  requestedDepartmentId?: string
): ReportScopeInfo {
  const role = user.role;

  // 1. Super Admin has global access to all scopes
  if (role === 'superadmin') {
    if (requestedDepartmentId) {
      return {
        scope: 'department',
        branchId: requestedBranchId || undefined,
        departmentId: requestedDepartmentId
      };
    }
    if (requestedBranchId) {
      return {
        scope: 'extension',
        branchId: requestedBranchId
      };
    }
    return {
      scope: 'global'
    };
  }

  // 2. Admin is strictly constrained to their own branch
  if (role === 'admin') {
    if (requestedDepartmentId) {
      return {
        scope: 'department',
        branchId: user.branchId || undefined,
        departmentId: requestedDepartmentId
      };
    }
    return {
      scope: 'extension',
      branchId: user.branchId || undefined
    };
  }

  // 3. Department Manager is constrained to their assigned department and branch
  if (role === 'department_manager') {
    const myDeptId = user.departmentIds[0];
    return {
      scope: 'department',
      branchId: user.branchId || undefined,
      departmentId: myDeptId || undefined
    };
  }

  // 4. Department Member is limited to personal scope
  return {
    scope: 'personal',
    branchId: user.branchId || undefined,
    departmentId: user.departmentIds[0] || undefined
  };
}

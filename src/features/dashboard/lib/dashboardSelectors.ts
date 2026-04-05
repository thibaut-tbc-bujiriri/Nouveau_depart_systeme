import {
  branchesStats,
  departmentDistribution,
  departmentPerformance,
  financeCategories,
  globalKpis,
  membersByCategory,
  monthlyAttendance,
  monthlyFinanceStats,
  recentActivities,
  recentReports,
  smartAlerts,
  spiritualFocus,
  upcomingEvents,
  weeklyProgram,
} from '@/data';
import type {
  ActivityItem,
  DepartmentDistributionPoint,
  DepartmentPerformancePoint,
  FinanceCategoryPoint,
  KpiItem,
  MembersCategoryPoint,
  MonthlyAttendancePoint,
  MonthlyFinancePoint,
  ReportItem,
  SmartAlertItem,
  SpiritualFocus,
  UpcomingEventItem,
  WeeklyProgramItem,
} from '@/features/dashboard/types';
import type { Department, Profile, Role } from '@/types';

interface DashboardScope {
  user: Profile;
  departments: Department[];
}

export const roleDashboardConfig: Record<Role, { title: string; subtitle: string }> = {
  superadmin: {
    title: 'Centre de Supervision ECND',
    subtitle: 'Vue globale multi-extensions, finances et activites strategiques.',
  },
  admin: {
    title: 'Pilotage de votre extension',
    subtitle: 'Suivi local des membres, finances et activites de votre eglise.',
  },
  department_manager: {
    title: 'Performance departementale',
    subtitle: 'Suivi des objectifs, de la participation et des activites du departement.',
  },
  department_member: {
    title: 'Espace departement',
    subtitle: 'Vue simplifiee des annonces, activites et calendrier du departement.',
  },
};

export const getScopedMonthlyFinance = ({ user }: DashboardScope): MonthlyFinancePoint[] => {
  if (user.role === 'superadmin') {
    return monthlyFinanceStats.filter((item) => !item.branchId);
  }

  return monthlyFinanceStats.filter((item) => item.branchId === user.branchId);
};

export const getScopedFinanceCategories = ({ user }: DashboardScope): FinanceCategoryPoint[] => {
  if (user.role === 'superadmin') {
    return financeCategories;
  }

  return financeCategories.filter((item) => item.branchId === user.branchId);
};

export const getScopedMembersByCategory = ({ user }: DashboardScope): MembersCategoryPoint[] => {
  if (user.role === 'superadmin') {
    return membersByCategory.filter((item) => !item.branchId);
  }

  if (user.role === 'department_manager' || user.role === 'department_member') {
    return membersByCategory.filter((item) => item.branchId === user.branchId);
  }

  return membersByCategory.filter((item) => item.branchId === user.branchId);
};

export const getScopedAttendance = ({ user }: DashboardScope): MonthlyAttendancePoint[] => {
  if (user.role === 'department_manager' || user.role === 'department_member') {
    const primaryDepartment = user.departmentIds[0];
    return monthlyAttendance.filter((item) => item.departmentId === primaryDepartment);
  }

  return monthlyAttendance.filter((item) => item.branchId === user.branchId);
};

export const getScopedActivities = ({ user }: DashboardScope): ActivityItem[] => {
  if (user.role === 'superadmin') {
    return recentActivities;
  }

  if (user.role === 'department_manager' || user.role === 'department_member') {
    return recentActivities.filter((item) =>
      item.departmentId ? user.departmentIds.includes(item.departmentId) : item.branchId === user.branchId,
    );
  }

  return recentActivities.filter((item) => item.branchId === user.branchId);
};

export const getScopedReports = ({ user }: DashboardScope): ReportItem[] => {
  if (user.role === 'superadmin') {
    return recentReports;
  }

  if (user.role === 'department_manager') {
    return recentReports.filter((item) =>
      item.departmentId ? user.departmentIds.includes(item.departmentId) : item.branchId === user.branchId,
    );
  }

  return recentReports.filter((item) => item.branchId === user.branchId);
};

export const getScopedDepartmentReports = ({ user }: DashboardScope): ReportItem[] => {
  if (user.role === 'superadmin') {
    return recentReports.filter((item) => item.departmentName);
  }

  if (user.role === 'department_manager' || user.role === 'department_member') {
    return recentReports.filter((item) => (item.departmentId ? user.departmentIds.includes(item.departmentId) : false));
  }

  return recentReports.filter((item) => item.branchId === user.branchId && item.departmentName);
};

export const getScopedUpcomingEvents = ({ user }: DashboardScope): UpcomingEventItem[] => {
  if (user.role === 'superadmin') {
    return upcomingEvents;
  }

  if (user.role === 'department_manager' || user.role === 'department_member') {
    return upcomingEvents.filter((item) =>
      item.departmentId ? user.departmentIds.includes(item.departmentId) : item.branchId === user.branchId,
    );
  }

  return upcomingEvents.filter((item) => item.branchId === user.branchId);
};

export const getScopedPerformance = ({ user }: DashboardScope): DepartmentPerformancePoint[] => {
  if (user.role === 'superadmin') {
    return departmentPerformance;
  }

  if (user.role === 'department_manager' || user.role === 'department_member') {
    return departmentPerformance.filter((item) => user.departmentIds.includes(item.departmentId));
  }

  return departmentPerformance.filter((item) => item.branchId === user.branchId);
};

export const getScopedDepartmentDistribution = ({ user, departments }: DashboardScope): DepartmentDistributionPoint[] => {
  if (user.role === 'superadmin') {
    return departmentDistribution;
  }

  const scopedDepartments = departments.filter((department) => department.branchId === user.branchId);
  const activeCount = scopedDepartments.filter((department) => department.isActive).length;
  const attentionCount = Math.max(scopedDepartments.length - activeCount - 1, 0);

  return [
    { name: 'Actifs', value: activeCount },
    { name: 'A renforcer', value: attentionCount },
    { name: 'En pause', value: scopedDepartments.length - activeCount - attentionCount },
  ];
};

export const getScopedKpis = ({ user }: DashboardScope): KpiItem[] => {
  if (user.role === 'superadmin') {
    return globalKpis;
  }

  const factor = user.role === 'admin' ? 1 : 0.55;
  return globalKpis.map((kpi) => ({
    ...kpi,
    value: `${(Number.parseFloat(kpi.value.replace('%', '')) * factor).toFixed(1)}%`,
    trend: Number.parseFloat((kpi.trend * factor).toFixed(1)),
  }));
};

export const getMembersByBranchForSuperadmin = () => branchesStats;

export const getSpiritualFocus = (): SpiritualFocus => spiritualFocus;

export const getWeeklyProgram = (): WeeklyProgramItem[] => weeklyProgram;

export const getScopedAlerts = ({ user }: DashboardScope): SmartAlertItem[] => {
  if (user.role === 'superadmin') {
    return smartAlerts;
  }

  if (user.role === 'department_manager' || user.role === 'department_member') {
    return smartAlerts.filter((item) =>
      item.departmentId ? user.departmentIds.includes(item.departmentId) : item.branchId === user.branchId,
    );
  }

  return smartAlerts.filter((item) => item.branchId === user.branchId);
};


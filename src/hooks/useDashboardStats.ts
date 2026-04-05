import {
  branchesStats as mockBranchesStats,
  departmentPerformance as mockPerformance,
  departments as mockDepartments,
  financeCategories as mockFinanceCategories,
  membersByCategory as mockMembersByCategory,
  membersByDepartment as mockMembersByDepartment,
  monthlyAttendance as mockAttendance,
  monthlyFinanceStats as mockFinanceMonthly,
  recentActivities as mockRecentActivities,
  recentReports as mockRecentReports,
  smartAlerts as mockAlerts,
  upcomingEvents as mockUpcoming,
} from '@/data';
import type {
  ActivityItem,
  BranchStatsPoint,
  DepartmentPerformancePoint,
  FinanceCategoryPoint,
  MembersByDepartmentPoint,
  MembersCategoryPoint,
  MonthlyAttendancePoint,
  MonthlyFinancePoint,
  ReportItem,
  SmartAlertItem,
  UpcomingEventItem,
} from '@/features/dashboard/types';
import {
  getDashboardDepartmentPerformance,
  getDashboardFinanceByCategory,
  getDashboardFinanceMonthly,
  getDashboardMembersByBranch,
  getDashboardMembersByCategory,
  getDashboardMembersByDepartment,
  getDashboardOpenAlerts,
  getDashboardRecentActivities,
  getDashboardServiceAttendance,
  getDashboardUpcomingEvents,
} from '@/services/dashboard.service';
import type { Profile } from '@/types';
import { useEffect, useMemo, useState } from 'react';

interface DashboardDataState {
  branchesData: BranchStatsPoint[];
  membersByCategory: MembersCategoryPoint[];
  membersByDepartment: MembersByDepartmentPoint[];
  financeMonthly: MonthlyFinancePoint[];
  financeByCategory: FinanceCategoryPoint[];
  attendance: MonthlyAttendancePoint[];
  upcomingEvents: UpcomingEventItem[];
  openAlerts: SmartAlertItem[];
  recentActivities: ActivityItem[];
  departmentPerformance: DepartmentPerformancePoint[];
  reports: ReportItem[];
}

const fallbackData: DashboardDataState = {
  branchesData: mockBranchesStats,
  membersByCategory: mockMembersByCategory,
  membersByDepartment: mockMembersByDepartment,
  financeMonthly: mockFinanceMonthly,
  financeByCategory: mockFinanceCategories,
  attendance: mockAttendance,
  upcomingEvents: mockUpcoming,
  openAlerts: mockAlerts,
  recentActivities: mockRecentActivities,
  departmentPerformance: mockPerformance,
  reports: mockRecentReports,
};

function toTitleCase(value: string) {
  return value
    .replaceAll('_', ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function filterByRole(data: DashboardDataState, user: Profile | null): DashboardDataState {
  if (!user) {
    return data;
  }

  if (user.role === 'superadmin') {
    return data;
  }

  const branchFilter = <T extends { branchId?: string; branch_id?: string }>(items: T[]) =>
    items.filter((item) => (item.branchId ?? item.branch_id) === user.branchId);

  const departmentFilter = <T extends { departmentId?: string; department_id?: string }>(items: T[]) =>
    items.filter((item) => {
      const departmentId = item.departmentId ?? item.department_id;
      return departmentId ? user.departmentIds.includes(departmentId) : true;
    });

  const scoped: DashboardDataState = {
    branchesData: branchFilter(data.branchesData),
    membersByCategory: branchFilter(data.membersByCategory),
    membersByDepartment: branchFilter(data.membersByDepartment),
    financeMonthly: branchFilter(data.financeMonthly),
    financeByCategory: branchFilter(data.financeByCategory),
    attendance: branchFilter(data.attendance),
    upcomingEvents: branchFilter(data.upcomingEvents),
    openAlerts: branchFilter(data.openAlerts),
    recentActivities: branchFilter(data.recentActivities),
    departmentPerformance: branchFilter(data.departmentPerformance),
    reports: branchFilter(data.reports),
  };

  if (user.role === 'department_manager' || user.role === 'department_member') {
    scoped.membersByDepartment = departmentFilter(scoped.membersByDepartment);
    scoped.departmentPerformance = departmentFilter(scoped.departmentPerformance);
    scoped.recentActivities = departmentFilter(scoped.recentActivities);
    scoped.reports = departmentFilter(scoped.reports);
    scoped.upcomingEvents = departmentFilter(scoped.upcomingEvents);
  }

  return scoped;
}

function getSettledValue<T>(result: PromiseSettledResult<T>, fallback: T): T {
  return result.status === 'fulfilled' ? result.value : fallback;
}

export function useDashboardStats(user: Profile | null) {
  const [data, setData] = useState<DashboardDataState>(fallbackData);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [source, setSource] = useState<'supabase' | 'mock'>('supabase');

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      setError(null);

      if (!user) {
        setData(fallbackData);
        setSource('mock');
        setIsLoading(false);
        return;
      }

      try {
        const settledResults = await Promise.allSettled([
          getDashboardMembersByBranch(),
          getDashboardMembersByCategory(),
          getDashboardMembersByDepartment(),
          getDashboardFinanceMonthly(),
          getDashboardFinanceByCategory(),
          getDashboardServiceAttendance(),
          getDashboardUpcomingEvents(),
          getDashboardOpenAlerts(),
          getDashboardRecentActivities(),
          getDashboardDepartmentPerformance(),
        ]);

        const [
          membersByBranchResult,
          membersByCategoryResult,
          membersByDepartmentResult,
          financeMonthlyResult,
          financeByCategoryResult,
          attendanceResult,
          upcomingResult,
          alertsResult,
          activitiesResult,
          performanceResult,
        ] = settledResults;

        const membersByBranchRows = getSettledValue(membersByBranchResult, []);
        const membersByCategoryRows = getSettledValue(membersByCategoryResult, []);
        const membersByDepartmentRows = getSettledValue(membersByDepartmentResult, []);
        const financeMonthlyRows = getSettledValue(financeMonthlyResult, []);
        const financeByCategoryRows = getSettledValue(financeByCategoryResult, []);
        const attendanceRows = getSettledValue(attendanceResult, []);
        const upcomingRows = getSettledValue(upcomingResult, []);
        const alertsRows = getSettledValue(alertsResult, []);
        const activitiesRows = getSettledValue(activitiesResult, []);
        const performanceRows = getSettledValue(performanceResult, []);

        const failedRequests = settledResults.filter((result) => result.status === 'rejected');

        const transformed: DashboardDataState = {
          branchesData:
            membersByBranchRows.length > 0
              ? membersByBranchRows.map((row) => ({
                  branchId: row.branch_id,
                  branchName: row.branch_name,
                  members: row.members_total,
                  activities: 0,
                }))
              : fallbackData.branchesData,
          membersByCategory:
            membersByCategoryRows.length > 0
              ? membersByCategoryRows.map((row) => ({
                  branchId: row.branch_id,
                  category: toTitleCase(row.member_category),
                  value: row.members_count,
                }))
              : fallbackData.membersByCategory,
          membersByDepartment:
            membersByDepartmentRows.length > 0
              ? membersByDepartmentRows.map((row) => ({
                  departmentId: row.department_id,
                  departmentName: row.department_name,
                  members: row.members_count,
                  branchId: row.branch_id,
                }))
              : fallbackData.membersByDepartment,
          financeMonthly:
            financeMonthlyRows.length > 0
              ? financeMonthlyRows.map((row) => ({
                  branchId: row.branch_id,
                  month: String(row.month).slice(0, 7),
                  income: row.income_total,
                  expense: row.expense_total,
                }))
              : fallbackData.financeMonthly,
          financeByCategory:
            financeByCategoryRows.length > 0
              ? financeByCategoryRows.map((row) => ({
                  branchId: row.branch_id,
                  category: toTitleCase(row.category),
                  value: row.amount_total,
                }))
              : fallbackData.financeByCategory,
          attendance:
            attendanceRows.length > 0
              ? attendanceRows.map((row) => ({
                  branchId: row.branch_id,
                  label: row.service_day,
                  attendance: row.participants_count,
                }))
              : fallbackData.attendance,
          upcomingEvents:
            upcomingRows.length > 0
              ? upcomingRows.map((row) => ({
                  id: row.event_id,
                  title: row.title,
                  date: row.event_date,
                  location: row.branch_name,
                  branchId: row.branch_id,
                }))
              : fallbackData.upcomingEvents,
          openAlerts:
            alertsRows.length > 0
              ? alertsRows.map((row) => ({
                  id: row.alert_id,
                  title: row.title,
                  description: `Niveau ${row.level}`,
                  level: row.level === 'critical' ? 'critical' : row.level === 'warning' ? 'warning' : 'info',
                  branchId: row.branch_id,
                }))
              : fallbackData.openAlerts,
          recentActivities:
            activitiesRows.length > 0
              ? activitiesRows.map((row) => ({
                  id: row.activity_id,
                  title: row.title,
                  description: row.department_name ? `Departement ${row.department_name}` : row.branch_name,
                  date: row.created_at,
                  level: row.status === 'blocked' ? 'warning' : row.status === 'done' ? 'success' : 'info',
                  status:
                    row.status === 'completed' || row.status === 'done'
                      ? 'termine'
                      : row.status === 'in_progress'
                        ? 'en_cours'
                        : 'planifie',
                  branchId: row.branch_id,
                  departmentId: row.department_id ?? undefined,
                }))
              : fallbackData.recentActivities,
          departmentPerformance:
            performanceRows.length > 0
              ? performanceRows.map((row) => {
                  const achieved = row.activities_count_90d + row.reports_count_90d;
                  const target = Math.max(row.members_count, 1);
                  const completionRate = Math.min(Math.round((achieved / target) * 100), 100);
                  return {
                    departmentId: row.department_id,
                    departmentName: row.department_name,
                    completionRate,
                    target,
                    achieved,
                    branchId: row.branch_id,
                  };
                })
              : fallbackData.departmentPerformance,
          reports: mockRecentReports,
        };

        setData(transformed);
        const hasSuccess = failedRequests.length < settledResults.length;
        setSource(hasSuccess ? 'supabase' : 'mock');
        setError(hasSuccess ? null : 'Erreur lors du chargement du dashboard.');
      } catch (err) {
        setData(fallbackData);
        setSource('mock');
        setError(err instanceof Error ? err.message : 'Erreur lors du chargement du dashboard.');
      } finally {
        setIsLoading(false);
      }
    };

    void load();
  }, [user]);

  const scopedData = useMemo(() => filterByRole(data, user), [data, user]);

  const counts = useMemo(() => {
    const activeMembers = scopedData.branchesData.reduce((sum, item) => sum + item.members, 0);
    const activeDepartments = scopedData.membersByDepartment.length;
    const financeNet = scopedData.financeMonthly.reduce((sum, item) => sum + item.income - item.expense, 0);
    const servicesThisWeek = scopedData.attendance.slice(-7).length;

    return {
      activeMembers,
      activeDepartments,
      financeNet,
      servicesThisWeek,
      newMembers: Math.max(Math.round(activeMembers * 0.08), 0),
      localDepartments: user
        ? mockDepartments.filter((department) => department.branchId === user.branchId).length
        : 0,
    };
  }, [scopedData, user]);

  return {
    ...scopedData,
    counts,
    isLoading,
    error,
    source,
  };
}

export type UseDashboardStatsResult = ReturnType<typeof useDashboardStats>;


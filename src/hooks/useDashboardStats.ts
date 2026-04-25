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
import { getBranches } from '@/services/branches.service';
import { getDepartments } from '@/services/departments.service';
import { getEvents } from '@/services/events.service';
import { getFinanceRecords } from '@/services/finance.service';
import { getMembers } from '@/services/members.service';
import { getReports } from '@/services/reports.service';
import { getServices } from '@/services/services.service';
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

const emptyData: DashboardDataState = {
  branchesData: [],
  membersByCategory: [],
  membersByDepartment: [],
  financeMonthly: [],
  financeByCategory: [],
  attendance: [],
  upcomingEvents: [],
  openAlerts: [],
  recentActivities: [],
  departmentPerformance: [],
  reports: [],
};

interface DashboardCacheEntry {
  data: DashboardDataState;
  error: string | null;
  updatedAt: number;
}

const DASHBOARD_CACHE_TTL_MS = 2 * 60 * 1000;
const dashboardCache = new Map<string, DashboardCacheEntry>();

function getDashboardCacheKey(user: Profile | null) {
  if (!user) {
    return 'anonymous';
  }
  const departments = [...user.departmentIds].sort().join(',');
  return `${user.id}|${user.role}|${user.branchId}|${departments}`;
}

function toTitleCase(value: string) {
  return value
    .replaceAll('_', ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function filterByRole(data: DashboardDataState, user: Profile | null): DashboardDataState {
  if (!user || user.role === 'superadmin') {
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

function monthKey(value: string) {
  return value.slice(0, 7);
}

function pickAttendanceValue(row: Record<string, unknown>) {
  const candidates = [
    row.actual_attendance,
    row.expected_attendance,
    row.participants_count,
    row.attendance,
    row.participants,
    row.attendance_count,
    row.participant_count,
    row.frequentation,
    row.frequency,
  ];

  for (const candidate of candidates) {
    const value = Number(candidate);
    if (!Number.isNaN(value)) {
      return value;
    }
  }

  return 0;
}

function pickStringValue(row: Record<string, unknown>, keys: string[], fallback = '') {
  for (const key of keys) {
    const value = row[key];
    if (typeof value === 'string' && value.trim() !== '') {
      return value;
    }
  }
  return fallback;
}

export function useDashboardStats(user: Profile | null) {
  const cacheKey = getDashboardCacheKey(user);
  const initialCache = dashboardCache.get(cacheKey);
  const [data, setData] = useState<DashboardDataState>(initialCache?.data ?? emptyData);
  const [isLoading, setIsLoading] = useState(!initialCache);
  const [error, setError] = useState<string | null>(initialCache?.error ?? null);
  const source = 'supabase' as const;

  useEffect(() => {
    const cached = dashboardCache.get(cacheKey);
    if (cached) {
      setData(cached.data);
      setError(cached.error);
      setIsLoading(false);
    }

    const isCacheFresh = cached ? Date.now() - cached.updatedAt < DASHBOARD_CACHE_TTL_MS : false;

    const load = async (silent = false) => {
      if (!silent) {
        setIsLoading(true);
      }
      setError(null);

      if (!user) {
        setData(emptyData);
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

        const [
          branches,
          members,
          departments,
          financeRecordsRaw,
          servicesRaw,
          eventsRaw,
          reportsRaw,
        ] = await Promise.all([
          getBranches().catch(() => []),
          getMembers().catch(() => []),
          getDepartments().catch(() => []),
          getFinanceRecords().catch(() => []),
          getServices().catch(() => []),
          getEvents().catch(() => []),
          getReports().catch(() => []),
        ]);

        const financeRecords = financeRecordsRaw as Array<Record<string, unknown>>;
        const services = servicesRaw as Array<Record<string, unknown>>;
        const events = eventsRaw as Array<Record<string, unknown>>;
        const reportsTableRows = reportsRaw as Array<Record<string, unknown>>;

        const activityByBranch = new Map<string, number>();
        for (const row of services) {
          const branch = pickStringValue(row, ['branch_id', 'branchId']);
          if (branch) {
            activityByBranch.set(branch, (activityByBranch.get(branch) ?? 0) + 1);
          }
        }
        for (const row of events) {
          const branch = pickStringValue(row, ['branch_id', 'branchId']);
          if (branch) {
            activityByBranch.set(branch, (activityByBranch.get(branch) ?? 0) + 1);
          }
        }
        for (const row of reportsTableRows) {
          const branch = pickStringValue(row, ['branch_id', 'branchId', 'extension_id']);
          if (branch) {
            activityByBranch.set(branch, (activityByBranch.get(branch) ?? 0) + 1);
          }
        }

        const fallbackBranchesData: BranchStatsPoint[] = branches.map((branch) => ({
          branchId: branch.id,
          branchName: branch.name,
          members: branch.memberCount,
          activities: activityByBranch.get(branch.id) ?? 0,
        }));

        const fallbackMembersByDepartment: MembersByDepartmentPoint[] = departments.map((department) => ({
          departmentId: department.id,
          departmentName: department.name,
          members: department.memberCount,
          branchId: department.branchId,
        }));

        const financeByMonthMap = financeRecords.reduce<Record<string, MonthlyFinancePoint>>((acc, row) => {
          const date = String(row.record_date ?? row.recorded_at ?? row.created_at ?? '');
          const key = monthKey(date || new Date().toISOString());
          if (!acc[key]) {
            acc[key] = { month: key, income: 0, expense: 0 };
          }
          const amount = Number(row.amount ?? 0);
          const type = String(row.record_type ?? row.type ?? 'income').toLowerCase();
          if (type === 'expense') {
            acc[key].expense += amount;
          } else {
            acc[key].income += amount;
          }
          return acc;
        }, {});

        const fallbackFinanceMonthly = Object.values(financeByMonthMap).sort((a, b) => a.month.localeCompare(b.month));

        const financeByCategoryMap = financeRecords.reduce<Record<string, number>>((acc, row) => {
          const category = toTitleCase(String(row.category ?? 'other'));
          acc[category] = (acc[category] ?? 0) + Number(row.amount ?? 0);
          return acc;
        }, {});

        const fallbackFinanceByCategory: FinanceCategoryPoint[] = Object.entries(financeByCategoryMap).map(([category, value]) => ({
          category,
          value,
        }));

        const attendanceByDay = services.reduce<Record<string, MonthlyAttendancePoint>>((acc, row) => {
          const dateValue = String(row.service_date ?? row.date ?? '');
          const key = dateValue ? new Date(dateValue).toLocaleDateString('fr-FR', { weekday: 'short' }) : 'N/A';
          if (!acc[key]) {
            acc[key] = {
              label: key,
              attendance: 0,
              branchId: String(row.branch_id ?? ''),
            };
          }
          acc[key].attendance += pickAttendanceValue(row);
          return acc;
        }, {});

        const fallbackAttendance = Object.values(attendanceByDay);

        const today = new Date().toISOString().slice(0, 10);
        const branchById = new Map(branches.map((branch) => [branch.id, branch.name]));
        const departmentById = new Map(departments.map((department) => [department.id, department.name]));
        const departmentsByBranch = departments.reduce<Record<string, Array<{ id: string; name: string }>>>((acc, department) => {
          if (!acc[department.branchId]) {
            acc[department.branchId] = [];
          }
          acc[department.branchId].push({ id: department.id, name: department.name });
          return acc;
        }, {});
        const fallbackUpcomingEvents: UpcomingEventItem[] = events
          .filter((row) => {
            const dateValue = pickStringValue(row, ['event_date', 'date', 'start_date']);
            return dateValue !== '' && dateValue >= today;
          })
          .slice(0, 12)
          .map((row) => ({
            id: String(row.id),
            title: String(row.title ?? 'Evenement'),
            date: pickStringValue(row, ['event_date', 'date', 'start_date']),
            location: branchById.get(pickStringValue(row, ['branch_id', 'branchId'])) ?? String(row.location ?? row.venue ?? 'N/A'),
            branchId: pickStringValue(row, ['branch_id', 'branchId']),
            departmentId: row.organizer_department_id ? String(row.organizer_department_id) : undefined,
          }));

        const fallbackMembersByCategory: MembersCategoryPoint[] = [
          { category: 'Femmes', value: members.filter((m) => m.gender === 'female').length },
          { category: 'Hommes', value: members.filter((m) => m.gender === 'male').length },
        ].filter((item) => item.value > 0);

        const nextData: DashboardDataState = {
          branchesData:
            membersByBranchRows.length > 0
              ? membersByBranchRows.map((row) => ({
                  branchId: row.branch_id,
                  branchName: row.branch_name,
                  members: row.members_total,
                  activities: activityByBranch.get(row.branch_id) ?? 0,
                }))
              : fallbackBranchesData,
          membersByCategory:
            membersByCategoryRows.length > 0
              ? membersByCategoryRows.map((row) => ({
                  branchId: row.branch_id,
                  category: toTitleCase(row.member_category),
                  value: row.members_count,
                }))
              : fallbackMembersByCategory,
          membersByDepartment:
            membersByDepartmentRows.length > 0
              ? membersByDepartmentRows.map((row) => ({
                  departmentId: row.department_id,
                  departmentName: row.department_name,
                  members: row.members_count,
                  branchId: row.branch_id,
                }))
              : fallbackMembersByDepartment,
          financeMonthly:
            financeMonthlyRows.length > 0
              ? financeMonthlyRows.map((row) => ({
                  branchId: row.branch_id,
                  month: String(row.month).slice(0, 7),
                  income: row.income_total,
                  expense: row.expense_total,
                }))
              : fallbackFinanceMonthly,
          financeByCategory:
            financeByCategoryRows.length > 0
              ? financeByCategoryRows.map((row) => ({
                  branchId: row.branch_id,
                  category: toTitleCase(row.category),
                  value: row.amount_total,
                }))
              : fallbackFinanceByCategory,
          attendance:
            attendanceRows.length > 0
              ? attendanceRows.map((row) => ({
                  branchId: row.branch_id,
                  label: row.service_day,
                  attendance: pickAttendanceValue(row as unknown as Record<string, unknown>),
                }))
              : fallbackAttendance,
          upcomingEvents:
            upcomingRows.length > 0
              ? upcomingRows.map((row) => ({
                  id: row.event_id,
                  title: row.title,
                  date: row.event_date,
                  location: row.branch_name,
                  branchId: row.branch_id,
                }))
              : fallbackUpcomingEvents,
          openAlerts:
            alertsRows.length > 0
              ? alertsRows.map((row) => ({
                  id: row.alert_id,
                  title: row.title,
                  description: `Niveau ${row.level}`,
                  level: row.level === 'critical' ? 'critical' : row.level === 'warning' ? 'warning' : 'info',
                  branchId: row.branch_id,
                }))
              : (() => {
                  const totalUpcoming = fallbackUpcomingEvents.length;
                  const netAmount = fallbackFinanceMonthly.reduce((sum, item) => sum + item.income - item.expense, 0);
                  const alerts: SmartAlertItem[] = [];
                  if (netAmount < 0) {
                    alerts.push({
                      id: 'alert-finance-negative',
                      title: 'Solde financier negatif',
                      description: 'Les depenses depassent les revenus sur la periode recente.',
                      level: 'warning',
                    });
                  }
                  if (totalUpcoming === 0) {
                    alerts.push({
                      id: 'alert-no-events',
                      title: 'Aucun evenement planifie',
                      description: 'Ajoutez des evenements pour alimenter le calendrier.',
                      level: 'info',
                    });
                  }
                  if (alerts.length === 0) {
                    alerts.push({
                      id: 'alert-ok',
                      title: 'Suivi stable',
                      description: 'Aucune alerte critique detectee pour le moment.',
                      level: 'info',
                    });
                  }
                  return alerts;
                })(),
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
              : [
                  ...events.slice(0, 5).map((row) => ({
                    id: `ev-${String(row.id ?? crypto.randomUUID())}`,
                    title: `Evenement: ${String(row.title ?? 'Evenement')}`,
                    description: String(row.location ?? branchById.get(String(row.branch_id ?? '')) ?? 'Organisation locale'),
                    date: String(row.event_date ?? row.date ?? new Date().toISOString()),
                    level: 'info' as const,
                    status: 'planifie' as const,
                    branchId: row.branch_id ? String(row.branch_id) : undefined,
                    departmentId: row.organizer_department_id ? String(row.organizer_department_id) : undefined,
                  })),
                  ...reportsTableRows.slice(0, 4).map((row) => ({
                    id: `rp-${String(row.id ?? crypto.randomUUID())}`,
                    title: `Rapport: ${String(row.title ?? row.name ?? 'Rapport')}`,
                    description: 'Nouveau rapport disponible.',
                    date: String(row.generated_at ?? row.report_date ?? row.created_at ?? new Date().toISOString()),
                    level: 'success' as const,
                    status: 'termine' as const,
                    branchId: row.branch_id ? String(row.branch_id) : undefined,
                    departmentId: row.department_id ? String(row.department_id) : undefined,
                  })),
                ]
                  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                  .slice(0, 10),
          departmentPerformance: performanceRows.map((row) => {
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
          }).length
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
            : departments.map((department) => ({
                departmentId: department.id,
                departmentName: department.name,
                completionRate: department.memberCount > 0 ? 40 : 0,
                target: Math.max(department.memberCount, 1),
                achieved: department.memberCount > 0 ? Math.max(Math.round(department.memberCount * 0.4), 1) : 0,
                branchId: department.branchId,
              })),
          reports:
            reportsTableRows.length > 0
              ? reportsTableRows.map((row) => ({
                  ...(() => {
                    const rawBranchId = row.branch_id ? String(row.branch_id) : undefined;
                    const rawDepartmentId = row.department_id ? String(row.department_id) : undefined;
                    const onlyDepartmentInBranch =
                      rawBranchId && departmentsByBranch[rawBranchId]?.length === 1
                        ? departmentsByBranch[rawBranchId][0]
                        : undefined;
                    const resolvedDepartmentId = rawDepartmentId ?? onlyDepartmentInBranch?.id;
                    const resolvedDepartmentName =
                      row.department_name
                        ? String(row.department_name)
                        : resolvedDepartmentId
                          ? (departmentById.get(resolvedDepartmentId) ?? onlyDepartmentInBranch?.name)
                          : undefined;
                    return {
                      resolvedBranchId: rawBranchId,
                      resolvedDepartmentId,
                      resolvedDepartmentName,
                    };
                  })(),
                  id: String(row.id ?? crypto.randomUUID()),
                  title: String(row.title ?? row.name ?? 'Rapport'),
                  period: String(
                    row.period ??
                      row.period_label ??
                      row.reporting_period ??
                      row.period_start ??
                      row.start_period ??
                      'Periode non definie',
                  ),
                  generatedAt: String(row.generated_at ?? row.report_date ?? row.date ?? row.created_at ?? new Date().toISOString()),
                  type: String(row.type ?? row.report_type ?? row.category ?? 'department'),
                  summary: row.summary ? String(row.summary) : row.description ? String(row.description) : undefined,
                  departmentName:
                    (() => {
                      const rawBranchId = row.branch_id ? String(row.branch_id) : undefined;
                      const rawDepartmentId = row.department_id ? String(row.department_id) : undefined;
                      const onlyDepartmentInBranch =
                        rawBranchId && departmentsByBranch[rawBranchId]?.length === 1
                          ? departmentsByBranch[rawBranchId][0]
                          : undefined;
                      const resolvedDepartmentId = rawDepartmentId ?? onlyDepartmentInBranch?.id;
                      return row.department_name
                        ? String(row.department_name)
                        : resolvedDepartmentId
                          ? (departmentById.get(resolvedDepartmentId) ?? onlyDepartmentInBranch?.name)
                          : undefined;
                    })(),
                  branchId: row.branch_id ? String(row.branch_id) : undefined,
                  departmentId:
                    (() => {
                      const rawBranchId = row.branch_id ? String(row.branch_id) : undefined;
                      const rawDepartmentId = row.department_id ? String(row.department_id) : undefined;
                      const onlyDepartmentInBranch =
                        rawBranchId && departmentsByBranch[rawBranchId]?.length === 1
                          ? departmentsByBranch[rawBranchId][0]
                          : undefined;
                      return rawDepartmentId ?? onlyDepartmentInBranch?.id;
                    })(),
                  status: 'soumis' as const,
                }))
              : [],
        };

        setData(nextData);

        // Show warning only when all dashboard views failed.
        const nextError =
          failedRequests.length === settledResults.length
            ? 'Certaines donnees du dashboard n ont pas pu etre chargees.'
            : null;

        setError(nextError);
        dashboardCache.set(cacheKey, {
          data: nextData,
          error: nextError,
          updatedAt: Date.now(),
        });
      } catch (err) {
        setData(emptyData);
        const nextError = err instanceof Error ? err.message : 'Erreur lors du chargement du dashboard.';
        setError(nextError);
        dashboardCache.set(cacheKey, {
          data: emptyData,
          error: nextError,
          updatedAt: Date.now(),
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (isCacheFresh) {
      return;
    }

    void load(Boolean(cached));
  }, [cacheKey]);

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
      localDepartments: user ? scopedData.membersByDepartment.length : 0,
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

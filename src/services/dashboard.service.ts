import { supabase } from '@/lib/supabase';
import type {
  DashboardDepartmentPerformanceRow,
  DashboardFinanceByCategoryRow,
  DashboardFinanceMonthlyRow,
  DashboardMembersByBranchRow,
  DashboardMembersByCategoryRow,
  DashboardMembersByDepartmentRow,
  DashboardOpenAlertsRow,
  DashboardRecentActivitiesRow,
  DashboardServiceAttendanceRow,
  DashboardUpcomingEventsRow,
} from '@/services/types';

async function selectView<T>(viewName: string): Promise<T[]> {
  const { data, error } = await supabase.from(viewName).select('*');
  if (error || !data) {
    throw error ?? new Error(`Impossible de charger la vue ${viewName}`);
  }

  return data as T[];
}

export async function getDashboardMembersByBranch() {
  return selectView<DashboardMembersByBranchRow>('v_dashboard_members_by_branch');
}

export async function getDashboardMembersByCategory() {
  return selectView<DashboardMembersByCategoryRow>('v_dashboard_members_by_category');
}

export async function getDashboardMembersByDepartment() {
  return selectView<DashboardMembersByDepartmentRow>('v_dashboard_members_by_department');
}

export async function getDashboardFinanceMonthly() {
  return selectView<DashboardFinanceMonthlyRow>('v_dashboard_finance_monthly');
}

export async function getDashboardFinanceByCategory() {
  return selectView<DashboardFinanceByCategoryRow>('v_dashboard_finance_by_category');
}

export async function getDashboardServiceAttendance() {
  return selectView<DashboardServiceAttendanceRow>('v_dashboard_service_attendance');
}

export async function getDashboardUpcomingEvents() {
  return selectView<DashboardUpcomingEventsRow>('v_dashboard_upcoming_events');
}

export async function getDashboardOpenAlerts() {
  return selectView<DashboardOpenAlertsRow>('v_dashboard_open_alerts');
}

export async function getDashboardRecentActivities() {
  return selectView<DashboardRecentActivitiesRow>('v_dashboard_recent_activities');
}

export async function getDashboardDepartmentPerformance() {
  return selectView<DashboardDepartmentPerformanceRow>('v_dashboard_department_performance');
}


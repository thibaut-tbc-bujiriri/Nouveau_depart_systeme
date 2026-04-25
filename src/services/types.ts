import type { Role } from '@/types';

export interface ProfileRow {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  role: Role;
  branch_id: string | null;
  avatar_url: string | null;
  status: string | null;
  metadata?: Record<string, unknown> | null;
  last_sign_in_at?: string | null;
  title?: string | null;
}

export interface BranchRow {
  id: string;
  code: string | null;
  name: string;
  city: string | null;
  country: string | null;
  pastor_name: string | null;
  created_at: string;
  is_active: boolean | null;
}

export interface DepartmentRow {
  id: string;
  branch_id: string;
  name: string;
  manager_id?: string | null;
  manager_profile_id?: string | null;
  monthly_budget?: number | null;
  is_active?: boolean | null;
  created_at?: string;
}

export interface ChurchMemberRow {
  id: string;
  branch_id: string;
  first_name: string | null;
  last_name: string | null;
  gender: string | null;
  phone: string | null;
  email: string | null;
  joined_at: string | null;
  status: string | null;
}

export interface ChurchMemberDepartmentRow {
  church_member_id: string;
  department_id: string;
}

export interface DepartmentMemberRow {
  department_id: string;
  profile_id?: string;
  user_id?: string;
  role_in_department?: string | null;
  joined_at?: string | null;
}

export interface DashboardMembersByBranchRow {
  branch_id: string;
  branch_name: string;
  members_total: number;
  members_active?: number;
}

export interface DashboardMembersByCategoryRow {
  branch_id: string;
  branch_name: string;
  member_category: string;
  members_count: number;
}

export interface DashboardMembersByDepartmentRow {
  department_id: string;
  department_name: string;
  branch_id: string;
  branch_name: string;
  members_count: number;
}

export interface DashboardFinanceMonthlyRow {
  branch_id: string;
  branch_name: string;
  month: string;
  income_total: number;
  expense_total: number;
  net_total?: number;
}

export interface DashboardFinanceByCategoryRow {
  branch_id: string;
  branch_name: string;
  category: string;
  record_type: string;
  amount_total: number;
  records_count: number;
}

export interface DashboardServiceAttendanceRow {
  service_id: string;
  branch_id: string;
  branch_name: string;
  service_title: string;
  service_day: string;
  participants_count: number;
}

export interface DashboardUpcomingEventsRow {
  event_id: string;
  branch_id: string;
  branch_name: string;
  title: string;
  event_date: string;
  start_time: string | null;
  end_time: string | null;
  status: string;
}

export interface DashboardOpenAlertsRow {
  alert_id: string;
  branch_id: string;
  branch_name: string;
  title: string;
  level: string;
  status: string;
  created_at: string;
}

export interface DashboardRecentActivitiesRow {
  activity_id: string;
  branch_id: string;
  branch_name: string;
  department_id: string | null;
  department_name: string | null;
  title: string;
  status: string;
  created_at: string;
}

export interface DashboardDepartmentPerformanceRow {
  department_id: string;
  branch_id: string;
  branch_name: string;
  department_name: string;
  members_count: number;
  reports_count_90d: number;
  activities_count_90d: number;
  finance_total_90d: number;
}


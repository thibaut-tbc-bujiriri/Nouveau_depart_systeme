export interface BranchStatsPoint {
  branchId: string;
  branchName: string;
  members: number;
  activities: number;
}

export interface MonthlyFinancePoint {
  month: string;
  income: number;
  expense: number;
  branchId?: string;
}

export interface DepartmentDistributionPoint {
  name: string;
  value: number;
}

export interface MembersByDepartmentPoint {
  departmentId: string;
  departmentName: string;
  members: number;
  branchId: string;
}

export interface MonthlyAttendancePoint {
  label: string;
  attendance: number;
  branchId?: string;
  departmentId?: string;
}

export interface MembersCategoryPoint {
  category: string;
  value: number;
  branchId?: string;
}

export interface ActivityItem {
  id: string;
  title: string;
  description: string;
  date: string;
  level: 'info' | 'warning' | 'success';
  status: 'planifie' | 'en_cours' | 'termine';
  branchId?: string;
  departmentId?: string;
}

export interface ReportItem {
  id: string;
  title: string;
  period: string;
  generatedAt: string;
  type: string;
  departmentName?: string;
  summary?: string;
  status?: 'soumis' | 'en_attente' | 'en_retard';
  branchId?: string;
  departmentId?: string;
}

export interface FinanceCategoryPoint {
  category: string;
  value: number;
  branchId?: string;
}

export interface DepartmentPerformancePoint {
  departmentId: string;
  departmentName: string;
  completionRate: number;
  target: number;
  achieved: number;
  branchId: string;
}

export interface UpcomingEventItem {
  id: string;
  title: string;
  date: string;
  location: string;
  branchId?: string;
  departmentId?: string;
}

export interface KpiItem {
  key: string;
  label: string;
  value: string;
  trend: number;
}

export interface SpiritualFocus {
  verseReference: string;
  verseText: string;
  visionTitle: string;
  visionText: string;
  inspirationalMessage: string;
}

export interface WeeklyProgramItem {
  day: string;
  title: string;
  startTime: string;
  location: string;
}

export interface SmartAlertItem {
  id: string;
  title: string;
  description: string;
  level: 'warning' | 'critical' | 'info';
  branchId?: string;
  departmentId?: string;
}


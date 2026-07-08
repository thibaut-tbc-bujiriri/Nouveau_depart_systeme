export type Role = 'superadmin' | 'admin' | 'department_manager' | 'department_member';

export type DepartmentUserRole = 'department_manager' | 'department_member';

export type DepartmentName =
  | 'Mamans'
  | 'Papas'
  | 'Ecodim'
  | 'Coordination'
  | 'Caisse'
  | 'Protocole'
  | 'Proprete'
  | 'Musique'
  | 'Chanteurs'
  | 'Evangelisation'
  | 'Moderation'
  | 'Enseignement'
  | 'Interpretation'
  | 'Logistique & Transport'
  | 'Informatique'
  | 'Media'
  | 'Tresorerie';

export interface Branch {
  id: string;
  code: string;
  name: string;
  city: string;
  country: string;
  pastorName: string;
  pastorId?: string;
  createdAt: string;
  memberCount: number;
  departmentCount: number;
  isActive: boolean;
  avatarUrl?: string;
}

export interface Profile {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  role: Role;
  branchId: string;
  departmentIds: string[];
  avatarUrl?: string;
  title?: string;
}

export interface Department {
  id: string;
  branchId: string;
  name: string;
  managerId: string;
  memberCount: number;
  monthlyBudget: number;
  isActive: boolean;
}

export interface UserDepartmentRelation {
  id: string;
  userId: string;
  departmentId: string;
  roleInDepartment: DepartmentUserRole;
  joinedAt: string;
}

export interface DepartmentMember {
  id: string;
  departmentId: string;
  profileId: string;
  joinedAt: string;
  position: 'manager' | 'assistant' | 'member';
}

export interface ChurchMember {
  id: string;
  branchId: string;
  firstName: string;
  lastName: string;
  gender: 'female' | 'male';
  phone: string;
  email?: string;
  departmentIds: string[];
  joinedAt: string;
  status: 'active' | 'inactive';
  avatarUrl?: string;
}

export interface FinanceRecord {
  id: string;
  branchId: string;
  departmentId?: string;
  type: 'income' | 'expense';
  category: 'offering' | 'tithe' | 'donation' | 'salary' | 'logistics' | 'maintenance' | 'other';
  amount: number;
  currency: 'USD';
  description: string;
  recordedAt: string;
  createdBy: string;
}

export interface Service {
  id: string;
  branchId: string;
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  preacher: string;
  attendance: number;
  type: 'sunday' | 'midweek' | 'prayer' | 'special';
}

export interface Event {
  id: string;
  branchId: string;
  title: string;
  date: string;
  location: string;
  organizerDepartmentId?: string;
  status: 'draft' | 'scheduled' | 'completed';
  expectedParticipants: number;
}

export interface Report {
  id: string;
  branchId: string;
  title: string;
  type: 'finance' | 'attendance' | 'department' | 'members';
  period: string;
  summary: string;
  generatedAt: string;
}

export interface NavItem {
  key: string;
  label: string;
  to: string;
  icon: string;
  allowedRoles: Role[];
}

export interface DashboardStats {
  totalBranches: number;
  totalMembers: number;
  totalDepartments: number;
  monthlyIncome: number;
  monthlyExpense: number;
}

export interface LoginFormValues {
  email: string;
  password: string;
}

export interface SelectOption {
  label: string;
  value: string;
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: string;
  priority: 'low' | 'normal' | 'high' | 'critical';
  targetRole?: Role | null;
  targetUserId?: string | null;
  targetExtensionId?: string | null;
  targetDepartmentId?: string | null;
  createdBy?: string | null;
  link?: string | null;
  metadata?: Record<string, any> | null;
  isRead: boolean;
  readAt?: string | null;
  createdAt: string;
}



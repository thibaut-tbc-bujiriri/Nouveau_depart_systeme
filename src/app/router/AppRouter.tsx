import { RoleGuard } from '@/components/common';
import { AuthLayout } from '@/layouts/AuthLayout';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import {
  BranchesPage,
  CardScannerPage,
  DashboardPage,
  DepartmentDetailsPage,
  DepartmentsPage,
  EventsPage,
  FinancesPage,
  ForgotPasswordPage,
  LoginPage,
  MembersPage,
  NotAuthorizedPage,
  NotFoundPage,
  ProfilePage,
  ReportsPage,
  ServicesPage,
  SettingsPage,
  UsersPage,
} from '@/pages';
import { ProtectedRoute } from '@/components/common';
import { Navigate, Route, Routes } from 'react-router-dom';

export function AppRouter() {
  return (
    <Routes>
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route element={<DashboardLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/departments" element={<DepartmentsPage />} />
          <Route path="/departments/:id" element={<DepartmentDetailsPage />} />
          <Route path="/services" element={<ServicesPage />} />
          <Route path="/events" element={<EventsPage />} />
          <Route path="/profile" element={<ProfilePage />} />          <Route element={<RoleGuard allowedRoles={['superadmin', 'admin']} />}>
            <Route path="/card-scanner" element={<CardScannerPage />} />
          </Route>

          <Route element={<RoleGuard allowedRoles={['superadmin', 'admin', 'department_manager']} />}>
            <Route path="/members" element={<MembersPage />} />
            <Route path="/reports" element={<ReportsPage />} />
          </Route>

          <Route element={<RoleGuard allowedRoles={['superadmin', 'admin']} requiredPermission="branches:view" />}>
            <Route path="/branches" element={<BranchesPage />} />
          </Route>

          <Route element={<RoleGuard allowedRoles={['superadmin', 'admin']} requiredPermission="users:view" />}>
            <Route path="/users" element={<UsersPage />} />
          </Route>

          <Route element={<RoleGuard allowedRoles={['superadmin', 'admin']} />}>
            <Route path="/finances" element={<FinancesPage />} />
          </Route>

          <Route element={<RoleGuard allowedRoles={['superadmin', 'admin', 'department_manager']} />}>
            <Route path="/settings" element={<SettingsPage />} />
          </Route>

          <Route path="/not-authorized" element={<NotAuthorizedPage />} />
        </Route>
      </Route>

      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}


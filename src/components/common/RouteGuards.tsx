import { LoadingState } from '@/components/common';
import { useAuth } from '@/hooks/useAuth';
import { canAccess, hasPermission, type Permission } from '@/lib/permissions';
import type { Role } from '@/types';
import { Navigate, Outlet } from 'react-router-dom';

interface ProtectedRouteProps {
  allowedRoles?: Role[];
  requiredPermission?: Permission;
}

export function ProtectedRoute({ allowedRoles, requiredPermission }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return <LoadingState message="Verification de votre session..." />;
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !canAccess(user.role, allowedRoles)) {
    return <Navigate to="/not-authorized" replace />;
  }

  if (requiredPermission && !hasPermission(user.role, requiredPermission)) {
    return <Navigate to="/not-authorized" replace />;
  }

  return <Outlet />;
}

interface RoleGuardProps {
  allowedRoles: Role[];
  requiredPermission?: Permission;
}

export function RoleGuard({ allowedRoles, requiredPermission }: RoleGuardProps) {
  return <ProtectedRoute allowedRoles={allowedRoles} requiredPermission={requiredPermission} />;
}


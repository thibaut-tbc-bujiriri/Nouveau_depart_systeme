import { departments as mockDepartments, users as mockUsers } from '@/data';
import { useBranches } from '@/hooks/useBranches';
import {
  getManagedUsers,
  updateUserAccess,
  type ManagedUser,
} from '@/services/users.service';
import type { Department, Role } from '@/types';
import { useCallback, useEffect, useState } from 'react';

export function useUsersManagement() {
  const { branches } = useBranches();
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [source, setSource] = useState<'supabase' | 'mock'>('supabase');

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await getManagedUsers();
      setUsers(data.users);
      setDepartments(
        data.departments.map((item) => ({
          id: item.id,
          branchId: item.branch_id,
          name: item.name as Department['name'],
          managerId: String(item.manager_profile_id ?? item.manager_id ?? ''),
          memberCount: 0,
          monthlyBudget: Number(item.monthly_budget ?? 0),
          isActive: item.is_active ?? true,
        })),
      );
      setSource('supabase');
    } catch (err) {
      setUsers(
        mockUsers.map((item) => ({
          id: item.id,
          fullName: item.fullName,
          email: item.email,
          phone: item.phone,
          role: item.role,
          branchId: item.branchId,
          departmentIds: item.departmentIds,
          status: 'active',
        })),
      );
      setDepartments(mockDepartments);
      setSource('mock');
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement des utilisateurs.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const saveUserAccess = async (userId: string, values: { role: Role; branchId: string; departmentIds: string[] }) => {
    setIsSaving(true);
    setError(null);

    try {
      await updateUserAccess(userId, values);
      await load();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Impossible de sauvegarder les droits utilisateur.');
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  return {
    users,
    branches,
    departments,
    isLoading,
    isSaving,
    error,
    source,
    reload: load,
    saveUserAccess,
  };
}

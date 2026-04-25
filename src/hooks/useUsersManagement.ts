import { useBranches } from '@/hooks/useBranches';
import {
  createManagedUser,
  deleteManagedUser,
  getManagedUsers,
  updateManagedUserPassword,
  updateUserAccess,
  type ManagedUser,
} from '@/services/users.service';
import type { Department, Role } from '@/types';
import { useCallback, useEffect, useState } from 'react';

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  if (typeof error === 'object' && error !== null && 'message' in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === 'string' && message.trim().length > 0) {
      return message;
    }
  }

  return fallback;
}

export function useUsersManagement() {
  const { branches } = useBranches();
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const source = 'supabase' as const;

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
    } catch (err) {
      setUsers([]);
      setDepartments([]);
      setError(getErrorMessage(err, 'Erreur lors du chargement des utilisateurs.'));
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
      setError(getErrorMessage(err, 'Impossible de sauvegarder les droits utilisateur.'));
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const changeUserPassword = async (userId: string, password: string) => {
    setIsSaving(true);
    setError(null);

    try {
      await updateManagedUserPassword({ userId, password });
      return true;
    } catch (err) {
      const message = getErrorMessage(
        err,
        'Impossible de modifier le mot de passe. Configurez la fonction admin-set-user-password cote serveur.',
      );
      setError(message);
      throw new Error(message);
    } finally {
      setIsSaving(false);
    }
  };

  const createUser = async (values: {
    fullName: string;
    email: string;
    password: string;
    role: Role;
    branchId: string;
    departmentIds: string[];
  }) => {
    setIsCreating(true);
    setError(null);

    try {
      await createManagedUser(values);
      await load();
      return true;
    } catch (err) {
      setError(getErrorMessage(err, 'Impossible de creer le compte utilisateur.'));
      return false;
    } finally {
      setIsCreating(false);
    }
  };

  const deleteUser = async (userId: string) => {
    setIsDeleting(true);
    setError(null);

    try {
      await deleteManagedUser(userId);
      await load();
      return true;
    } catch (err) {
      setError(getErrorMessage(err, 'Impossible de supprimer le compte utilisateur.'));
      return false;
    } finally {
      setIsDeleting(false);
    }
  };

  return {
    users,
    branches,
    departments,
    isLoading,
    isSaving,
    isCreating,
    isDeleting,
    error,
    source,
    reload: load,
    saveUserAccess,
    changeUserPassword,
    createUser,
    deleteUser,
  };
}

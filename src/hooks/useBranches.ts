import {
  createBranch,
  deleteBranch,
  getBranches,
  type BranchUpsertInput,
  updateBranch,
} from '@/services/branches.service';
import type { Branch } from '@/types';
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

export function useBranches() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isMutating, setIsMutating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const source = 'supabase' as const;

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const rows = await getBranches();
      setBranches(rows);
    } catch (err) {
      setBranches([]);
      setError(getErrorMessage(err, 'Erreur lors du chargement des extensions.'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const runMutation = useCallback(
    async (action: () => Promise<void>) => {
      setIsMutating(true);
      setError(null);
      try {
        await action();
        await load();
        return true;
      } catch (err) {
        setError(getErrorMessage(err, 'Operation impossible.'));
        return false;
      } finally {
        setIsMutating(false);
      }
    },
    [load],
  );

  return {
    branches,
    isLoading,
    isMutating,
    error,
    source,
    reload: load,
    createBranch: (payload: BranchUpsertInput) => runMutation(() => createBranch(payload)),
    updateBranch: (branchId: string, payload: BranchUpsertInput) => runMutation(() => updateBranch(branchId, payload)),
    deleteBranch: (branchId: string) => runMutation(() => deleteBranch(branchId)),
  };
}

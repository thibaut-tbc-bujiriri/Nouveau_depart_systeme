import { branches as mockBranches } from '@/data';
import {
  createBranch,
  deleteBranch,
  getBranches,
  type BranchUpsertInput,
  updateBranch,
} from '@/services/branches.service';
import type { Branch } from '@/types';
import { useCallback, useEffect, useState } from 'react';

export function useBranches() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isMutating, setIsMutating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [source, setSource] = useState<'supabase' | 'mock'>('supabase');

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const rows = await getBranches();
      setBranches(rows);
      setSource('supabase');
    } catch (err) {
      setBranches(mockBranches);
      setSource('mock');
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement des extensions.');
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
        setError(err instanceof Error ? err.message : 'Operation impossible.');
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

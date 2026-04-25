import { createMember, deleteMember, getMembers, type MemberUpsertInput, updateMember } from '@/services/members.service';
import type { ChurchMember } from '@/types';
import { useCallback, useEffect, useState } from 'react';

function getErrorMessage(error: unknown, fallback: string): string {
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

export function useMembers() {
  const [members, setMembers] = useState<ChurchMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isMutating, setIsMutating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const source = 'supabase' as const;

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const rows = await getMembers();
      setMembers(rows);
    } catch (err) {
      setMembers([]);
      setError(getErrorMessage(err, 'Erreur lors du chargement des membres.'));
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
    members,
    isLoading,
    isMutating,
    error,
    source,
    reload: load,
    createMember: (payload: MemberUpsertInput) => runMutation(() => createMember(payload)),
    updateMember: (memberId: string, payload: MemberUpsertInput) => runMutation(() => updateMember(memberId, payload)),
    deleteMember: (memberId: string) => runMutation(() => deleteMember(memberId)),
  };
}

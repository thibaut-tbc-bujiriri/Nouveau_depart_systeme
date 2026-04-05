import { members as mockMembers } from '@/data';
import { createMember, deleteMember, getMembers, type MemberUpsertInput, updateMember } from '@/services/members.service';
import type { ChurchMember } from '@/types';
import { useCallback, useEffect, useState } from 'react';

export function useMembers() {
  const [members, setMembers] = useState<ChurchMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isMutating, setIsMutating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [source, setSource] = useState<'supabase' | 'mock'>('supabase');

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const rows = await getMembers();
      setMembers(rows);
      setSource('supabase');
    } catch (err) {
      setMembers(mockMembers);
      setSource('mock');
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement des membres.');
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

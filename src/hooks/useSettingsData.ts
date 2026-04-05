import { useAuth } from '@/hooks/useAuth';
import { useBranches } from '@/hooks/useBranches';
import { supabase } from '@/lib/supabase';
import { updateCurrentProfile } from '@/services/profile.service';
import { useMemo, useState } from 'react';

export interface SettingsFormValues {
  churchName: string;
  contactEmail: string;
  contactPhone: string;
  address: string;
}

export function useSettingsData() {
  const { user } = useAuth();
  const { branches, isLoading: isBranchesLoading } = useBranches();
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);

  const branch = useMemo(() => branches.find((item) => item.id === user?.branchId), [branches, user?.branchId]);

  const initialValues = useMemo<SettingsFormValues>(
    () => ({
      churchName: branch?.name ?? 'ECND',
      contactEmail: user?.email ?? '',
      contactPhone: user?.phone ?? '',
      address: branch ? `${branch.city}, ${branch.country}` : 'Adresse non definie',
    }),
    [branch, user?.email, user?.phone],
  );

  const saveSettings = async (values: SettingsFormValues) => {
    if (!user) {
      setSaveError('Session absente.');
      return false;
    }

    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(null);

    try {
      const updatedProfile = await updateCurrentProfile(user.id, {
        fullName: user.fullName,
        phone: values.contactPhone,
      });

      if (!updatedProfile) {
        throw new Error('Profil introuvable apres mise a jour.');
      }

      if (user.branchId) {
        const [cityRaw, ...countryParts] = values.address.split(',');
        const city = cityRaw?.trim() || branch?.city || 'N/A';
        const country = countryParts.join(',').trim() || branch?.country || 'RDC';

        const { error: branchError } = await supabase
          .from('branches')
          .update({
            name: values.churchName,
            city,
            country,
          })
          .eq('id', user.branchId);

        if (branchError) {
          throw branchError;
        }
      }

      setSaveSuccess('Parametres sauvegardes avec succes.');
      return true;
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'Erreur lors de la sauvegarde des parametres.');
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  return {
    initialValues,
    isLoading: isBranchesLoading,
    isSaving,
    saveError,
    saveSuccess,
    saveSettings,
  };
}

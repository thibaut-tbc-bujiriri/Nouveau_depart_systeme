import { EmptyState, LoadingState, PageHeader } from '@/components/common';
import { AppButton, AppInput, AppTextarea, FormFieldWrapper } from '@/components/ui';
import { useSettingsData } from '@/hooks/useSettingsData';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

const settingsSchema = z.object({
  churchName: z.string().min(2, 'Le nom est requis'),
  contactEmail: z.string().email('Email invalide'),
  contactPhone: z.string().min(8, 'Telephone invalide'),
  address: z.string().min(3, 'Adresse trop courte'),
});

type SettingsSchema = z.infer<typeof settingsSchema>;

export function SettingsPage() {
  const { initialValues, isLoading, isSaving, saveError, saveSuccess, saveSettings } = useSettingsData();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<SettingsSchema>({
    resolver: zodResolver(settingsSchema),
    defaultValues: initialValues,
  });

  useEffect(() => {
    reset(initialValues);
  }, [initialValues, reset]);

  const onSubmit = async (values: SettingsSchema) => {
    await saveSettings(values);
  };

  if (isLoading) {
    return <LoadingState message="Chargement des parametres..." />;
  }

  if (!initialValues.contactEmail) {
    return <EmptyState title="Session requise" description="Reconnectez-vous pour acceder aux parametres." />;
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Parametres" description="Configuration generale de l'application et de l'eglise." />

      {saveError ? <EmptyState title="Echec de sauvegarde" description={saveError} /> : null}
      {saveSuccess ? <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{saveSuccess}</div> : null}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <FormFieldWrapper label="Nom de l'eglise" error={errors.churchName?.message} required>
          <AppInput {...register('churchName')} />
        </FormFieldWrapper>

        <div className="grid gap-4 md:grid-cols-2">
          <FormFieldWrapper label="Email de contact" error={errors.contactEmail?.message} required>
            <AppInput type="email" {...register('contactEmail')} disabled />
          </FormFieldWrapper>
          <FormFieldWrapper label="Telephone" error={errors.contactPhone?.message} required>
            <AppInput {...register('contactPhone')} />
          </FormFieldWrapper>
        </div>

        <FormFieldWrapper label="Adresse" error={errors.address?.message} required>
          <AppTextarea rows={3} {...register('address')} />
        </FormFieldWrapper>

        <AppButton type="submit" isLoading={isSaving}>
          Enregistrer
        </AppButton>
      </form>
    </div>
  );
}


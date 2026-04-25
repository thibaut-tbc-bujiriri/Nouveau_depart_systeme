import { DepartmentBadge, EmptyState, LoadingState, PageHeader, UserAvatar } from '@/components/common';
import { AppButton, AppInput, FormFieldWrapper } from '@/components/ui';
import { Modal } from '@/components/ui/Modal';
import { useAuth } from '@/hooks/useAuth';
import { useBranches } from '@/hooks/useBranches';
import { useDepartments } from '@/hooks/useDepartments';
import { updateCurrentUserPassword } from '@/services/auth.service';
import { updateCurrentProfile } from '@/services/profile.service';
import { roleLabels } from '@/utils/permissions';
import { useMemo, useState } from 'react';

interface ProfileFormState {
  fullName: string;
  phone: string;
  title: string;
}

interface PasswordFormState {
  newPassword: string;
  confirmPassword: string;
}

export function ProfilePage() {
  const { user, authUser, isLoading, initializeAuth } = useAuth();
  const { branches } = useBranches();
  const { departments } = useDepartments();

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isPasswordOpen, setIsPasswordOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [profileForm, setProfileForm] = useState<ProfileFormState>({
    fullName: '',
    phone: '',
    title: '',
  });
  const [passwordForm, setPasswordForm] = useState<PasswordFormState>({
    newPassword: '',
    confirmPassword: '',
  });

  const branch = branches.find((item) => item.id === user?.branchId);
  const userDepartments = departments.filter((department) => user?.departmentIds.includes(department.id));
  const branchLabel =
    branch?.name ?? (user?.role === 'superadmin' ? 'Global (toutes extensions)' : 'Non assignee');

  const initials = useMemo(() => {
    if (!user?.fullName) {
      return 'NA';
    }
    return user.fullName
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join('');
  }, [user?.fullName]);

  if (isLoading) {
    return <LoadingState message="Chargement du profil..." />;
  }

  if (!user) {
    return <EmptyState title="Session invalide" description="Reconnectez-vous pour voir votre profil." />;
  }

  const openEditModal = () => {
    setErrorMessage(null);
    setSuccessMessage(null);
    setProfileForm({
      fullName: user.fullName ?? '',
      phone: user.phone ?? '',
      title: user.title ?? '',
    });
    setIsEditOpen(true);
  };

  const openPasswordModal = () => {
    setErrorMessage(null);
    setSuccessMessage(null);
    setPasswordForm({
      newPassword: '',
      confirmPassword: '',
    });
    setIsPasswordOpen(true);
  };

  const handleSaveProfile = async () => {
    if (!profileForm.fullName.trim() || profileForm.phone.trim().length < 8) {
      setErrorMessage('Nom et telephone valides sont requis.');
      return;
    }

    setIsSaving(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      const updated = await updateCurrentProfile(user.id, {
        fullName: profileForm.fullName.trim(),
        phone: profileForm.phone.trim(),
        title: profileForm.title.trim() || undefined,
      });
      if (!updated) {
        throw new Error('Mise a jour echouee.');
      }
      await initializeAuth();
      setIsEditOpen(false);
      setSuccessMessage('Profil mis a jour avec succes.');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Erreur lors de la mise a jour du profil.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = async () => {
    const password = passwordForm.newPassword.trim();
    const confirm = passwordForm.confirmPassword.trim();

    if (password.length < 8) {
      setErrorMessage('Le mot de passe doit contenir au moins 8 caracteres.');
      return;
    }
    if (password !== confirm) {
      setErrorMessage('La confirmation du mot de passe ne correspond pas.');
      return;
    }

    setIsSavingPassword(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      const { error } = await updateCurrentUserPassword(password);
      if (error) {
        throw error;
      }
      setIsPasswordOpen(false);
      setPasswordForm({ newPassword: '', confirmPassword: '' });
      setSuccessMessage('Mot de passe modifie avec succes.');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Impossible de modifier le mot de passe.');
    } finally {
      setIsSavingPassword(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Profil" description="Informations du compte connecte." />

      {errorMessage ? <EmptyState title="Action impossible" description={errorMessage} /> : null}
      {successMessage ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {successMessage}
        </div>
      ) : null}

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <UserAvatar name={user.fullName} role={user.role} />
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">{roleLabels[user.role]}</span>
        </div>

        <dl className="mt-5 grid gap-4 text-sm md:grid-cols-2">
          <div>
            <dt className="text-slate-500">Email</dt>
            <dd className="font-medium text-slate-800">{user.email}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Telephone</dt>
            <dd className="font-medium text-slate-800">{user.phone || '-'}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Extension</dt>
            <dd className="font-medium text-slate-800">
              {user.role === 'superadmin'
                ? `${branchLabel} (residence locale, acces global)`
                : branchLabel}
            </dd>
          </div>
          <div>
            <dt className="text-slate-500">Titre</dt>
            <dd className="font-medium text-slate-800">{user.title ?? '-'}</dd>
          </div>
        </dl>

        <div className="mt-5">
          <p className="mb-2 text-sm text-slate-500">Departements associes</p>
          <div className="flex flex-wrap gap-2">
            {user.role === 'superadmin' ? (
              <span className="text-sm text-slate-700">
                Acces global: gere tous les departements. Departement(s) de residence: {userDepartments.length || 0}.
              </span>
            ) : userDepartments.length > 0 ? (
              userDepartments.map((department) => <DepartmentBadge key={department.id} name={department.name} />)
            ) : (
              <span className="text-sm text-slate-500">Aucun departement assigne.</span>
            )}
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          <AppButton onClick={openEditModal}>Modifier le profil</AppButton>
          <AppButton variant="secondary" onClick={openPasswordModal}>
            Changer le mot de passe
          </AppButton>
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="text-base font-semibold text-slate-900">Securite du compte</h3>
        <div className="mt-3 grid gap-4 text-sm md:grid-cols-3">
          <div>
            <p className="text-slate-500">Identifiant</p>
            <p className="font-medium text-slate-800">{user.id}</p>
          </div>
          <div>
            <p className="text-slate-500">Initiales</p>
            <p className="font-medium text-slate-800">{initials}</p>
          </div>
          <div>
            <p className="text-slate-500">Derniere connexion</p>
            <p className="font-medium text-slate-800">
              {authUser?.last_sign_in_at ? new Date(authUser.last_sign_in_at).toLocaleString('fr-FR') : '-'}
            </p>
          </div>
        </div>
      </section>

      <Modal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} title="Modifier le profil">
        <div className="space-y-4">
          <FormFieldWrapper label="Nom complet" required>
            <AppInput
              value={profileForm.fullName}
              onChange={(event) => setProfileForm((prev) => ({ ...prev, fullName: event.target.value }))}
            />
          </FormFieldWrapper>
          <FormFieldWrapper label="Telephone" required>
            <AppInput
              value={profileForm.phone}
              onChange={(event) => setProfileForm((prev) => ({ ...prev, phone: event.target.value }))}
            />
          </FormFieldWrapper>
          <FormFieldWrapper label="Titre / Fonction">
            <AppInput
              value={profileForm.title}
              onChange={(event) => setProfileForm((prev) => ({ ...prev, title: event.target.value }))}
            />
          </FormFieldWrapper>
          {errorMessage ? (
            <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {errorMessage}
            </div>
          ) : null}
          <div className="flex justify-end gap-2">
            <AppButton variant="secondary" onClick={() => setIsEditOpen(false)}>
              Annuler
            </AppButton>
            <AppButton isLoading={isSaving} onClick={handleSaveProfile}>
              Enregistrer
            </AppButton>
          </div>
        </div>
      </Modal>

      <Modal isOpen={isPasswordOpen} onClose={() => setIsPasswordOpen(false)} title="Changer le mot de passe">
        <div className="space-y-4">
          <FormFieldWrapper label="Nouveau mot de passe" required>
            <AppInput
              type="password"
              value={passwordForm.newPassword}
              onChange={(event) => setPasswordForm((prev) => ({ ...prev, newPassword: event.target.value }))}
            />
          </FormFieldWrapper>
          <FormFieldWrapper label="Confirmer le mot de passe" required>
            <AppInput
              type="password"
              value={passwordForm.confirmPassword}
              onChange={(event) => setPasswordForm((prev) => ({ ...prev, confirmPassword: event.target.value }))}
            />
          </FormFieldWrapper>
          <div className="rounded-lg border border-sky-200 bg-sky-50 px-3 py-2 text-xs text-sky-700">
            Utilisez au moins 8 caracteres pour renforcer la securite.
          </div>
          <div className="flex justify-end gap-2">
            <AppButton variant="secondary" onClick={() => setIsPasswordOpen(false)}>
              Annuler
            </AppButton>
            <AppButton isLoading={isSavingPassword} onClick={handleChangePassword}>
              Mettre a jour
            </AppButton>
          </div>
        </div>
      </Modal>
    </div>
  );
}

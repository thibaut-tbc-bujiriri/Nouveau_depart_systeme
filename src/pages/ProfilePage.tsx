import { Avatar, EmptyState, LoadingState } from '@/components/common';
import { AppButton, AppInput, FormFieldWrapper } from '@/components/ui';
import { Modal } from '@/components/ui/Modal';
import { useAuth } from '@/hooks/useAuth';
import { useBranches } from '@/hooks/useBranches';
import { useDepartments } from '@/hooks/useDepartments';
import { updateCurrentUserPassword } from '@/services/auth.service';
import { updateCurrentProfile } from '@/services/profile.service';
import { roleLabels } from '@/utils/permissions';
import { useMemo, useState } from 'react';
import {
  User,
  Check,
  Shield,
  Mail,
  Phone,
  Briefcase,
  Building2,
  LayoutGrid,
  Edit2,
  Lock,
  Fingerprint,
  Calendar,
  ShieldAlert,
  Activity,
  Crown,
  Globe,
  Landmark,
  Key,
  ChevronRight,
} from 'lucide-react';

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
    <div className="space-y-6 max-w-6xl mx-auto pb-10">
      {/* 1. Page Header with illustration */}
      <div className="flex items-center gap-3.5 border-b border-slate-100 pb-5">
        <div className="size-11 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center shadow-sm shrink-0">
          <User className="size-5.5" />
        </div>
        <div className="text-left">
          <h1 className="text-xl font-bold text-slate-800">Profil</h1>
          <p className="text-xs text-slate-500 font-medium">Informations du compte connecté.</p>
        </div>
      </div>

      {errorMessage ? <EmptyState title="Action impossible" description={errorMessage} /> : null}
      {successMessage ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 text-left">
          {successMessage}
        </div>
      ) : null}

      {/* 2. Main Profile Summary Card */}
      <section className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row items-center gap-6 pb-6 border-b border-slate-50">
          <div className="relative">
            <Avatar name={user.fullName} avatarUrl={user.avatarUrl} size="lg" className="size-24 text-2xl font-bold rounded-full border-4 border-slate-50 shadow-md" />
            <div className="absolute -bottom-1 -right-1 size-7 rounded-full bg-teal-500 text-white flex items-center justify-center border-4 border-white shadow-sm">
              <Check size={12} className="stroke-[3.5]" />
            </div>
          </div>

          <div className="text-center md:text-left space-y-2.5">
            <h2 className="text-xl font-bold text-slate-800">{user.fullName}</h2>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 text-teal-700 text-xs font-semibold">
              <Shield size={13} />
              {roleLabels[user.role]}
            </span>
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 text-sm text-left">
          <div className="flex gap-3">
            <div className="size-9 rounded-lg bg-slate-50 text-slate-400 flex items-center justify-center shrink-0">
              <Mail size={16} />
            </div>
            <div className="space-y-0.5">
              <p className="text-xs text-slate-400 font-semibold">Email</p>
              <p className="font-semibold text-slate-700 break-all">{user.email}</p>
            </div>
          </div>

          <div className="flex gap-3">
            <div className="size-9 rounded-lg bg-slate-50 text-slate-400 flex items-center justify-center shrink-0">
              <Phone size={16} />
            </div>
            <div className="space-y-0.5">
              <p className="text-xs text-slate-400 font-semibold">Téléphone</p>
              <p className="font-semibold text-slate-700">{user.phone || '-'}</p>
            </div>
          </div>

          <div className="flex gap-3">
            <div className="size-9 rounded-lg bg-slate-50 text-slate-400 flex items-center justify-center shrink-0">
              <Briefcase size={16} />
            </div>
            <div className="space-y-0.5">
              <p className="text-xs text-slate-400 font-semibold">Titre</p>
              <p className="font-semibold text-slate-700">{user.title || '-'}</p>
            </div>
          </div>

          <div className="flex gap-3 md:col-span-2">
            <div className="size-9 rounded-lg bg-slate-50 text-slate-400 flex items-center justify-center shrink-0">
              <Building2 size={16} />
            </div>
            <div className="space-y-0.5">
              <p className="text-xs text-slate-400 font-semibold">Départements associés</p>
              <div className="font-semibold text-slate-700">
                {user.role === 'superadmin' ? (
                  <span>
                    Accès global : gère tous les départements. Département(s) de résidence : {userDepartments.length || 0}.
                  </span>
                ) : userDepartments.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {userDepartments.map((d) => (
                      <span key={d.id} className="inline-block bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[11px] font-semibold">{d.name}</span>
                    ))}
                  </div>
                ) : (
                  <span className="text-slate-400 italic font-medium">Aucun département assigné.</span>
                )}
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <div className="size-9 rounded-lg bg-slate-50 text-slate-400 flex items-center justify-center shrink-0">
              <LayoutGrid size={16} />
            </div>
            <div className="space-y-0.5">
              <p className="text-xs text-slate-400 font-semibold">Extension</p>
              <p className="font-semibold text-slate-700">
                {user.role === 'superadmin'
                  ? `${branchLabel} (résidence locale, accès global)`
                  : branchLabel}
              </p>
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex flex-wrap gap-3 pt-4 border-t border-slate-50">
          <AppButton
            onClick={openEditModal}
            className="inline-flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl px-4 py-2.5 text-xs font-bold transition-all shadow-sm cursor-pointer"
          >
            <Edit2 size={14} />
            Modifier le profil
          </AppButton>
          <AppButton
            variant="secondary"
            onClick={openPasswordModal}
            className="inline-flex items-center gap-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl px-4 py-2.5 text-xs font-bold transition-all cursor-pointer"
          >
            <Lock size={14} />
            Changer le mot de passe
          </AppButton>
        </div>
      </section>

      {/* 3. Bottom Row Cards */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Left Card: Sécurité du compte */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm space-y-4 text-left">
          <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <Shield size={16} className="text-teal-600" />
            Sécurité du compte
          </h3>

          <div className="grid gap-3 sm:grid-cols-2">
            {/* Identifiant */}
            <div className="p-3 bg-slate-50/50 rounded-xl space-y-1">
              <div className="flex items-center gap-1.5 text-slate-400">
                <Fingerprint size={14} />
                <span className="text-[10px] font-bold uppercase tracking-wider">Identifiant</span>
              </div>
              <p className="text-[10px] font-semibold text-slate-600 break-all select-all font-mono leading-normal">
                {user.id}
              </p>
            </div>

            {/* Initiales */}
            <div className="p-3 bg-slate-50/50 rounded-xl space-y-1">
              <div className="flex items-center gap-1.5 text-slate-400">
                <User size={14} />
                <span className="text-[10px] font-bold uppercase tracking-wider">Initiales</span>
              </div>
              <p className="text-sm font-bold text-slate-800">
                {initials}
              </p>
            </div>

            {/* Dernière connexion */}
            <div className="p-3 bg-slate-50/50 rounded-xl space-y-1">
              <div className="flex items-center gap-1.5 text-slate-400">
                <Calendar size={14} />
                <span className="text-[10px] font-bold uppercase tracking-wider">Dernière connexion</span>
              </div>
              <p className="text-xs font-bold text-slate-700">
                {authUser?.last_sign_in_at
                  ? new Date(authUser.last_sign_in_at).toLocaleString('fr-FR')
                  : '-'}
              </p>
            </div>

            {/* Statut du compte */}
            <div className="p-3 bg-slate-50/50 rounded-xl space-y-1">
              <div className="flex items-center gap-1.5 text-slate-400">
                <ShieldAlert size={14} />
                <span className="text-[10px] font-bold uppercase tracking-wider">Statut du compte</span>
              </div>
              <div className="pt-0.5">
                <span className="inline-flex items-center px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 text-xs font-bold">
                  Actif
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Card: Activité du compte */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm space-y-4 text-left">
          <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <Activity size={16} className="text-teal-600" />
            Activité du compte
          </h3>

          <div className="divide-y divide-slate-100">
            <div className="flex items-center justify-between py-2.5 text-xs">
              <div className="flex items-center gap-2 text-slate-500">
                <Crown size={14} className="text-slate-400" />
                <span className="font-semibold">Rôle</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="font-bold text-slate-800">{roleLabels[user.role]}</span>
                <ChevronRight size={12} className="text-slate-300" />
              </div>
            </div>

            <div className="flex items-center justify-between py-2.5 text-xs">
              <div className="flex items-center gap-2 text-slate-500">
                <Globe size={14} className="text-slate-400" />
                <span className="font-semibold">Portée d'accès</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="font-bold text-slate-800">
                  {user.role === 'superadmin' ? 'Accès global' : 'Accès extension'}
                </span>
                <ChevronRight size={12} className="text-slate-300" />
              </div>
            </div>

            <div className="flex items-center justify-between py-2.5 text-xs">
              <div className="flex items-center gap-2 text-slate-500">
                <Landmark size={14} className="text-slate-400" />
                <span className="font-semibold">Départements accessibles</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="font-bold text-slate-800">
                  {user.role === 'superadmin' ? 'Tous les départements (Accès global)' : `${userDepartments.length} département(s)`}
                </span>
                <ChevronRight size={12} className="text-slate-300" />
              </div>
            </div>

            <div className="flex items-center justify-between py-2.5 text-xs">
              <div className="flex items-center gap-2 text-slate-500">
                <Key size={14} className="text-slate-400" />
                <span className="font-semibold">Permissions</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="font-bold text-slate-800">
                  {user.role === 'superadmin' ? 'Accès complet à toutes les fonctionnalités' : 'Accès standard'}
                </span>
                <ChevronRight size={12} className="text-slate-300" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Footer */}
      <div className="flex flex-col sm:flex-row items-center justify-between pt-6 border-t border-slate-100 text-[10px] text-slate-400 font-semibold uppercase tracking-wider gap-2">
        <span>© 2026 ECND – Centre de Supervision. Tous droits réservés.</span>
        <span>Version 2.0.0</span>
      </div>

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

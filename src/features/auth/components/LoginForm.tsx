import { AppButton, AppInput, FormFieldWrapper, useToast } from '@/components/ui';
import { useAuth } from '@/hooks/useAuth';
import { loginSchema } from '@/features/auth/schemas/loginSchema';
import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff, Fingerprint, Loader2, Mail, ShieldCheck, LockKeyhole } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import type { LoginSchema } from '@/features/auth/schemas/loginSchema';
import { loginWithPasskey } from '@/utils/passkey';

export function LoginForm() {
  const { login, clearError } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [isPasskeyLoading, setIsPasskeyLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginSchema>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (values: LoginSchema) => {
    clearError();
    const result = await login(values.email, values.password);

    if (result.error) {
      toast.error('Connexion échouée');
      return;
    }

    toast.success('Connexion réussie');
    navigate('/dashboard');
  };

  const handlePasskeyLogin = async () => {
    if (isPasskeyLoading) return;

    clearError();
    setIsPasskeyLoading(true);
    try {
      const credentials = await loginWithPasskey();
      const result = await login(credentials.email, credentials.authData);
      if (result.error) {
        toast.error('Connexion échouée');
        return;
      }
      toast.success('Connexion réussie');
      navigate('/dashboard');
    } catch {
      toast.error('Connexion échouée');
    } finally {
      setIsPasskeyLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="auth-login-form">
      <FormFieldWrapper label="Adresse email" error={errors.email?.message} required>
        <div className="auth-field-shell">
          <Mail className="auth-field-icon" />
          <AppInput type="email" placeholder="nom@ecnd.org" className="pl-16" {...register('email')} />
        </div>
      </FormFieldWrapper>

      <FormFieldWrapper label="Mot de passe" error={errors.password?.message} required>
        <div className="auth-field-shell">
          <LockKeyhole className="auth-field-icon" />
          <AppInput
            type={showPassword ? 'text' : 'password'}
            placeholder="Mot de passe"
            className="pl-16 pr-14"
            {...register('password')}
          />
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            className="auth-password-toggle"
            aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
          >
            {showPassword ? <EyeOff className="size-6" /> : <Eye className="size-6" />}
          </button>
        </div>
      </FormFieldWrapper>

      <div className="auth-row">
        <label className="auth-remember">
          <input
            type="checkbox"
            checked={rememberMe}
            onChange={(event) => setRememberMe(event.target.checked)}
          />
          <span>Se souvenir de moi</span>
        </label>
        <Link to="/forgot-password" className="auth-forgot-link">
          Mot de passe oublié ?
        </Link>
      </div>

      <AppButton type="submit" className="auth-submit" isLoading={isSubmitting}>
        Se connecter
      </AppButton>

      <div className="auth-separator">
        <span />
        <strong>ou</strong>
        <span />
      </div>

      <AppButton
        type="button"
        onClick={handlePasskeyLogin}
        disabled={isPasskeyLoading || isSubmitting}
        variant="secondary"
        className="auth-passkey"
      >
        {isPasskeyLoading ? <Loader2 className="size-5 animate-spin" /> : <Fingerprint className="size-5" />}
        {isPasskeyLoading ? 'Connexion...' : 'Continuer avec Passkey'}
      </AppButton>

      <div className="auth-secure-note">
        <ShieldCheck className="size-6" />
        <span>Connexion sécurisée par passkey</span>
      </div>
    </form>
  );
}

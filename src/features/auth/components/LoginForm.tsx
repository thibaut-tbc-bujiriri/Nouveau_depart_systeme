import { AppButton, AppInput, FormFieldWrapper } from '@/components/ui';
import { useAuth } from '@/hooks/useAuth';
import { loginSchema } from '@/features/auth/schemas/loginSchema';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle, Eye, EyeOff, Lock, Mail, Fingerprint, ShieldCheck, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import type { LoginSchema } from '@/features/auth/schemas/loginSchema';
import { loginWithPasskey } from '@/utils/passkey';

export function LoginForm() {
  const { login, clearError, error: authError } = useAuth();
  const navigate = useNavigate();
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [passkeyError, setPasskeyError] = useState<string | null>(null);
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
    setPasskeyError(null);
    const result = await login(values.email, values.password);

    if (!result.error) {
      navigate('/dashboard');
    }
  };

  const handlePasskeyLogin = async () => {
    if (isPasskeyLoading) return;

    clearError();
    setPasskeyError(null);
    setIsPasskeyLoading(true);
    try {
      const credentials = await loginWithPasskey();
      const result = await login(credentials.email, credentials.authData);
      if (!result.error) {
        navigate('/dashboard');
      }
    } catch (err: any) {
      setPasskeyError(err.message || "La connexion par Passkey a échoué.");
    } finally {
      setIsPasskeyLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <FormFieldWrapper label="Adresse email" error={errors.email?.message} required>
        <div className="relative">
          <Mail className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <AppInput
            type="email"
            placeholder="nom@ecnd.org"
            className="h-12 rounded-xl border-slate-200 bg-white pl-10 focus:border-teal-500 text-sm"
            {...register('email')}
          />
        </div>
      </FormFieldWrapper>

      <FormFieldWrapper label="Mot de passe" error={errors.password?.message} required>
        <div className="relative">
          <Lock className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <AppInput
            type={showPassword ? 'text' : 'password'}
            placeholder="••••••••"
            className="h-12 rounded-xl border-slate-200 bg-white pl-10 pr-10 focus:border-teal-500 text-sm"
            {...register('password')}
          />
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
          >
            {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </div>
      </FormFieldWrapper>

      {(authError || passkeyError) ? (
        <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-sm text-rose-700">
          <AlertCircle className="size-4 shrink-0" />
          <span>{authError || passkeyError}</span>
        </div>
      ) : null}

      <div className="flex items-center justify-between text-sm">
        <label className="inline-flex items-center gap-2 text-slate-600 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={rememberMe}
            onChange={(event) => setRememberMe(event.target.checked)}
            className="size-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500 accent-teal-600"
          />
          Se souvenir de moi
        </label>
        <Link to="/forgot-password" className="font-semibold text-teal-600 hover:text-teal-700 transition-colors">
          Mot de passe oublié ?
        </Link>
      </div>

      <AppButton
        type="submit"
        className="h-12 w-full rounded-xl bg-[#0f172a] text-sm hover:bg-[#1e293b] text-white font-bold flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-sm"
        isLoading={isSubmitting}
      >
        <Lock className="size-4" />
        Se connecter
      </AppButton>

      <div className="flex items-center gap-3 py-1 text-xs text-slate-400 font-medium">
        <span className="h-px flex-1 bg-slate-100" />
        ou
        <span className="h-px flex-1 bg-slate-100" />
      </div>

      <button
        type="button"
        onClick={handlePasskeyLogin}
        disabled={isPasskeyLoading || isSubmitting}
        className="h-12 w-full rounded-xl border border-teal-600 bg-white hover:bg-teal-50/30 text-teal-600 font-bold text-sm flex items-center justify-center gap-2 cursor-pointer transition-colors disabled:cursor-not-allowed disabled:opacity-70"
      >
        {isPasskeyLoading ? <Loader2 className="size-5 animate-spin" /> : <Fingerprint className="size-5" />}
        {isPasskeyLoading ? 'Connexion...' : 'Continuer avec Passkey'}
      </button>

      <div className="flex items-center justify-center gap-1.5 text-xs text-slate-400 mt-2.5 font-medium">
        <ShieldCheck className="size-4 text-teal-500/80" />
        <span>Connexion sécurisée par passkey</span>
      </div>
    </form>
  );
}


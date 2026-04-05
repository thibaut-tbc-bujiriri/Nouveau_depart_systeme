import { AppButton, AppInput, FormFieldWrapper } from '@/components/ui';
import { useAuth } from '@/hooks/useAuth';
import { loginSchema } from '@/features/auth/schemas/loginSchema';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle, Eye, Lock, Mail } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import type { LoginSchema } from '@/features/auth/schemas/loginSchema';

export function LoginForm() {
  const { login, clearError, error: authError } = useAuth();
  const navigate = useNavigate();
  const [rememberMe, setRememberMe] = useState(true);

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

    if (!result.error) {
      navigate('/dashboard');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <FormFieldWrapper label="Adresse email" error={errors.email?.message} required>
        <div className="relative">
          <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <AppInput
            type="email"
            placeholder="nom@ecnd.org"
            className="h-11 rounded-xl border-slate-300 bg-slate-50/50 pl-10 focus:bg-white"
            {...register('email')}
          />
        </div>
      </FormFieldWrapper>

      <FormFieldWrapper label="Mot de passe" error={errors.password?.message} required>
        <div className="relative">
          <Lock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <AppInput
            type="password"
            placeholder="********"
            className="h-11 rounded-xl border-slate-300 bg-slate-50/50 pl-10 pr-10 focus:bg-white"
            {...register('password')}
          />
          <Eye className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
        </div>
      </FormFieldWrapper>

      {authError ? (
        <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          <AlertCircle className="size-4" />
          {authError}
        </div>
      ) : null}

      <div className="flex items-center justify-between text-sm">
        <label className="inline-flex items-center gap-2 text-slate-600">
          <input
            type="checkbox"
            checked={rememberMe}
            onChange={(event) => setRememberMe(event.target.checked)}
            className="size-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
          />
          Se souvenir de moi
        </label>
        <Link to="/forgot-password" className="font-medium text-emerald-700 hover:text-emerald-600">
          Mot de passe oublie ?
        </Link>
      </div>

      <AppButton
        type="submit"
        className="h-11 w-full rounded-xl bg-emerald-600 text-base hover:bg-emerald-500"
        isLoading={isSubmitting}
      >
        Se connecter
      </AppButton>

      <div className="flex items-center gap-3 py-1 text-sm text-slate-400">
        <span className="h-px flex-1 bg-slate-200" />
        ou
        <span className="h-px flex-1 bg-slate-200" />
      </div>

      <AppButton type="button" variant="secondary" className="h-11 w-full rounded-xl border border-slate-200 bg-white text-slate-700">
        Continuer avec Google
      </AppButton>
    </form>
  );
}


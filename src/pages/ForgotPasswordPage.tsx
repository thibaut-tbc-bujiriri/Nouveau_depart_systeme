import { AppButton, AppInput, FormFieldWrapper } from '@/components/ui';
import { CircleHelp, Lock, Mail, MailCheck } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';

export function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);

  return (
    <div className="space-y-5">
      <div className="mx-auto grid size-14 place-items-center rounded-full bg-emerald-100 text-emerald-700 md:hidden">
        <Lock className="size-6" />
      </div>

      {sent ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 rounded-full bg-emerald-100 p-2 text-emerald-700">
              <MailCheck className="size-4" />
            </div>
            <div>
              <p className="text-sm font-semibold text-emerald-800">Lien envoye</p>
              <p className="mt-1 text-sm text-emerald-700">Un lien de reinitialisation a ete envoye (simulation frontend).</p>
            </div>
          </div>
        </div>
      ) : (
        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            setSent(true);
          }}
        >
          <FormFieldWrapper label="Adresse email" required>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
              <AppInput
                type="email"
                placeholder="nom@ecnd.org"
                required
                className="h-11 rounded-xl border-slate-300 bg-slate-50/50 pl-10 focus:bg-white"
              />
            </div>
          </FormFieldWrapper>
          <AppButton type="submit" className="h-11 w-full rounded-xl bg-emerald-600 hover:bg-emerald-500">
            Envoyer le lien
          </AppButton>
        </form>
      )}

      <div className="rounded-xl border border-emerald-100 bg-emerald-50/70 p-4 md:hidden">
        <div className="flex items-start gap-3">
          <CircleHelp className="mt-0.5 size-4 text-emerald-700" />
          <div>
            <p className="text-sm font-semibold text-emerald-800">Besoin d'aide ?</p>
            <p className="mt-1 text-sm text-emerald-700">Contactez le responsable de votre eglise locale.</p>
          </div>
        </div>
      </div>

      <Link to="/login" className="block text-center text-sm font-medium text-emerald-700 hover:text-emerald-600">
        Retour a la connexion
      </Link>
    </div>
  );
}


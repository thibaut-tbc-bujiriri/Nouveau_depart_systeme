import { AppButton, AppInput, FormFieldWrapper } from '@/components/ui';
import { resetPasswordForEmail } from '@/services/auth.service';
import { AlertCircle, CircleHelp, Mail, MailCheck } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';

export function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);

  return (
    <div className="space-y-4">
      {sent ? (
        <div className="rounded-[var(--radius-md)] border border-[var(--primary)] bg-white p-3 text-[var(--on-surface)]">
          <div className="flex items-start gap-3">
            <MailCheck className="mt-0.5 size-4 shrink-0 text-[var(--primary)]" />
            <div>
              <p className="font-medium text-[var(--on-surface)]">Lien envoyé</p>
              <p className="mt-1 text-[var(--on-surface-variant)]">Un lien de réinitialisation a été envoyé à votre email.</p>
            </div>
          </div>
        </div>
      ) : (
        <form
          className="space-y-4"
          onSubmit={async (event) => {
            event.preventDefault();
            setError(null);
            setIsSending(true);

            const { error: resetError } = await resetPasswordForEmail(email);
            if (resetError) {
              setError(resetError.message);
              setIsSending(false);
              return;
            }

            setSent(true);
            setIsSending(false);
          }}
        >
          <FormFieldWrapper label="Adresse email" required>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[var(--on-surface-variant)]" />
              <AppInput
                type="email"
                placeholder="nom@ecnd.org"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="pl-10"
              />
            </div>
          </FormFieldWrapper>

          {error ? (
            <p className="flex items-center gap-2 text-[var(--error)]">
              <AlertCircle className="size-4" />
              {error}
            </p>
          ) : null}

          <AppButton type="submit" isLoading={isSending} className="w-full">
            Envoyer le lien
          </AppButton>
        </form>
      )}

      <div className="rounded-[var(--radius-md)] border border-[var(--outline)] bg-[var(--surface-container-low)] p-3">
        <div className="flex items-start gap-3">
          <CircleHelp className="mt-0.5 size-4 text-[var(--primary)]" />
          <div>
            <p className="font-medium text-[var(--on-surface)]">Besoin d'aide ?</p>
            <p className="mt-1 text-[var(--on-surface-variant)]">Contactez le responsable de votre église locale.</p>
          </div>
        </div>
      </div>

      <Link to="/login" className="block text-center text-[var(--text-base)] font-medium text-[var(--primary)] hover:text-[var(--primary-container)]">
        Retour à la connexion
      </Link>
    </div>
  );
}

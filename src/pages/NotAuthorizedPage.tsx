import { AppButton } from '@/components/ui';
import { Link } from 'react-router-dom';

export function NotAuthorizedPage() {
  return (
    <div className="grid min-h-[60vh] place-items-center">
      <div className="max-w-md text-center">
        <h1 className="text-3xl font-semibold text-slate-900">Acces non autorise</h1>
        <p className="mt-2 text-sm text-slate-600">
          Votre role ne permet pas d'acceder a cette page. Contactez un super administrateur si necessaire.
        </p>
        <div className="mt-5">
          <Link to="/dashboard">
            <AppButton>Retour au dashboard</AppButton>
          </Link>
        </div>
      </div>
    </div>
  );
}


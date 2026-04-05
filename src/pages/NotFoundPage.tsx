import { AppButton } from '@/components/ui';
import { Link } from 'react-router-dom';

export function NotFoundPage() {
  return (
    <div className="grid min-h-[70vh] place-items-center px-4">
      <div className="max-w-md text-center">
        <p className="text-sm font-medium text-slate-500">Erreur 404</p>
        <h1 className="mt-2 text-3xl font-semibold text-slate-900">Page introuvable</h1>
        <p className="mt-2 text-sm text-slate-600">La page demandee n'existe pas ou a ete deplacee.</p>
        <div className="mt-5 flex justify-center gap-2">
          <Link to="/dashboard">
            <AppButton>Retour au dashboard</AppButton>
          </Link>
          <Link to="/login">
            <AppButton variant="secondary">Connexion</AppButton>
          </Link>
        </div>
      </div>
    </div>
  );
}


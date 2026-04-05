import authVisual from '@/assets/Ecnd.png';
import ecndLogo from '@/assets/ecdn_logo.png';
import { Link, Outlet, useLocation } from 'react-router-dom';

export function AuthLayout() {
  const { pathname } = useLocation();
  const isForgotPassword = pathname === '/forgot-password';

  const content = isForgotPassword
    ? {
        title: 'Mot de passe oublie',
        subtitle: 'Reinitialisez rapidement votre acces a la plateforme ECND.',
      }
    : {
        title: 'Bienvenue',
        subtitle: 'Connectez-vous a votre compte pour acceder a la plateforme.',
      };

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-slate-100 to-cyan-100 px-4 py-8 sm:px-6 lg:grid lg:place-items-center">
      <div className="mx-auto grid w-full max-w-6xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl lg:grid-cols-2">
        <section className="p-6 sm:p-8 lg:p-10">
          <div className="mb-8">
            <Link to="/" className="inline-flex w-full flex-col items-center gap-3 sm:w-auto sm:flex-row sm:items-center">
              <img src={ecndLogo} alt="Logo ECND" className="size-12 rounded-full border border-cyan-200 object-cover" />
              <p className="text-center text-sm font-semibold leading-tight text-slate-800 sm:text-left">
                Eglise Chretienne pour
                <br />
                le Nouveau Depart
              </p>
            </Link>
          </div>

          <div className="mb-6 space-y-1 text-center sm:text-left">
            <h1 className="text-3xl font-semibold text-slate-900 sm:text-4xl">{content.title}</h1>
            <p className="text-lg font-medium text-emerald-700">Eglise Chretienne pour le Nouveau Depart</p>
            <p className="text-sm text-slate-500">{content.subtitle}</p>
          </div>

          <div className="mx-auto max-w-md sm:mx-0">
            <Outlet />
          </div>

          <p className="mt-8 text-center text-xs text-slate-400 sm:text-left">(c) 2026 ECND - Tous droits reserves.</p>
        </section>

        <aside className="relative hidden min-h-[640px] lg:block">
          <img src={authVisual} alt="Eglise ECND" className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/70 via-slate-900/20 to-transparent" />
          <div className="absolute bottom-8 left-8 right-8">
            <p className="text-3xl font-light italic text-white">
              "Batir l'avenir ensemble
              <br />
              pour la gloire de Dieu."
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}


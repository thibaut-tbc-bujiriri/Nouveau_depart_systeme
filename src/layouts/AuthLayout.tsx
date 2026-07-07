import authVisual from '@/assets/Ecnd.png';
import ecndLogo from '@/assets/ecdn_logo.png';
import { Sprout } from 'lucide-react';
import { Link, Outlet, useLocation } from 'react-router-dom';

export function AuthLayout() {
  const { pathname } = useLocation();
  const isForgotPassword = pathname === '/forgot-password';

  const content = isForgotPassword
    ? {
        title: 'Mot de passe oublié',
        subtitle: 'Réinitialisez rapidement votre accès à la plateforme ECND.',
      }
    : {
        title: 'Bienvenue',
        subtitle: 'Connectez-vous à votre compte pour accéder à la plateforme.',
      };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 sm:p-6 lg:p-8 font-sans">
      <div className="w-full max-w-6xl bg-white rounded-[2rem] shadow-xl border border-slate-100 overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[660px]">
        {/* Left Column - Form Area */}
        <section className="lg:col-span-6 p-8 sm:p-10 lg:p-12 flex flex-col justify-between">
          <div>
            {/* Branding Header */}
            <div className="mb-10">
              <Link to="/" className="inline-flex items-center gap-3.5 group">
                <img
                  src={ecndLogo}
                  alt="Logo ECND"
                  className="size-12 rounded-full border border-slate-100 object-cover shadow-sm transition-transform group-hover:scale-105"
                />
                <div className="flex flex-col">
                  <span className="text-xs font-black tracking-tight text-slate-800 uppercase leading-none">Eglise Chretienne pour</span>
                  <span className="text-xs font-black tracking-tight text-slate-800 uppercase leading-none mt-1">le Nouveau Depart</span>
                </div>
              </Link>
            </div>

            {/* Welcome Text */}
            <div className="mb-6">
              <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
                {content.title}
              </h1>
              <h2 className="text-sm font-bold text-teal-600 mt-2 uppercase tracking-wider">
                Eglise Chretienne pour le Nouveau Depart
              </h2>
              <p className="text-sm text-slate-500 mt-1.5 font-medium leading-relaxed">
                {content.subtitle}
              </p>
            </div>

            {/* Render child form component */}
            <div className="max-w-md">
              <Outlet />
            </div>
          </div>

          {/* Footer Rights */}
          <p className="mt-8 text-xs text-slate-400 font-medium">
            &copy; 2026 ECND &bull; Tous droits réservés.
          </p>
        </section>

        {/* Right Column - Visual Panel */}
        <div className="hidden lg:block lg:col-span-6 p-4">
          <aside className="relative h-full min-h-[580px] w-full rounded-[1.8rem] overflow-hidden shadow-inner flex flex-col justify-end p-10 select-none">
            {/* Church Building Image */}
            <img
              src={authVisual}
              alt="Eglise ECND"
              className="absolute inset-0 h-full w-full object-cover"
            />
            {/* Dark gradient overlay for text readability */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/40 to-transparent" />

            {/* Content over visual */}
            <div className="relative z-10 text-center">
              {/* Quote double characters styled exactly like the mockup */}
              <div className="text-teal-400 font-serif text-6xl leading-none text-left mb-2 select-none opacity-80 h-8">“</div>
              
              <h2 className="text-3xl font-light italic text-white tracking-wide">
                Bâtir l'avenir ensemble
              </h2>
              <p className="text-sm text-slate-200 mt-4 max-w-md mx-auto leading-relaxed">
                Nous travaillons chaque jour pour un ministère performant, transparent et au service de l'Évangile.
              </p>

              {/* Decorative line separator with plant/sprout icon */}
              <div className="flex items-center justify-center gap-4 mt-8">
                <span className="h-px w-20 bg-slate-400/25" />
                <Sprout className="size-4 text-teal-400 animate-pulse" />
                <span className="h-px w-20 bg-slate-400/25" />
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}


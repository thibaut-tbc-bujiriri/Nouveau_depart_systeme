import ecndLogo from '@/assets/ecdn_logo.png';
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
        title: 'Connexion',
        subtitle: 'Connectez-vous à votre compte pour accéder à la plateforme.',
      };

  return (
    <main className="auth-shell font-[var(--font-body)]">
      <section className="auth-card" aria-labelledby="auth-title">
        <Link to="/" className="auth-logo-link" aria-label="Accueil ECND">
          <img src={ecndLogo} alt="Logo ECND" className="auth-logo" />
        </Link>

        <header className="auth-heading">
          <h1 id="auth-title">{content.title}</h1>
          <p>{content.subtitle}</p>
        </header>

        <Outlet />
      </section>

      <footer className="auth-brand-footer" aria-label="Nom de l'application">
        <span>Eglise Chrétienne pour le Nouveau Départ</span>
        <span aria-hidden="true" />
      </footer>
    </main>
  );
}

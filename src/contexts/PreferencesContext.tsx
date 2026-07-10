import React, { createContext, useContext, useState, useEffect } from 'react';

type Language = 'fr' | 'en';
type Currency = 'USD' | 'CDF';

interface PreferencesContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  currency: Currency;
  setCurrency: (curr: Currency) => void;
  exchangeRate: number;
  setExchangeRate: (rate: number) => void;
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
  t: (key: string) => string;
  formatMoney: (amountInUsd: number) => string;
}

const PreferencesContext = createContext<PreferencesContextType | undefined>(undefined);

// Dictionary of system translations
const translations: Record<Language, Record<string, string>> = {
  fr: {
    // Sidebar
    'sidebar.dashboard': 'Tableau de bord',
    'sidebar.administration': 'Administration',
    'sidebar.branches': 'Extensions',
    'sidebar.users': 'Utilisateurs',
    'sidebar.card-scanner': 'Scanner cartes',
    'sidebar.members': 'Membres',
    'sidebar.departments': 'Départements',
    'sidebar.activities': 'Activités',
    'sidebar.finances': 'Finances',
    'sidebar.reports': 'Rapports',
    'sidebar.settings': 'Paramètres',
    'sidebar.profile': 'Profil',
    'sidebar.logout': 'Déconnexion',
    'sidebar.management': 'Gestion & Système',
    'sidebar.services': 'Cultes / Services',
    'sidebar.events': 'Événements',
    'sidebar.need_help': "Besoin d'aide ?",
    'sidebar.contact_support': 'Contactez le support',

    // Dashboard
    'dashboard.welcome': 'Bonjour',
    'dashboard.overview': "Voici un aperçu de l'activité de l'église Nouveau Départ.",
    'dashboard.recent_activities': 'Activités récentes',
    'dashboard.view_all': 'Voir tout',
    'dashboard.extensions_preview': 'Aperçu des extensions',
    'dashboard.last_30_days': '30 derniers jours',

    // General Words
    'general.save': 'Enregistrer',
    'general.cancel': 'Annuler',
    'general.edit': 'Modifier',
    'general.delete': 'Supprimer',
    'general.status': 'Statut',
    'general.active': 'Actif',
    'general.inactive': 'Inactif',
    'general.search': 'Rechercher...',
    'general.email': 'Email',
    'general.phone': 'Téléphone',
    'general.title': 'Titre',
    'general.extension': 'Extension',
    'general.departments': 'Départements associés',
    'general.role': 'Rôle',
    'general.loading': 'Chargement...',
    'general.add': 'Ajouter',
    'general.no_data': 'Aucune donnée disponible',
    'general.success': 'Succès',
    'general.error': 'Erreur',
    'general.confirm': 'Confirmer',

    // Topbar
    'topbar.supervision': 'Centre de supervision',
    'topbar.online': 'En ligne',
    'topbar.notifications': 'Notifications',
    'topbar.mark_all_read': 'Tout marquer comme lu',
    'topbar.view_all_notifications': 'Voir toutes les notifications',
    'topbar.my_profile': 'Mon profil',
    'topbar.account_settings': 'Paramètres du compte',
    'topbar.preferences': 'Préférences',
    'topbar.activity_log': 'Journal d’activités',
    'topbar.help_center': 'Centre d’aide',
    'topbar.about': 'À propos du système',

    // Profile Page
    'profile.title': 'Profil',
    'profile.subtitle': 'Informations du compte connecté.',
    'profile.security': 'Sécurité du compte',
    'profile.activity': 'Activité du compte',
    'profile.identifiant': 'Identifiant',
    'profile.initials': 'Initiales',
    'profile.last_login': 'Dernière connexion',
    'profile.account_status': 'Statut du compte',
    'profile.access_scope': 'Portée d\'accès',
    'profile.accessible_depts': 'Départements accessibles',
    'profile.permissions': 'Permissions',
    'profile.change_password': 'Changer le mot de passe',
    'profile.edit_profile': 'Modifier le profil',
    'profile.global_access': 'Accès global',
    'profile.all_departments': 'Tous les départements (Accès global)',
    'profile.full_access': 'Accès complet à toutes les fonctionnalités',

    // Departments Page
    'departments.title': 'Départements',
    'departments.subtitle': 'Pilotage des équipes de service et de leurs budgets.',
    'departments.assign': 'Assigner département',
    'departments.create': 'Créer un département',
    'departments.search': 'Rechercher un département...',
    'departments.monthly_budget': 'Budget mensuel',
    'departments.members_count': 'Membres',
    'departments.manager': 'Responsable',
    'departments.actions': 'Détails',
    'departments.open': 'Ouvrir',
  },
  en: {
    // Sidebar
    'sidebar.dashboard': 'Dashboard',
    'sidebar.administration': 'Administration',
    'sidebar.branches': 'Branches',
    'sidebar.users': 'Users',
    'sidebar.card-scanner': 'Card Scanner',
    'sidebar.members': 'Members',
    'sidebar.departments': 'Departments',
    'sidebar.activities': 'Activities',
    'sidebar.finances': 'Finances',
    'sidebar.reports': 'Reports',
    'sidebar.settings': 'Settings',
    'sidebar.profile': 'Profile',
    'sidebar.logout': 'Logout',
    'sidebar.management': 'Management & System',
    'sidebar.services': 'Services',
    'sidebar.events': 'Events',
    'sidebar.need_help': 'Need help?',
    'sidebar.contact_support': 'Contact support',

    // Dashboard
    'dashboard.welcome': 'Hello',
    'dashboard.overview': 'Here is an overview of the activity of Nouveau Départ Church.',
    'dashboard.recent_activities': 'Recent Activities',
    'dashboard.view_all': 'View All',
    'dashboard.extensions_preview': 'Extensions Preview',
    'dashboard.last_30_days': 'Last 30 days',

    // General Words
    'general.save': 'Save',
    'general.cancel': 'Cancel',
    'general.edit': 'Edit',
    'general.delete': 'Delete',
    'general.status': 'Status',
    'general.active': 'Active',
    'general.inactive': 'Inactive',
    'general.search': 'Search...',
    'general.email': 'Email',
    'general.phone': 'Phone',
    'general.title': 'Title / Role',
    'general.extension': 'Branch / Extension',
    'general.departments': 'Associated Departments',
    'general.role': 'Role',
    'general.loading': 'Loading...',
    'general.add': 'Add',
    'general.no_data': 'No data available',
    'general.success': 'Success',
    'general.error': 'Error',
    'general.confirm': 'Confirm',

    // Topbar
    'topbar.supervision': 'Supervision Center',
    'topbar.online': 'Online',
    'topbar.notifications': 'Notifications',
    'topbar.mark_all_read': 'Mark all as read',
    'topbar.view_all_notifications': 'View all notifications',
    'topbar.my_profile': 'My Profile',
    'topbar.account_settings': 'Account Settings',
    'topbar.preferences': 'Preferences',
    'topbar.activity_log': 'Activity Log',
    'topbar.help_center': 'Help Center',
    'topbar.about': 'About System',

    // Profile Page
    'profile.title': 'Profile',
    'profile.subtitle': 'Connected account details.',
    'profile.security': 'Account Security',
    'profile.activity': 'Account Activity',
    'profile.identifiant': 'Identifier',
    'profile.initials': 'Initials',
    'profile.last_login': 'Last Sign In',
    'profile.account_status': 'Account Status',
    'profile.access_scope': 'Access Scope',
    'profile.accessible_depts': 'Accessible Departments',
    'profile.permissions': 'Permissions',
    'profile.change_password': 'Change Password',
    'profile.edit_profile': 'Edit Profile',
    'profile.global_access': 'Global Access',
    'profile.all_departments': 'All departments (Global Access)',
    'profile.full_access': 'Full access to all features',

    // Departments Page
    'departments.title': 'Departments',
    'departments.subtitle': 'Management of service teams and their budgets.',
    'departments.assign': 'Assign Department',
    'departments.create': 'Create Department',
    'departments.search': 'Search a department...',
    'departments.monthly_budget': 'Monthly Budget',
    'departments.members_count': 'Members',
    'departments.manager': 'Manager',
    'departments.actions': 'Details',
    'departments.open': 'Open',
  },
};

export const PreferencesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    return (localStorage.getItem('ecnd.pref_language') as Language) || 'fr';
  });

  const [currency, setCurrencyState] = useState<Currency>(() => {
    return (localStorage.getItem('ecnd.pref_currency') as Currency) || 'USD';
  });

  const [exchangeRate, setExchangeRateState] = useState<number>(() => {
    const rate = localStorage.getItem('ecnd.pref_exchange_rate');
    return rate ? Number(rate) : 2500;
  });

  const [theme, setThemeState] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('ecnd.pref_theme') as 'light' | 'dark') || 'light';
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('ecnd.pref_language', lang);
    window.dispatchEvent(new Event('storage'));
  };

  const setCurrency = (curr: Currency) => {
    setCurrencyState(curr);
    localStorage.setItem('ecnd.pref_currency', curr);
    window.dispatchEvent(new Event('storage'));
  };

  const setExchangeRate = (rate: number) => {
    setExchangeRateState(rate);
    localStorage.setItem('ecnd.pref_exchange_rate', String(rate));
    window.dispatchEvent(new Event('storage'));
  };

  const setTheme = (nextTheme: 'light' | 'dark') => {
    setThemeState(nextTheme);
    localStorage.setItem('ecnd.pref_theme', nextTheme);
    window.dispatchEvent(new Event('storage'));
  };

  // Sync document element class for dark mode
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  useEffect(() => {
    const handleStorageChange = () => {
      const lang = (localStorage.getItem('ecnd.pref_language') as Language) || 'fr';
      const curr = (localStorage.getItem('ecnd.pref_currency') as Currency) || 'USD';
      const rate = localStorage.getItem('ecnd.pref_exchange_rate');
      const storedTheme = (localStorage.getItem('ecnd.pref_theme') as 'light' | 'dark') || 'light';
      
      setLanguageState(lang);
      setCurrencyState(curr);
      setThemeState(storedTheme);
      if (rate) setExchangeRateState(Number(rate));
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const t = (key: string): string => {
    return translations[language][key] || key;
  };

  const formatMoney = (amountInUsd: number): string => {
    if (currency === 'USD') {
      return `${amountInUsd.toLocaleString('fr-FR')} USD`;
    } else {
      const cdfAmount = Math.round(amountInUsd * exchangeRate);
      return `${cdfAmount.toLocaleString('fr-FR')} CDF`;
    }
  };

  return (
    <PreferencesContext.Provider
      value={{
        language,
        setLanguage,
        currency,
        setCurrency,
        exchangeRate,
        setExchangeRate,
        theme,
        setTheme,
        t,
        formatMoney,
      }}
    >
      {children}
    </PreferencesContext.Provider>
  );
};

export const usePreferences = () => {
  const context = useContext(PreferencesContext);
  if (context === undefined) {
    throw new Error('usePreferences must be used within a PreferencesProvider');
  }
  return context;
};

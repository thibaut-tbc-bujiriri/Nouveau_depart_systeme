import { Avatar } from '@/components/common';
import { AppButton } from '@/components/ui';
import { Modal } from '@/components/ui/Modal';
import { useAuth } from '@/hooks/useAuth';
import { roleLabels } from '@/lib/permissions';
import { cn } from '@/lib/cn';
import { usePreferences } from '@/contexts/PreferencesContext';
import {
  Bell,
  ChevronDown,
  LogOut,
  Menu,
  Search,
  User,
  Settings,
  Sliders,
  Activity,
  CircleHelp,
  Info,
  UserCheck,
  Calendar,
  FileText,
  ShieldAlert,
  Landmark,
  RefreshCw,
  MessageSquare,
  Globe,
  BellRing,
  Moon,
  Volume2,
  Coins,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';

interface TopbarProps {
  onToggleMobileSidebar: () => void;
}

export function Topbar({ onToggleMobileSidebar }: TopbarProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  // Preferences hook
  const { language, setLanguage, currency, setCurrency, t } = usePreferences();
  const [tempLanguage, setTempLanguage] = useState<'fr' | 'en'>(language);
  const [tempCurrency, setTempCurrency] = useState<'USD' | 'CDF'>(currency);

  // Dropdown states
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  
  // Modal states
  const [isPreferencesOpen, setIsPreferencesOpen] = useState(false);
  const [isActivityLogOpen, setIsActivityLogOpen] = useState(false);
  const [isHelpCenterOpen, setIsHelpCenterOpen] = useState(false);
  const [isAboutSystemOpen, setIsAboutSystemOpen] = useState(false);

  // Sync temp states when the modal is opened
  useEffect(() => {
    if (isPreferencesOpen) {
      setTempLanguage(language);
      setTempCurrency(currency);
    }
  }, [isPreferencesOpen, language, currency]);

  const handleSavePreferences = () => {
    setLanguage(tempLanguage);
    setCurrency(tempCurrency);
    setIsPreferencesOpen(false);
  };

  const dropdownRef = useRef<HTMLDivElement>(null);
  const notificationRef = useRef<HTMLDivElement>(null);

  // Mock notifications list matching the design specs
  const [notifications, setNotifications] = useState([
    {
      id: '1',
      title: 'Nouveau membre enregistré',
      description: 'Jean Kalume a été ajouté comme membre',
      time: 'Il y a 5 min',
      unread: true,
      icon: <UserCheck className="size-4 text-emerald-500" />,
    },
    {
      id: '2',
      title: 'Nouvel événement créé',
      description: '"Culte dominical" programmé le 25 Mai 2026',
      time: 'Il y a 15 min',
      unread: true,
      icon: <Calendar className="size-4 text-sky-500" />,
    },
    {
      id: '3',
      title: "Demande d'approbation",
      description: 'Demande de budget "Évangélisation" à approuver',
      time: 'Il y a 30 min',
      unread: true,
      icon: <FileText className="size-4 text-amber-500" />,
    },
    {
      id: '4',
      title: 'Changement de rôle / permission',
      description: 'Grâce Mbayo est maintenant Responsable Média',
      time: 'Il y a 1 h',
      unread: false,
      icon: <ShieldAlert className="size-4 text-purple-500" />,
    },
    {
      id: '5',
      title: 'Rappel événement',
      description: 'Réunion de prière dans 30 minutes',
      time: 'Il y a 2 h',
      unread: false,
      icon: <Bell className="size-4 text-rose-500" />,
    },
    {
      id: '6',
      title: 'Transaction financière',
      description: 'Dépense de 150$ enregistrée par Thibaut B.',
      time: 'Il y a 3 h',
      unread: false,
      icon: <Landmark className="size-4 text-teal-500" />,
    },
    {
      id: '7',
      title: 'Mise à jour système',
      description: 'Une nouvelle mise à jour est disponible',
      time: 'Hier, 18:30',
      unread: false,
      icon: <RefreshCw className="size-4 text-indigo-500" />,
    },
    {
      id: '8',
      title: 'Autre notification',
      description: 'Sauvegarde automatique effectuée avec succès',
      time: 'Hier, 12:10',
      unread: false,
      icon: <MessageSquare className="size-4 text-slate-500" />,
    },
  ]);

  const unreadCount = notifications.filter((n) => n.unread).length;

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
  };

  const toggleRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, unread: false } : n))
    );
  };

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
      if (notificationRef.current && !notificationRef.current.contains(e.target as Node)) {
        setIsNotificationOpen(false);
      }
    };
    document.addEventListener('click', handleOutsideClick);
    return () => document.removeEventListener('click', handleOutsideClick);
  }, []);

  if (!user) {
    return null;
  }

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <header className="shrink-0 border-b border-slate-100 bg-white px-6 py-3.5 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        {/* Left Search Bar */}
        <div className="flex items-center gap-3 flex-1 lg:max-w-xs">
          <button
            onClick={onToggleMobileSidebar}
            className="grid size-10 place-items-center rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 lg:hidden"
            aria-label="Ouvrir le menu"
          >
            <Menu className="size-5" />
          </button>

          <div className="hidden lg:block w-full">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Rechercher..."
                className="h-10 w-full rounded-xl bg-slate-50 pl-9 pr-12 text-sm text-slate-700 placeholder-slate-400 border border-transparent focus:bg-white focus:border-slate-200 outline-none transition-all"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 rounded border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] font-medium text-slate-400 shadow-sm pointer-events-none">
                ⌘ K
              </span>
            </div>
          </div>
        </div>

        {/* Center Supervision Info */}
        <div className="text-center hidden md:block">
          <p className="text-xs font-extrabold uppercase tracking-widest text-slate-800">
            Centre de supervision
          </p>
          <p className="text-xs font-semibold text-slate-500 mt-0.5">
            {user.title || 'Apôtre'}
          </p>
        </div>

        {/* Right User Controls */}
        <div className="flex items-center gap-4">
          {/* Notification Bell with Dropdown */}
          <div className="relative" ref={notificationRef}>
            <button
              onClick={() => setIsNotificationOpen(!isNotificationOpen)}
              className="relative grid size-10 place-items-center rounded-xl border border-slate-100 text-slate-600 hover:bg-slate-50 hover:border-slate-200 transition-all focus:outline-none"
              aria-label="Notifications"
            >
              <Bell className="size-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 flex size-5 items-center justify-center rounded-full bg-rose-500 text-[9px] font-bold text-white ring-2 ring-white">
                  {unreadCount}
                </span>
              )}
            </button>

            {isNotificationOpen && (
              <div className="absolute right-0 mt-2.5 w-96 bg-white border border-slate-100 rounded-2xl shadow-xl z-50 overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-slate-50">
                  <h3 className="text-sm font-bold text-slate-800">Notifications</h3>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllAsRead}
                      className="text-[11px] font-bold text-teal-600 hover:text-teal-700 hover:underline transition-colors"
                    >
                      ✓ Tout marquer comme lu
                    </button>
                  )}
                </div>

                {/* Notification list */}
                <div className="max-h-96 overflow-y-auto divide-y divide-slate-50">
                  {notifications.length === 0 ? (
                    <div className="p-6 text-center text-xs text-slate-400">
                      Aucune notification
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        onClick={() => toggleRead(n.id)}
                        className={cn(
                          "p-3.5 flex gap-3 hover:bg-slate-50 transition-colors cursor-pointer text-left relative",
                          n.unread && "bg-slate-50/50"
                        )}
                      >
                        {/* Dot indicator */}
                        {n.unread && (
                          <span className="absolute right-3.5 top-1/2 -translate-y-1/2 size-2 rounded-full bg-teal-500"></span>
                        )}
                        {/* Icon */}
                        <div className="size-8 rounded-lg bg-slate-50 flex items-center justify-center shrink-0 text-slate-500">
                          {n.icon}
                        </div>
                        {/* Content */}
                        <div className="space-y-0.5 pr-4">
                          <p className="text-xs font-bold text-slate-800 leading-tight">{n.title}</p>
                          <p className="text-[11px] text-slate-500 leading-snug">{n.description}</p>
                          <p className="text-[10px] text-slate-400 font-medium pt-1">{n.time}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Footer link */}
                <div className="p-3 border-t border-slate-50 text-center bg-slate-50/30">
                  <button
                    onClick={() => {
                      setIsNotificationOpen(false);
                      navigate('/activities');
                    }}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-teal-600 hover:text-teal-700 hover:underline transition-colors"
                  >
                    Voir toutes les notifications <span className="text-sm">→</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* User Info & Avatar with Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-3 pl-3 border-l border-slate-100 hover:opacity-80 transition-opacity cursor-pointer select-none text-left focus:outline-none"
            >
              <Avatar name={user.fullName} avatarUrl={user.avatarUrl} size="md" />
              <div className="hidden xl:block">
                <p className="text-sm font-bold text-slate-800 leading-none">{user.fullName}</p>
                <p className="text-xs font-medium text-slate-400 mt-1 leading-none">{roleLabels[user.role]}</p>
              </div>
              <ChevronDown className={cn("size-4 text-slate-400 hidden xl:block transition-transform duration-200", isDropdownOpen && "rotate-180")} />
            </button>

            {isDropdownOpen && (
              <div className="absolute right-0 mt-2.5 w-64 bg-white border border-slate-100 rounded-2xl shadow-xl p-2 z-50 animate-fadeIn space-y-1">
                {/* User Card inside dropdown */}
                <div className="flex items-center gap-3 p-3 border-b border-slate-50 mb-1">
                  <Avatar name={user.fullName} avatarUrl={user.avatarUrl} size="md" />
                  <div className="text-left">
                    <p className="text-sm font-bold text-slate-800 leading-none">{user.fullName}</p>
                    <p className="text-xs font-medium text-slate-400 mt-1 leading-none">{roleLabels[user.role]}</p>
                    <div className="flex items-center gap-1.5 mt-2">
                      <span className="size-2 rounded-full bg-emerald-500 animate-pulse"></span>
                      <span className="text-[10px] font-semibold text-emerald-600">{t('topbar.online')}</span>
                    </div>
                  </div>
                </div>

                {/* Menu Options */}
                <button
                  onClick={() => {
                    setIsDropdownOpen(false);
                    navigate('/profile');
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors text-left cursor-pointer"
                >
                  <User className="size-4 text-slate-400" />
                  {t('topbar.my_profile')}
                </button>

                <button
                  onClick={() => {
                    setIsDropdownOpen(false);
                    navigate('/settings');
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors text-left cursor-pointer"
                >
                  <Settings className="size-4 text-slate-400" />
                  {t('topbar.account_settings')}
                </button>

                <button
                  onClick={() => {
                    setIsDropdownOpen(false);
                    setIsPreferencesOpen(true);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors text-left cursor-pointer"
                >
                  <Sliders className="size-4 text-slate-400" />
                  {t('topbar.preferences')}
                </button>

                <button
                  onClick={() => {
                    setIsDropdownOpen(false);
                    setIsActivityLogOpen(true);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors text-left cursor-pointer"
                >
                  <Activity className="size-4 text-slate-400" />
                  {t('topbar.activity_log')}
                </button>

                <button
                  onClick={() => {
                    setIsDropdownOpen(false);
                    setIsHelpCenterOpen(true);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors text-left cursor-pointer"
                >
                  <CircleHelp className="size-4 text-slate-400" />
                  {t('topbar.help_center')}
                </button>

                <button
                  onClick={() => {
                    setIsDropdownOpen(false);
                    setIsAboutSystemOpen(true);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors text-left cursor-pointer"
                >
                  <Info className="size-4 text-slate-400" />
                  {t('topbar.about')}
                </button>

                {/* Separator & Logout */}
                <div className="h-px bg-slate-100 my-1"></div>

                <button
                  onClick={() => {
                    setIsDropdownOpen(false);
                    void handleLogout();
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50/55 transition-colors text-left cursor-pointer"
                >
                  <LogOut className="size-4 text-rose-500" />
                  {t('sidebar.logout')}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Preferences Modal */}
      <Modal
        isOpen={isPreferencesOpen}
        onClose={() => setIsPreferencesOpen(false)}
        title={t('topbar.preferences')}
      >
        <div className="space-y-4 py-2">
          <div className="space-y-3">
            {/* Theme option */}
            <div className="flex items-center justify-between p-2 hover:bg-slate-50 rounded-lg">
              <div className="flex items-center gap-2">
                <Moon className="size-4 text-slate-500" />
                <span className="text-xs font-semibold text-slate-700">Mode sombre</span>
              </div>
              <input type="checkbox" className="rounded text-teal-600 focus:ring-teal-500 cursor-pointer" />
            </div>

            {/* Language option */}
            <div className="flex items-center justify-between p-2 hover:bg-slate-50 rounded-lg">
              <div className="flex items-center gap-2">
                <Globe className="size-4 text-slate-500" />
                <span className="text-xs font-semibold text-slate-700">Langue du système</span>
              </div>
              <select
                value={tempLanguage}
                onChange={(e) => setTempLanguage(e.target.value as 'fr' | 'en')}
                className="text-xs border border-slate-200 rounded px-1.5 py-0.5 outline-none bg-white font-medium text-slate-700"
              >
                <option value="fr">Français (FR)</option>
                <option value="en">English (EN)</option>
              </select>
            </div>

            {/* Currency option */}
            <div className="flex items-center justify-between p-2 hover:bg-slate-50 rounded-lg">
              <div className="flex items-center gap-2">
                <Coins className="size-4 text-slate-500" />
                <span className="text-xs font-semibold text-slate-700">Devise du système</span>
              </div>
              <select
                value={tempCurrency}
                onChange={(e) => setTempCurrency(e.target.value as 'USD' | 'CDF')}
                className="text-xs border border-slate-200 rounded px-1.5 py-0.5 outline-none bg-white font-medium text-slate-700"
              >
                <option value="USD">Dollar Américain (USD)</option>
                <option value="CDF">Franc Congolais (CDF)</option>
              </select>
            </div>

            {/* Notification sound */}
            <div className="flex items-center justify-between p-2 hover:bg-slate-50 rounded-lg">
              <div className="flex items-center gap-2">
                <Volume2 className="size-4 text-slate-500" />
                <span className="text-xs font-semibold text-slate-700">Sons de notification</span>
              </div>
              <input type="checkbox" defaultChecked className="rounded text-teal-600 focus:ring-teal-500 cursor-pointer" />
            </div>

            {/* Notification frequency */}
            <div className="flex items-center justify-between p-2 hover:bg-slate-50 rounded-lg">
              <div className="flex items-center gap-2">
                <BellRing className="size-4 text-slate-500" />
                <span className="text-xs font-semibold text-slate-700">Fréquence des alertes</span>
              </div>
              <select className="text-xs border border-slate-200 rounded px-1.5 py-0.5 outline-none bg-white font-medium text-slate-700">
                <option value="realtime">Temps réel</option>
                <option value="daily">Résumé quotidien</option>
                <option value="disabled">Désactivé</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <AppButton variant="secondary" onClick={() => setIsPreferencesOpen(false)}>
              Annuler
            </AppButton>
            <AppButton onClick={handleSavePreferences}>
              Enregistrer
            </AppButton>
          </div>
        </div>
      </Modal>

      {/* Activity Log Modal */}
      <Modal
        isOpen={isActivityLogOpen}
        onClose={() => setIsActivityLogOpen(false)}
        title="Journal d'activités"
      >
        <div className="space-y-4 py-2">
          <div className="text-slate-500 text-xs mb-2">
            Historique de vos dernières actions sur la plateforme de supervision.
          </div>
          
          <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
            <div className="flex items-start gap-3 p-2.5 rounded-lg bg-slate-50 hover:bg-slate-100/70 transition-colors">
              <div className="size-6 rounded-full bg-teal-50 text-teal-600 flex items-center justify-center shrink-0">
                ✓
              </div>
              <div>
                <p className="text-xs font-bold text-slate-800">Connexion réussie</p>
                <p className="text-[10px] text-slate-500">Adresse IP: 192.168.1.104 • Il y a 10 min</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-2.5 rounded-lg bg-slate-50 hover:bg-slate-100/70 transition-colors">
              <div className="size-6 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                ✎
              </div>
              <div>
                <p className="text-xs font-bold text-slate-800">Modification du budget départemental</p>
                <p className="text-[10px] text-slate-500">Modification du budget Caisse à 250 USD • Il y a 3 h</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-2.5 rounded-lg bg-slate-50 hover:bg-slate-100/70 transition-colors">
              <div className="size-6 rounded-full bg-sky-50 text-sky-600 flex items-center justify-center shrink-0">
                +
              </div>
              <div>
                <p className="text-xs font-bold text-slate-800">Création de département</p>
                <p className="text-[10px] text-slate-500">Assignation du département Caisse à l'extension Goma • Il y a 1 jour</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-2.5 rounded-lg bg-slate-50 hover:bg-slate-100/70 transition-colors">
              <div className="size-6 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                ✗
              </div>
              <div>
                <p className="text-xs font-bold text-slate-800">Modification de profil refusée</p>
                <p className="text-[10px] text-slate-500">Tentative de modification des droits RLS rejetée • Il y a 2 jours</p>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-100">
            <AppButton onClick={() => setIsActivityLogOpen(false)}>
              Fermer
            </AppButton>
          </div>
        </div>
      </Modal>

      {/* Help Center Modal */}
      <Modal
        isOpen={isHelpCenterOpen}
        onClose={() => setIsHelpCenterOpen(false)}
        title="Centre d'aide & support"
      >
        <div className="space-y-4 py-2">
          <div className="space-y-3">
            <div className="p-3 rounded-lg border border-slate-100 space-y-1">
              <h4 className="text-xs font-bold text-slate-800">Comment assigner un département ?</h4>
              <p className="text-[11px] text-slate-500 leading-normal">
                Allez dans l'onglet "Administration &gt; Départements" et cliquez sur "Assigner département". Sélectionnez l'extension et cochez les départements concernés.
              </p>
            </div>

            <div className="p-3 rounded-lg border border-slate-100 space-y-1">
              <h4 className="text-xs font-bold text-slate-800">Qui peut modifier le budget ?</h4>
              <p className="text-[11px] text-slate-500 leading-normal">
                Seul le responsable désigné du département ou un administrateur global / superadmin peut modifier le budget mensuel.
              </p>
            </div>

            <div className="p-3 rounded-lg border border-slate-100 space-y-1">
              <h4 className="text-xs font-bold text-slate-800">Besoin d'assistance directe ?</h4>
              <p className="text-[11px] text-slate-500 leading-normal">
                Contactez le support technique de l'église par email à <strong>support@eglisenouveaudepart.org</strong> ou auprès de l'administrateur système de votre paroisse.
              </p>
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-100">
            <AppButton onClick={() => setIsHelpCenterOpen(false)}>
              Fermer
            </AppButton>
          </div>
        </div>
      </Modal>

      {/* About System Modal */}
      <Modal
        isOpen={isAboutSystemOpen}
        onClose={() => setIsAboutSystemOpen(false)}
        title="À propos d'ECND Admin"
      >
        <div className="space-y-4 py-2 text-center">
          <div className="mx-auto size-16 rounded-2xl bg-teal-50 flex items-center justify-center mb-2">
            <span className="text-teal-600 font-extrabold text-2xl">ED</span>
          </div>
          
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-slate-800">ECND Supervision System</h3>
            <p className="text-xs text-slate-500">Version 2.1.0-release (Vite + React)</p>
            <p className="text-[10px] text-slate-400">© 2026 Église Nouveau Départ. Tous droits réservés.</p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 text-left text-[11px] text-slate-600 leading-relaxed max-w-sm mx-auto">
            Cette plateforme centralisée permet le pilotage des extensions, la supervision financière, la gestion des membres et des affectations ministérielles sous l'autorité du bureau de supervision.
          </div>

          <div className="flex justify-center pt-4 border-t border-slate-100">
            <AppButton onClick={() => setIsAboutSystemOpen(false)}>
              Fermer
            </AppButton>
          </div>
        </div>
      </Modal>
    </header>
  );
}

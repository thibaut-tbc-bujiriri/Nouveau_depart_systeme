import { Avatar } from '@/components/common';
import { AppButton, AppSwitch } from '@/components/ui';
import { ConfirmDialog, Modal } from '@/components/ui/Modal';
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
  Trash2,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import {
  getNotificationsForCurrentUser,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  deleteAllNotificationsForCurrentUser,
} from '@/services/notificationsService';
import type { AppNotification } from '@/types';
import { supabase } from '@/lib/supabaseClient';
import { getRecentActivityLogs } from '@/services/activityLogService';
import type { ActivityLog } from '@/services/activityLogService';


interface TopbarProps {
  onToggleMobileSidebar: () => void;
}

export function Topbar({ onToggleMobileSidebar }: TopbarProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  // Preferences hook
  const { language, setLanguage, currency, setCurrency, theme, setTheme, t } = usePreferences();
  const [tempLanguage, setTempLanguage] = useState<'fr' | 'en'>(language);
  const [tempCurrency, setTempCurrency] = useState<'USD' | 'CDF'>(currency);
  const [tempTheme, setTempTheme] = useState<'light' | 'dark'>(theme);

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
      setTempTheme(theme);
    }
  }, [isPreferencesOpen, language, currency, theme]);

  const handleSavePreferences = () => {
    setLanguage(tempLanguage);
    setCurrency(tempCurrency);
    setTheme(tempTheme);
    setIsPreferencesOpen(false);
  };

  const dropdownRef = useRef<HTMLDivElement>(null);
  const notificationRef = useRef<HTMLDivElement>(null);

  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(() => localStorage.getItem('ecnd.pref_notification_sound') !== 'false');
  const [isConfirmDeleteAllOpen, setIsConfirmDeleteAllOpen] = useState(false);

  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);
  const [logsError, setLogsError] = useState(false);

  const fetchActivityLogs = async () => {
    if (!user) return;
    try {
      setLogsError(false);
      setIsLoadingLogs(true);
      const data = await getRecentActivityLogs(user, 20);
      setActivityLogs(data);
    } catch (err) {
      console.error("Failed to load activity logs:", err);
      setLogsError(true);
    } finally {
      setIsLoadingLogs(false);
    }
  };

  useEffect(() => {
    if (isActivityLogOpen) {
      void fetchActivityLogs();
    }
  }, [isActivityLogOpen, user]);

  const getActivityLogIcon = (log: ActivityLog) => {
    if (log.status === 'failed') {
      return <span className="size-6 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 text-xs font-bold">✗</span>;
    }
    if (log.status === 'warning') {
      return <span className="size-6 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 text-xs font-bold">!</span>;
    }
    
    switch (log.actionType) {
      case 'login_success':
        return <span className="size-6 rounded-full bg-teal-50 text-teal-600 flex items-center justify-center shrink-0 text-xs font-bold">✓</span>;
      case 'logout':
        return <span className="size-6 rounded-full bg-slate-50 text-slate-600 flex items-center justify-center shrink-0 text-xs font-bold">⎋</span>;
      case 'user_created':
      case 'member_created':
      case 'department_created':
      case 'extension_created':
      case 'event_created':
      case 'service_created':
        return <span className="size-6 rounded-full bg-sky-50 text-sky-600 flex items-center justify-center shrink-0 text-xs font-bold">+</span>;
      default:
        return <span className="size-6 rounded-full bg-teal-50 text-teal-600 flex items-center justify-center shrink-0 text-xs font-bold">✓</span>;
    }
  };

  useEffect(() => {
    localStorage.setItem('ecnd.pref_notification_sound', String(soundEnabled));
  }, [soundEnabled]);

  const fetchNotifications = async () => {
    if (!user) return;
    try {
      setHasError(false);
      setIsLoadingNotifications(true);
      const data = await getNotificationsForCurrentUser(user);
      setNotifications(data);
    } catch (err) {
      console.error('Erreur lors du chargement des notifications:', err);
      setHasError(true);
    } finally {
      setIsLoadingNotifications(false);
    }
  };

  const playNotificationSound = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
      gainNode.gain.setValueAtTime(0.05, audioCtx.currentTime);

      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.15);
    } catch (err) {
      console.error("Failed to play notification beep:", err);
    }
  };

  useEffect(() => {
    if (!user) return;

    void fetchNotifications();

    // Setup Supabase Realtime channel subscription
    const channel = supabase
      .channel('public:notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
        },
        async (payload) => {
          try {
            const newNotif = payload.new as any;

            // Client-side filtering check before refresh and beep
            let isTargeted = false;
            if (!newNotif.target_role && !newNotif.target_user_id && !newNotif.target_extension_id && !newNotif.target_department_id) {
              isTargeted = true;
            } else if (newNotif.target_user_id === user.id) {
              isTargeted = true;
            } else if (user.role === 'superadmin') {
              isTargeted = !newNotif.target_user_id || newNotif.target_user_id === user.id;
            } else if (user.role === 'admin') {
              if (newNotif.target_extension_id === user.branchId) {
                isTargeted = !newNotif.target_role || newNotif.target_role === 'admin';
              }
            } else if (user.role === 'department_manager') {
              if (newNotif.target_department_id && user.departmentIds?.includes(newNotif.target_department_id)) {
                isTargeted = !newNotif.target_role || newNotif.target_role === 'department_manager';
              } else if (newNotif.target_extension_id === user.branchId && newNotif.target_role === 'department_manager') {
                isTargeted = true;
              }
            } else if (user.role === 'department_member') {
              if (newNotif.target_department_id && user.departmentIds?.includes(newNotif.target_department_id)) {
                isTargeted = !newNotif.target_role || newNotif.target_role === 'department_member';
              } else if (newNotif.target_extension_id === user.branchId && newNotif.target_role === 'department_member') {
                isTargeted = true;
              }
            }

            if (isTargeted) {
              await fetchNotifications();
              if (localStorage.getItem('ecnd.pref_notification_sound') !== 'false') {
                playNotificationSound();
              }
            }
          } catch (err) {
            console.error("Realtime notification check failed:", err);
          }
        }
      )
      .subscribe();

    // Fallback polling (every 45 seconds)
    const interval = setInterval(() => {
      void fetchNotifications();
    }, 45000);

    return () => {
      void supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, [user]);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const handleMarkAllAsRead = async () => {
    if (!user) return;
    try {
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, isRead: true, readAt: new Date().toISOString() }))
      );
      await markAllNotificationsAsRead(user);
    } catch (err) {
      console.error('Erreur lors du marquage de toutes les notifications comme lues:', err);
      fetchNotifications();
    }
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true, readAt: new Date().toISOString() } : n))
      );
      await markNotificationAsRead(id);
    } catch (err) {
      console.error('Erreur lors du marquage de la notification comme lue:', err);
      fetchNotifications();
    }
  };

  const handleDeleteNotification = async (id: string) => {
    try {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      await deleteNotification(id);

      try {
        const { createActivityLog } = await import('@/services/activityLogService');
        await createActivityLog({
          actionType: 'notification_deleted',
          module: 'notifications',
          title: 'Notification supprimée',
          description: `Une notification a été supprimée par l'utilisateur.`,
          status: 'success',
          targetId: id
        });
      } catch (err) {
        console.error("Log notification deletion error:", err);
      }
    } catch (err) {
      console.error('Erreur lors de la suppression de la notification:', err);
      fetchNotifications();
    }
  };

  const handleDeleteAll = () => {
    if (notifications.length === 0) return;
    setIsConfirmDeleteAllOpen(true);
  };

  const confirmDeleteAll = async () => {
    try {
      setNotifications([]);
      await deleteAllNotificationsForCurrentUser();

      try {
        const { createActivityLog } = await import('@/services/activityLogService');
        await createActivityLog({
          actionType: 'notifications_cleared',
          module: 'notifications',
          title: 'Notifications vidées',
          description: 'Toutes les notifications ont été supprimées par l\'utilisateur.',
          status: 'success'
        });
      } catch (err) {
        console.error("Log notifications clear error:", err);
      }
    } catch (err) {
      console.error('Erreur lors de la suppression de toutes les notifications:', err);
      fetchNotifications();
    }
  };

  const handleToggleNotifications = () => {
    const nextOpen = !isNotificationOpen;
    setIsNotificationOpen(nextOpen);
    if (nextOpen) {
      void fetchNotifications();
    }
  };

  const formatRelativeTime = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 0) return "À l'instant";
    if (diffInSeconds < 60) return "Il y a quelques secondes";

    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) return `Il y a ${diffInMinutes} min`;

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `Il y a ${diffInHours} h`;

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays === 1) return "Hier";
    if (diffInDays < 7) return `Il y a ${diffInDays} jours`;

    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'user_created':
      case 'member_created':
        return <UserCheck className="size-4 text-emerald-500" />;
      case 'extension_created':
      case 'extension_updated':
        return <Globe className="size-4 text-sky-500" />;
      case 'department_created':
      case 'department_updated':
        return <Sliders className="size-4 text-violet-500" />;
      case 'department_responsible_assigned':
        return <User className="size-4 text-indigo-500" />;
      case 'event_created':
      case 'event_updated':
        return <Calendar className="size-4 text-sky-500" />;
      case 'service_created':
        return <Calendar className="size-4 text-amber-500" />;
      case 'finance_created':
        return <Landmark className="size-4 text-teal-500" />;
      case 'report_created':
        return <FileText className="size-4 text-amber-500" />;
      case 'role_changed':
      case 'permissions_updated':
        return <ShieldAlert className="size-4 text-purple-500" />;
      case 'settings_updated':
        return <Settings className="size-4 text-slate-500" />;
      case 'backup_done':
        return <RefreshCw className="size-4 text-indigo-500" />;
      case 'system_alert':
        return <ShieldAlert className="size-4 text-rose-500" />;
      case 'personal_message':
        return <MessageSquare className="size-4 text-slate-500" />;
      default:
        return <Bell className="size-4 text-slate-500" />;
    }
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
    <header className="shrink-0 border-b border-slate-100 bg-white px-3 py-2.5 shadow-sm sm:px-6 sm:py-3.5 print:hidden">
      <div className="flex min-w-0 items-center justify-between gap-2 sm:gap-4">
        {/* Left Search Bar */}
        <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3 lg:max-w-xs">
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
        <div className="flex shrink-0 items-center gap-2 sm:gap-4">
          {/* Notification Bell with Dropdown */}
          <div className="relative" ref={notificationRef}>
            <button
              onClick={handleToggleNotifications}
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
              <div className="fixed left-3 right-3 top-16 z-50 max-h-[calc(100dvh-5rem)] overflow-hidden rounded-xl border border-slate-100 bg-white shadow-xl sm:absolute sm:left-auto sm:right-0 sm:top-auto sm:mt-2.5 sm:w-96 sm:max-h-none sm:rounded-2xl">
                {/* Header */}
                <div className="flex flex-col gap-2 border-b border-slate-50 p-3 sm:flex-row sm:items-center sm:justify-between sm:p-4">
                  <h3 className="text-sm font-bold text-slate-800">Notifications</h3>
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                    {unreadCount > 0 && (
                      <button
                        onClick={handleMarkAllAsRead}
                        className="text-[11px] font-bold text-teal-600 hover:text-teal-700 hover:underline transition-colors"
                      >
                        ✓ Tout marquer comme lu
                      </button>
                    )}
                    {notifications.length > 0 && (
                      <button
                        onClick={handleDeleteAll}
                        className="text-[11px] font-bold text-rose-500 hover:text-rose-600 hover:underline transition-colors flex items-center gap-0.5"
                        title="Supprimer toutes les notifications"
                      >
                        <Trash2 className="size-3" />
                        Supprimer tout
                      </button>
                    )}
                  </div>
                </div>

                {/* Notification list */}
                <div className="max-h-[calc(100dvh-11rem)] overflow-y-auto divide-y divide-slate-50 sm:max-h-96">
                  {isLoadingNotifications && notifications.length === 0 ? (
                    <div className="p-6 text-center text-xs text-slate-400">
                      Chargement des notifications...
                    </div>
                  ) : hasError ? (
                    <div className="p-6 text-center text-xs text-rose-500 font-semibold">
                      Impossible de charger les notifications.
                    </div>
                  ) : notifications.length === 0 ? (
                    <div className="p-6 text-center text-xs text-slate-400">
                      Aucune notification pour le moment.
                    </div>
                  ) : (
                    notifications.slice(0, 15).map((n) => (
                      <div
                        key={n.id}
                        onClick={async () => {
                          await handleMarkAsRead(n.id);
                          if (n.link) {
                            let targetLink = n.link;
                            // Map French/unmatched links to correct router paths
                            if (targetLink === '/utilisateurs') targetLink = '/users';
                            else if (targetLink === '/membres') targetLink = '/members';
                            else if (targetLink === '/evenements') targetLink = '/events';
                            else if (targetLink === '/departements') targetLink = '/departments';
                            else if (targetLink === '/extensions') targetLink = '/branches';
                            else if (targetLink === '/activities' || targetLink === '/activites') targetLink = '/dashboard';

                            navigate(targetLink);
                          }
                          setIsNotificationOpen(false);
                        }}
                        className={cn(
                          "p-3.5 flex gap-3 hover:bg-slate-50 transition-colors cursor-pointer text-left relative group",
                          !n.isRead && "bg-slate-50/50"
                        )}
                      >
                        {/* Dot indicator */}
                        {!n.isRead && (
                          <span className="absolute right-3.5 top-1/2 -translate-y-1/2 size-2 rounded-full bg-teal-500 group-hover:opacity-0 transition-opacity"></span>
                        )}
                        {/* Icon */}
                        <div className="size-8 rounded-lg bg-slate-50 flex items-center justify-center shrink-0 text-slate-500">
                          {getNotificationIcon(n.type)}
                        </div>
                        {/* Content */}
                        <div className="space-y-0.5 pr-8 flex-1">
                          <p className="text-xs font-bold text-slate-800 leading-tight">{n.title}</p>
                          <p className="text-[11px] text-slate-500 leading-snug">{n.message}</p>
                          <p className="text-[10px] text-slate-400 font-medium pt-1">
                            {formatRelativeTime(n.createdAt)}
                          </p>
                        </div>
 
                        {/* Trash Button */}
                        <button
                          onClick={async (e) => {
                            e.stopPropagation();
                            await handleDeleteNotification(n.id);
                          }}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 hover:text-rose-600 p-1 hover:bg-slate-100 rounded-lg"
                          title="Supprimer cette notification"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
 
                {/* Footer link */}
                <div className="p-3 border-t border-slate-50 text-center bg-slate-50/30">
                  <button
                    onClick={() => {
                      setIsNotificationOpen(false);
                      navigate('/dashboard');
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
              <div className="absolute right-0 z-50 mt-2.5 w-[min(16rem,calc(100vw-1.5rem))] space-y-1 rounded-xl border border-slate-100 bg-white p-2 shadow-xl animate-fadeIn sm:rounded-2xl">
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
            <label className="flex items-center justify-between p-2 hover:bg-slate-50 rounded-lg cursor-pointer select-none">
              <div className="flex items-center gap-2">
                <Moon className="size-4 text-slate-500" />
                <span className="text-xs font-semibold text-slate-700">Mode sombre</span>
              </div>
              <AppSwitch
                checked={tempTheme === 'dark'}
                onChange={(e) => setTempTheme(e.target.checked ? 'dark' : 'light')}
              />
            </label>

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
            <label className="flex items-center justify-between p-2 hover:bg-slate-50 rounded-lg cursor-pointer select-none">
              <div className="flex items-center gap-2">
                <Volume2 className="size-4 text-slate-500" />
                <span className="text-xs font-semibold text-slate-700">Sons de notification</span>
              </div>
              <AppSwitch
                checked={soundEnabled}
                onChange={(e) => setSoundEnabled(e.target.checked)}
              />
            </label>

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
            {isLoadingLogs && activityLogs.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400">
                Chargement du journal d'activités...
              </div>
            ) : logsError ? (
              <div className="p-6 text-center text-xs text-rose-500 font-semibold">
                Impossible de charger le journal d’activités.
              </div>
            ) : activityLogs.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400">
                Aucune activité récente.
              </div>
            ) : (
              activityLogs.map((log) => (
                <div key={log.id} className="flex items-start gap-3 p-2.5 rounded-lg bg-slate-50 hover:bg-slate-100/70 transition-colors text-left">
                  {getActivityLogIcon(log)}
                  <div>
                    <p className="text-xs font-bold text-slate-800">{log.title}</p>
                    <p className="text-[11px] text-slate-600 leading-snug">{log.description}</p>
                    <p className="text-[10px] text-slate-400 pt-0.5 font-medium">
                      {log.userName && `${log.userName} • `}
                      {formatRelativeTime(log.createdAt)}
                    </p>
                  </div>
                </div>
              ))
            )}
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
      <ConfirmDialog
        isOpen={isConfirmDeleteAllOpen}
        title="Supprimer toutes les notifications"
        description="Voulez-vous vraiment supprimer toutes vos notifications ? Cette action est irréversible."
        confirmLabel="Supprimer"
        onCancel={() => setIsConfirmDeleteAllOpen(false)}
        onConfirm={async () => {
          setIsConfirmDeleteAllOpen(false);
          await confirmDeleteAll();
        }}
      />
    </header>
  );
}

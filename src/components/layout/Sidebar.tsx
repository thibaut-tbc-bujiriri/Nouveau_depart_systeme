import logo from '@/assets/ecdn_logo.png';
import { navItems } from '@/data';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/cn';
import { filterNavItemsForRole, roleLabels } from '@/lib/permissions';
import { useEffect, useMemo, useState } from 'react';
import { usePreferences } from '@/contexts/PreferencesContext';
import type { LucideIcon } from 'lucide-react';
import {
  Activity,
  BarChart3,
  Building2,
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Headphones,
  Landmark,
  LayoutDashboard,
  Network,
  Settings,
  Shield,
  Sliders,
  UserCircle2,
  UserCog,
  Users,
  Wallet,
  X,
} from 'lucide-react';
import { NavLink, useLocation } from 'react-router-dom';

const iconMap: Record<string, LucideIcon> = {
  'layout-dashboard': LayoutDashboard,
  'building-2': Building2,
  users: Users,
  network: Network,
  wallet: Wallet,
  church: Landmark,
  'calendar-days': CalendarDays,
  'bar-chart-3': BarChart3,
  settings: Settings,
  'user-circle-2': UserCircle2,
  'user-cog': UserCog,
};

const menuCategories = [
  {
    key: 'dashboard',
    label: 'Dashboard',
    type: 'link' as const,
    to: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    key: 'administration',
    label: 'ADMINISTRATION',
    type: 'group' as const,
    icon: Shield,
    subKeys: ['branches', 'users', 'members', 'departments'],
  },
  {
    key: 'activities',
    label: 'ACTIVITÉS',
    type: 'group' as const,
    icon: Activity,
    subKeys: ['services', 'events'],
  },
  {
    key: 'management',
    label: 'GESTION & SYSTÈME',
    type: 'group' as const,
    icon: Sliders,
    subKeys: ['finances', 'reports', 'settings', 'profile'],
  },
];

interface SidebarProps {
  isMobileOpen: boolean;
  onCloseMobile: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

function SidebarContent({
  onCloseMobile,
  isCollapsed = false,
  onToggleCollapse,
}: {
  onCloseMobile?: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}) {
  const { user } = useAuth();
  const { t } = usePreferences();
  const location = useLocation();
  const currentPath = location.pathname;

  if (!user) {
    return null;
  }

  const filteredNavItems = useMemo(() => filterNavItemsForRole(navItems, user.role), [user.role]);

  const isSubItemActive = (toPath: string) => {
    return currentPath === toPath || currentPath.startsWith(toPath + '/');
  };

  const [openGroup, setOpenGroup] = useState<string | null>(() => {
    let activeGroupKey: string | null = null;
    menuCategories.forEach((category) => {
      if (category.type === 'group') {
        const hasActiveChild = category.subKeys.some((subKey) => {
          const item = filteredNavItems.find((i) => i.key === subKey);
          return item && isSubItemActive(item.to);
        });
        if (hasActiveChild) {
          activeGroupKey = category.key;
        }
      }
    });
    return activeGroupKey;
  });

  useEffect(() => {
    menuCategories.forEach((category) => {
      if (category.type === 'group') {
        const hasActiveChild = category.subKeys.some((subKey) => {
          const item = filteredNavItems.find((i) => i.key === subKey);
          return item && (currentPath === item.to || currentPath.startsWith(item.to + '/'));
        });
        if (hasActiveChild) {
          setOpenGroup((prev) => {
            if (prev === category.key) return prev;
            return category.key;
          });
        }
      }
    });
  }, [currentPath, filteredNavItems]);

  const toggleGroup = (groupKey: string) => {
    setOpenGroup((prev) => (prev === groupKey ? null : groupKey));
  };

  const handleGroupClick = (groupKey: string) => {
    if (isCollapsed && onToggleCollapse) {
      onToggleCollapse();
      setOpenGroup(groupKey);
    } else {
      toggleGroup(groupKey);
    }
  };

  return (
    <div className="flex h-full flex-col justify-between">
      <div>
        {/* Profile Card Header */}
        <div className={cn("transition-all duration-300", isCollapsed ? "p-2" : "p-4")}>
          <div className={cn(
            "relative flex bg-[#112240] border border-slate-700/20 transition-all duration-300",
            isCollapsed ? "flex-col items-center p-2 gap-2 rounded-xl" : "items-center gap-3 p-4 rounded-2xl"
          )}>
            <img src={logo} alt="ECND" className="size-11 rounded-full border-2 border-cyan-400 object-cover shrink-0" />
            {!isCollapsed && (
              <div className="transition-opacity duration-300">
                <p className="text-sm font-bold text-white tracking-wide">ECND Admin</p>
                <p className="text-xs font-medium text-slate-400 mt-0.5">{roleLabels[user.role]}</p>
              </div>
            )}
            <button
              onClick={onToggleCollapse}
              className={cn(
                "rounded-full p-1 text-slate-500 hover:bg-slate-800 hover:text-white transition-all",
                isCollapsed ? "relative mt-0.5" : "absolute right-3 top-1/2 -translate-y-1/2"
              )}
              aria-label={isCollapsed ? "Expand" : "Collapse"}
            >
              {isCollapsed ? <ChevronRight className="size-4" /> : <ChevronLeft className="size-4" />}
            </button>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="space-y-4 px-3 py-2">
          {menuCategories.map((category) => {
            if (category.type === 'link') {
              const item = filteredNavItems.find((i) => i.key === category.key);
              if (!item) return null;

              const Icon = iconMap[item.icon] ?? LayoutDashboard;
              const isActive = currentPath === item.to || currentPath.startsWith(item.to + '/');

              return (
                <NavLink
                  key={item.key}
                  to={item.to}
                  onClick={onCloseMobile}
                  title={isCollapsed ? t('sidebar.' + item.key) : undefined}
                  className={cn(
                    'group flex items-center rounded-xl transition-all duration-200 font-medium text-sm',
                    isCollapsed ? 'justify-center p-3' : 'gap-3 px-4 py-3',
                    isActive
                      ? 'bg-teal-600 font-semibold text-white shadow-lg shadow-teal-900/30'
                      : 'text-slate-300 hover:bg-slate-800/40 hover:text-white',
                  )}
                >
                  <Icon className={cn('size-5 shrink-0', isActive ? 'text-white' : 'text-slate-400 group-hover:text-white')} />
                  {!isCollapsed && <span>{t('sidebar.' + item.key)}</span>}
                </NavLink>
              );
            } else {
              const visibleSubItems = category.subKeys
                .map((subKey) => filteredNavItems.find((item) => item.key === subKey))
                .filter((item): item is typeof navItems[0] => !!item);

              if (visibleSubItems.length === 0) return null;

              const isGroupActive = visibleSubItems.some((subItem) => isSubItemActive(subItem.to));
              const isOpen = openGroup === category.key;

              return (
                <div key={category.key} className="space-y-1">
                  {isCollapsed ? (
                    <div className="border-t border-slate-800/60 my-4 mx-2" />
                  ) : (
                    <p className="px-4 py-1 text-[11px] font-bold tracking-wider text-slate-500 uppercase">
                      {t('sidebar.' + category.key).toUpperCase()}
                    </p>
                  )}
                  <button
                    onClick={() => handleGroupClick(category.key)}
                    title={isCollapsed ? t('sidebar.' + category.key) : undefined}
                    className={cn(
                      'w-full group flex items-center rounded-xl transition-all duration-200 outline-none font-medium text-sm',
                      isCollapsed ? 'justify-center p-3' : 'justify-between px-4 py-3',
                      isGroupActive
                        ? 'bg-slate-800/40 text-cyan-400 font-semibold'
                        : 'text-slate-300 hover:bg-slate-800/40 hover:text-white',
                    )}
                  >
                    <div className={cn('flex items-center', isCollapsed ? 'gap-0' : 'gap-3')}>
                      <category.icon className={cn('size-5 transition-colors duration-200', isGroupActive ? 'text-cyan-400' : 'text-slate-400 group-hover:text-white')} />
                      {!isCollapsed && <span>{t('sidebar.' + category.key)}</span>}
                    </div>
                    {!isCollapsed && (
                      <ChevronDown
                        className={cn(
                          'size-4 text-slate-400 transition-transform duration-200 group-hover:text-white shrink-0',
                          isOpen && 'rotate-180',
                          isGroupActive && 'text-cyan-400',
                        )}
                      />
                    )}
                  </button>
                  {isOpen && !isCollapsed && (
                    <div className="mt-1 space-y-1 pl-4 transition-all duration-200">
                      {visibleSubItems.map((subItem) => {
                        const SubIcon = iconMap[subItem.icon] ?? LayoutDashboard;
                        const isSubActive = isSubItemActive(subItem.to);
                        return (
                          <NavLink
                            key={subItem.key}
                            to={subItem.to}
                            onClick={onCloseMobile}
                            className={
                              cn(
                                'group flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm transition-all duration-200 font-medium',
                                isSubActive
                                  ? 'bg-teal-600 font-semibold text-white shadow-lg shadow-teal-900/30'
                                  : 'text-slate-400 hover:bg-slate-800/40 hover:text-white',
                              )
                            }
                          >
                            <SubIcon className={cn('size-4 shrink-0', isSubActive ? 'text-white' : 'text-slate-400 group-hover:text-white')} />
                            <span>{t('sidebar.' + subItem.key)}</span>
                          </NavLink>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            }
          })}
        </nav>
      </div>

      {/* Support Card Footer */}
      <div className={cn("transition-all duration-300", isCollapsed ? "p-2" : "p-4")}>
        <div 
          className={cn(
            "flex bg-[#112240]/40 border border-slate-700/20 transition-all duration-300",
            isCollapsed ? "flex-col items-center p-2 rounded-xl" : "items-center gap-3 p-4 rounded-2xl"
          )}
          title={isCollapsed ? t('sidebar.need_help') : undefined}
        >
          <div className="grid size-10 place-items-center rounded-xl bg-[#0f172a] text-teal-400 shrink-0">
            <Headphones className="size-5" />
          </div>
          {!isCollapsed && (
            <div>
              <p className="text-sm font-bold text-white">{t('sidebar.need_help')}</p>
              <p className="text-xs font-medium text-slate-400 mt-0.5">{t('sidebar.contact_support')}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function Sidebar({
  isMobileOpen,
  onCloseMobile,
  isCollapsed = false,
  onToggleCollapse,
}: SidebarProps) {
  return (
    <>
      <aside
        className={cn(
          "hidden h-screen shrink-0 overflow-y-auto bg-gradient-to-b from-[#0a1424] to-[#0c1c38] lg:block transition-all duration-300 ease-in-out",
          isCollapsed ? "w-20" : "w-72"
        )}
      >
        <SidebarContent
          isCollapsed={isCollapsed}
          onToggleCollapse={onToggleCollapse}
        />
      </aside>

      <div className={cn('fixed inset-0 z-40 lg:hidden', isMobileOpen ? 'block' : 'hidden')}>
        <button className="absolute inset-0 bg-slate-950/60" onClick={onCloseMobile} aria-label="Fermer le menu" />
        <aside className="relative h-full w-72 bg-gradient-to-b from-[#0a1424] to-[#0c1c38] shadow-xl">
          <button onClick={onCloseMobile} className="absolute right-3 top-3 rounded-md p-1 text-slate-300 hover:bg-slate-800" aria-label="Fermer">
            <X className="size-4" />
          </button>
          <SidebarContent onCloseMobile={onCloseMobile} isCollapsed={false} />
        </aside>
      </div>
    </>
  );
}

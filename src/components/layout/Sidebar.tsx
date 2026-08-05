import logo from '@/assets/ecdn_logo.png';
import { navItems } from '@/data';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/cn';
import { filterNavItemsForRole } from '@/lib/permissions';
import { useEffect, useMemo, useState } from 'react';
import { usePreferences } from '@/contexts/PreferencesContext';
import type { LucideIcon } from 'lucide-react';
import {
  Activity,
  BarChart3,
  Building2,
  CalendarDays,
  ChevronDown,
  Headphones,
  Landmark,
  LayoutGrid,
  Menu,
  Network,
  Settings,
  ScanLine,
  Shield,
  Sliders,
  UserCircle2,
  UserCog,
  Users,
  Wallet,
  X,
} from 'lucide-react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';

const iconMap: Record<string, LucideIcon> = {
  'layout-dashboard': LayoutGrid,
  'building-2': Building2,
  users: Users,
  members: Users,
  network: Network,
  wallet: Wallet,
  church: Landmark,
  'calendar-days': CalendarDays,
  'bar-chart-3': BarChart3,
  settings: Settings,
  'user-circle-2': UserCircle2,
  'user-cog': UserCog,
  'scan-line': ScanLine,
  services: CalendarDays,
  events: CalendarDays,
  'teaching-programs': BarChart3,
  finances: Wallet,
  reports: BarChart3,
  'annual-themes': Landmark,
  profile: UserCircle2,
  branches: Building2,
  departments: Network,
};

const menuCategories = [
  {
    key: 'dashboard',
    label: 'Tableau de bord',
    type: 'link' as const,
    to: '/dashboard',
    icon: LayoutGrid,
  },
  {
    key: 'administration',
    label: 'Administration',
    type: 'group' as const,
    icon: Shield,
    subKeys: ['branches', 'users', 'members', 'departments'],
  },
  {
    key: 'activities',
    label: 'Activités',
    type: 'group' as const,
    icon: Activity,
    subKeys: ['services', 'events', 'teaching-programs'],
  },
  {
    key: 'management',
    label: 'Gestion & Système',
    type: 'group' as const,
    icon: Sliders,
    subKeys: ['finances', 'reports', 'card-scanner', 'annual-themes', 'settings', 'profile'],
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
  const navigate = useNavigate();
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
    <div className="flex h-full flex-col justify-between bg-white text-slate-800">
      <div>
        {/* Header: Centered Logo with 3-bars toggle button next to it */}
        <div className="flex items-center justify-between px-4 py-5 border-b border-slate-100/60">
          <div className="flex items-center gap-3">
            <div className="relative size-12 rounded-full p-1 bg-white ring-2 ring-[#009688]/30 shadow-xs flex items-center justify-center shrink-0">
              <img src={logo} alt="ECND Logo" className="size-full rounded-full object-cover" />
            </div>
          </div>
          {onToggleCollapse && (
            <button
              onClick={onToggleCollapse}
              className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
              aria-label="Basculer le menu"
              title="Réduire / Agrandir le menu"
            >
              <Menu className="size-5" />
            </button>
          )}
        </div>

        {/* Navigation Items */}
        <nav className="space-y-3 px-3.5 py-3">
          {menuCategories.map((category) => {
            if (category.type === 'link') {
              const item = filteredNavItems.find((i) => i.key === category.key);
              if (!item) return null;

              const Icon = iconMap[item.icon] ?? LayoutGrid;
              const isActive = currentPath === item.to || currentPath.startsWith(item.to + '/');

              return (
                <NavLink
                  key={item.key}
                  to={item.to}
                  onClick={onCloseMobile}
                  title={isCollapsed ? t('sidebar.' + item.key) : undefined}
                  className={cn(
                    'group flex items-center transition-all duration-200 font-normal text-base cursor-pointer select-none no-underline border-b-0 outline-none focus:outline-none rounded-2xl',
                    isCollapsed ? 'justify-center p-3' : 'gap-3 px-4 py-3.5',
                    isActive
                      ? 'bg-[#009688] text-white shadow-md shadow-[#009688]/25'
                      : 'text-slate-700 hover:bg-slate-100/80 hover:text-slate-900',
                  )}
                >
                  <Icon className={cn('size-5 shrink-0', isActive ? 'text-white' : 'text-[#009688]')} />
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
                  <button
                    onClick={() => handleGroupClick(category.key)}
                    title={isCollapsed ? t('sidebar.' + category.key) : undefined}
                    className={cn(
                      'w-full group flex items-center rounded-2xl border transition-all duration-200 outline-none focus:outline-none border-b-0 font-normal text-base cursor-pointer select-none',
                      isCollapsed ? 'justify-center p-3' : 'justify-between px-4 py-3.5',
                      isOpen
                        ? 'bg-white border-slate-200/90 text-slate-900'
                        : isGroupActive
                        ? 'bg-white border-[#009688]/40 text-slate-900'
                        : 'bg-white border-slate-200/80 text-slate-800 hover:bg-slate-50 hover:border-slate-300',
                    )}
                  >
                    <div className={cn('flex items-center', isCollapsed ? 'gap-0' : 'gap-3')}>
                      <category.icon
                        className={cn(
                          'size-5 shrink-0 transition-colors duration-200',
                          isOpen || isGroupActive ? 'text-[#009688]' : 'text-slate-600 group-hover:text-slate-800',
                        )}
                      />
                      {!isCollapsed && <span>{t('sidebar.' + category.key)}</span>}
                    </div>
                    {!isCollapsed && (
                      <ChevronDown
                        className={cn(
                          'size-4 text-slate-400 transition-transform duration-200 group-hover:text-slate-600 shrink-0',
                          isOpen && 'rotate-180 text-slate-700',
                        )}
                      />
                    )}
                  </button>

                  {/* Tree View Submenus (Arborescence) with Icons & Shadow */}
                  {isOpen && !isCollapsed && (
                    <div className="relative pl-5 py-2 space-y-2.5">
                      {/* Vertical line stem */}
                      <div className="absolute left-[29px] top-3 bottom-4 w-[1.5px] bg-slate-300" />

                      {visibleSubItems.map((subItem) => {
                        const isSubActive = isSubItemActive(subItem.to);
                        const SubIcon = iconMap[subItem.icon] ?? LayoutGrid;

                        return (
                          <NavLink
                            key={subItem.key}
                            to={subItem.to}
                            onClick={onCloseMobile}
                            className={cn(
                              'group relative flex items-center gap-2.5 text-sm transition-all cursor-pointer select-none no-underline border-b-0 outline-none focus:outline-none rounded-xl px-2.5 py-2',
                              isSubActive
                                ? 'bg-emerald-50/70 border border-[#009688]/30 shadow-md shadow-[#009688]/15'
                                : 'hover:bg-slate-50 border border-transparent',
                            )}
                          >
                            {/* Circle dot and horizontal connector */}
                            <div className="flex items-center shrink-0 z-10 pl-0.5">
                              <span
                                className={cn(
                                  'size-2 rounded-full ring-2 ring-white transition-all',
                                  isSubActive
                                    ? 'bg-[#009688] ring-[#009688]/30'
                                    : 'bg-slate-400 group-hover:bg-slate-500',
                                )}
                              />
                              <span
                                className={cn(
                                  'w-3 h-[1.5px] transition-colors',
                                  isSubActive ? 'bg-[#009688]' : 'bg-slate-300 group-hover:bg-slate-400',
                                )}
                              />
                            </div>

                            {/* Submenu Icon */}
                            <SubIcon
                              className={cn(
                                'size-4 shrink-0 transition-colors',
                                isSubActive ? 'text-[#009688]' : 'text-slate-500 group-hover:text-slate-700',
                              )}
                            />

                            {/* Label Text */}
                            <span
                              className={cn(
                                'text-sm transition-colors truncate',
                                isSubActive
                                  ? 'font-bold text-[#009688]'
                                  : 'font-normal text-slate-700 hover:text-slate-900',
                              )}
                            >
                              {t('sidebar.' + subItem.key)}
                            </span>
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

      {/* Footer: Simple "Besoin d'aide ?" without card style */}
      <div className="px-4 py-4 mt-auto">
        <button
          onClick={() => {
            navigate('/settings');
            if (onCloseMobile) onCloseMobile();
          }}
          title={isCollapsed ? t('sidebar.need_help') : undefined}
          className="flex items-center gap-3 px-3 py-2.5 text-sm font-semibold text-[#009688] hover:opacity-80 transition-opacity w-full text-left cursor-pointer no-underline border-b-0 outline-none focus:outline-none"
        >
          <Headphones className="size-5 text-[#009688] shrink-0" />
          {!isCollapsed && <span>{t('sidebar.need_help')}</span>}
        </button>
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
  const [isHoverExpanded, setIsHoverExpanded] = useState(false);

  // Hover auto-expands when locked collapsed, unless user manually clicks toggle
  const effectiveCollapsed = isCollapsed && !isHoverExpanded;

  return (
    <>
      <aside
        onMouseEnter={() => setIsHoverExpanded(true)}
        onMouseLeave={() => setIsHoverExpanded(false)}
        className={cn(
          'app-shell-height hidden shrink-0 overflow-y-auto bg-white lg:block transition-all duration-300 ease-in-out print:hidden border-r-0 select-none shadow-xs z-30',
          effectiveCollapsed ? 'w-20' : 'w-64',
        )}
      >
        <SidebarContent
          onCloseMobile={onCloseMobile}
          isCollapsed={effectiveCollapsed}
          onToggleCollapse={onToggleCollapse}
        />
      </aside>

      <div className={cn('fixed inset-0 z-40 lg:hidden print:hidden', isMobileOpen ? 'block' : 'hidden')}>
        <button className="absolute inset-0 bg-slate-950/40 backdrop-blur-xs" onClick={onCloseMobile} aria-label="Fermer le menu" />
        <aside className="relative h-full w-[min(18rem,86vw)] overflow-y-auto bg-white shadow-2xl">
          <button onClick={onCloseMobile} className="absolute right-3 top-3 z-10 rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600" aria-label="Fermer">
            <X className="size-5" />
          </button>
          <SidebarContent onCloseMobile={onCloseMobile} isCollapsed={false} />
        </aside>
      </div>
    </>
  );
}

import logo from '@/assets/ecdn_logo.png';
import { navItems } from '@/data';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/cn';
import { filterNavItemsForRole, roleLabels } from '@/lib/permissions';
import type { LucideIcon } from 'lucide-react';
import {
  BarChart3,
  Building2,
  CalendarDays,
  Landmark,
  LayoutDashboard,
  Network,
  Settings,
  UserCircle2,
  UserCog,
  Users,
  Wallet,
  X,
} from 'lucide-react';
import { NavLink } from 'react-router-dom';

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

interface SidebarProps {
  isMobileOpen: boolean;
  onCloseMobile: () => void;
}

function SidebarContent({ onCloseMobile }: { onCloseMobile?: () => void }) {
  const { user } = useAuth();

  if (!user) {
    return null;
  }

  const filteredNavItems = filterNavItemsForRole(navItems, user.role);

  return (
    <>
      <div className="border-b border-slate-800/80 px-4 py-4">
        <div className="flex items-center gap-3 rounded-xl bg-slate-800/70 p-3">
          <img src={logo} alt="ECND" className="size-10 rounded-full border border-cyan-400/40 object-cover" />
          <div>
            <p className="text-sm font-semibold text-white">ECND Admin</p>
            <p className="text-xs text-slate-300">{roleLabels[user.role]}</p>
          </div>
        </div>
      </div>

      <nav className="space-y-1 px-3 py-4">
        {filteredNavItems.map((item) => {
          const Icon = iconMap[item.icon] ?? LayoutDashboard;

          return (
            <NavLink
              key={item.key}
              to={item.to}
              onClick={onCloseMobile}
              className={({ isActive }) =>
                cn(
                  'group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all',
                  isActive
                    ? 'bg-gradient-to-r from-cyan-500 to-teal-500 font-semibold text-white shadow-lg shadow-cyan-900/30'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white',
                )
              }
            >
              <Icon className="size-4" />
              {item.label}
            </NavLink>
          );
        })}
      </nav>
    </>
  );
}

export function Sidebar({ isMobileOpen, onCloseMobile }: SidebarProps) {
  return (
    <>
      <aside className="hidden h-screen w-72 shrink-0 overflow-y-auto border-r border-slate-800 bg-slate-900 lg:block">
        <SidebarContent />
      </aside>

      <div className={cn('fixed inset-0 z-40 lg:hidden', isMobileOpen ? 'block' : 'hidden')}>
        <button className="absolute inset-0 bg-slate-950/60" onClick={onCloseMobile} aria-label="Fermer le menu" />
        <aside className="relative h-full w-72 bg-slate-900 shadow-xl">
          <button onClick={onCloseMobile} className="absolute right-3 top-3 rounded-md p-1 text-slate-300 hover:bg-slate-800" aria-label="Fermer">
            <X className="size-4" />
          </button>
          <SidebarContent onCloseMobile={onCloseMobile} />
        </aside>
      </div>
    </>
  );
}


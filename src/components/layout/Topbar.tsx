import { UserAvatar } from '@/components/common';
import { AppButton, AppInput } from '@/components/ui';
import { useAuth } from '@/hooks/useAuth';
import { roleLabels } from '@/lib/permissions';
import { Bell, LogOut, Menu, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface TopbarProps {
  onToggleMobileSidebar: () => void;
}

export function Topbar({ onToggleMobileSidebar }: TopbarProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  if (!user) {
    return null;
  }

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <header className="shrink-0 border-b border-slate-200 bg-white/90 px-4 py-3 backdrop-blur sm:px-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
          <button
            onClick={onToggleMobileSidebar}
            className="grid size-9 place-items-center rounded-lg border border-slate-200 text-slate-600 lg:hidden"
            aria-label="Ouvrir le menu"
          >
            <Menu className="size-4" />
          </button>

          <div className="hidden w-56 lg:block">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
              <AppInput placeholder="Rechercher..." className="h-10 rounded-xl bg-slate-50 pl-9" />
            </div>
          </div>

          <div className="min-w-0">
            <p className="text-xs uppercase tracking-wide text-slate-400">Centre de supervision</p>
            <p className="truncate text-sm font-semibold text-slate-900">{user.title ?? user.fullName}</p>
            <p className="truncate text-xs text-slate-500">{roleLabels[user.role]} · {user.email}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <button className="grid size-9 place-items-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50" aria-label="Notifications">
            <Bell className="size-4" />
          </button>
          <UserAvatar name={user.fullName} role={user.role} />
          <AppButton
            variant="secondary"
            size="sm"
            className="inline-flex w-9 shrink-0 rounded-full p-0 sm:hidden"
            onClick={handleLogout}
            aria-label="Déconnexion"
            title="Déconnexion"
          >
            <LogOut className="size-4" />
          </AppButton>
          <AppButton variant="secondary" className="hidden rounded-xl sm:inline-flex" onClick={handleLogout}>
            <LogOut className="size-4" />
            Deconnexion
          </AppButton>
        </div>
      </div>
    </header>
  );
}


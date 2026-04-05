import { Sidebar, Topbar } from '@/components/layout';
import { useState } from 'react';
import { Outlet } from 'react-router-dom';

export function DashboardLayout() {
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  return (
    <div className="h-screen overflow-hidden bg-slate-100 lg:flex">
      <Sidebar isMobileOpen={isMobileOpen} onCloseMobile={() => setIsMobileOpen(false)} />
      <div className="flex h-screen min-w-0 flex-1 flex-col overflow-hidden">
        <Topbar onToggleMobileSidebar={() => setIsMobileOpen((prev) => !prev)} />
        <main className="flex-1 overflow-y-auto bg-gradient-to-b from-slate-50 to-slate-100 p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}


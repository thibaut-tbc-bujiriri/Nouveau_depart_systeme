import { Sidebar, Topbar } from '@/components/layout';
import { useState } from 'react';
import { Outlet } from 'react-router-dom';

export function DashboardLayout() {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(() => {
    try {
      const saved = localStorage.getItem('sidebar-collapsed');
      return saved ? JSON.parse(saved) === true : false;
    } catch {
      return false;
    }
  });

  const toggleCollapse = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('sidebar-collapsed', JSON.stringify(next));
      } catch {
        // Ignore storage errors
      }
      return next;
    });
  };

  return (
    <div className="h-screen overflow-hidden bg-slate-100 dark:bg-[#0b1329] lg:flex">
      <Sidebar
        isMobileOpen={isMobileOpen}
        onCloseMobile={() => setIsMobileOpen(false)}
        isCollapsed={isCollapsed}
        onToggleCollapse={toggleCollapse}
      />
      <div className="flex h-screen min-w-0 flex-1 flex-col overflow-hidden">
        <Topbar onToggleMobileSidebar={() => setIsMobileOpen((prev) => !prev)} />
        <main className="flex-1 overflow-y-auto bg-gradient-to-b from-slate-50 to-slate-100 dark:from-[#0d1527] dark:to-[#0b1329] p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}


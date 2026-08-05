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
    <div className="app-shell-height overflow-hidden bg-slate-100 dark:bg-[#0b1329] lg:flex print:block print:h-auto print:overflow-visible">
      <Sidebar
        isMobileOpen={isMobileOpen}
        onCloseMobile={() => setIsMobileOpen(false)}
        isCollapsed={isCollapsed}
        onToggleCollapse={toggleCollapse}
      />
      <div className="app-shell-height flex min-w-0 flex-1 flex-col overflow-hidden print:block print:h-auto print:overflow-visible">
        <Topbar onToggleMobileSidebar={() => setIsMobileOpen((prev) => !prev)} />
        <main className="flex-1 overflow-y-auto overscroll-contain bg-gradient-to-b from-slate-50 to-slate-100 dark:from-[#0d1527] dark:to-[#0b1329] px-3 py-4 sm:p-6 print:p-0 print:bg-white print:overflow-visible">
          <Outlet />
        </main>
      </div>
    </div>
  );
}


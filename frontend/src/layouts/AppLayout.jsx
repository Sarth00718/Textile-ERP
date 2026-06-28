import { Outlet, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import Sidebar from '../components/layout/Sidebar';
import TopNavbar from '../components/layout/TopNavbar';
import { useUIStore } from '../store/uiStore';

export default function AppLayout() {
  const { sidebarCollapsed, sidebarMobileOpen, closeMobileSidebar } = useUIStore();
  const location = useLocation();

  useEffect(() => {
    if (sidebarMobileOpen) {
      closeMobileSidebar();
    }
  }, [location.pathname, sidebarMobileOpen, closeMobileSidebar]);

  return (
    <div className="flex h-screen overflow-hidden bg-steel-50 dark:bg-steel-950">
      <Sidebar collapsed={sidebarCollapsed} mobileOpen={sidebarMobileOpen} onClose={closeMobileSidebar} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <TopNavbar />
        <main className="flex-1 overflow-y-auto p-5">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

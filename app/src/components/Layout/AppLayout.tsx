import type React from 'react';
import { useState, useCallback, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { DesktopSidebar } from './DesktopSidebar';
import { MobileBottomNav } from './MobileBottomNav';
import { MobileDrawer } from './MobileDrawer';
import { ResponsiveHeader } from './ResponsiveHeader';
import { OfflinePrompt } from '../Connectivity/OfflinePrompt';
import type { DirHandle } from '../../lib/fsStore';

interface AppLayoutProps {
  root: DirHandle | null;
  scouter: string;
  onLogout: () => void;
  isAdmin?: boolean;
  children: React.ReactNode;
}

const PAGE_TITLES: Record<string, string> = {
  '/': 'Dashboard',
  '/quick': 'Quick Scout',
  '/pit': 'Pit Scouting',
  '/info': 'Data Viewer',
  '/alliance': 'Alliance Selection',
  '/match-planning': 'Match Planning',
  '/schedule': 'Event Schedule',
  '/analytics': 'Analytics',
  '/export': 'Export Data',
  '/admin': 'Admin Portal',
  '/users': 'User Management',
  '/settings': 'Settings',
};

export const AppLayout: React.FC<AppLayoutProps> = ({
  root,
  scouter,
  onLogout,
  isAdmin = false,
  children,
}) => {
  const location = useLocation();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const toggleSidebar = useCallback(() => {
    setSidebarCollapsed(prev => !prev);
  }, []);

  const openDrawer = useCallback(() => {
    setDrawerOpen(true);
  }, []);

  const closeDrawer = useCallback(() => {
    setDrawerOpen(false);
  }, []);

  const pageTitle = useMemo(() => {
    return PAGE_TITLES[location.pathname] || 'Saxon Scout';
  }, [location.pathname]);

  return (
    <div className="d-flex" style={{ minHeight: '100vh' }}>
      {/* Desktop Sidebar */}
      <DesktopSidebar
        collapsed={sidebarCollapsed}
        onToggle={toggleSidebar}
        onLogout={onLogout}
        scouter={scouter}
        root={root}
        isAdmin={isAdmin}
      />

      {/* Main Content Area */}
      <div
        className="flex-grow-1 d-flex flex-column"
        style={{
          marginLeft: window.innerWidth >= 768 ? (sidebarCollapsed ? '80px' : '260px') : '0',
          transition: 'margin-left 0.3s ease',
        }}
      >
        {/* Header */}
        <ResponsiveHeader
          title={pageTitle}
          onMenuClick={openDrawer}
          root={root}
          scouter={scouter}
        />

        {/* Page Content */}
        <main 
          className="flex-grow-1 overflow-auto"
          style={{
            backgroundColor: 'var(--color-surface)',
            paddingBottom: '80px', // Space for mobile bottom nav
          }}
        >
          <div className="container-fluid p-3 p-md-4">
            {children}
          </div>
        </main>

        {/* Footer */}
        <footer className="bg-white border-top py-3 d-none d-md-block">
          <div className="container-fluid">
            <div className="d-flex justify-content-between align-items-center">
              <div className="text-muted small">
                © {new Date().getFullYear()} Saxon Scout - Local-first scouting for FRC events
              </div>
              <div className="d-flex align-items-center">
                <span className="badge bg-warning text-dark">Team 611</span>
              </div>
            </div>
          </div>
        </footer>
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav onMoreClick={openDrawer} />

      {/* Mobile Drawer */}
      <MobileDrawer
        isOpen={drawerOpen}
        onClose={closeDrawer}
        isAdmin={isAdmin}
      />
      
      {/* Offline Prompt */}
      <OfflinePrompt 
        root={root}
        onSelectFolder={() => {
          window.dispatchEvent(new CustomEvent('saxon-scout:request-folder'));
          return Promise.resolve();
        }}
      />
    </div>
  );
};

export default AppLayout;
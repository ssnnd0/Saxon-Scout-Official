import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { DirHandle } from '../lib/fsStore';
import { useSettings } from '../context/SettingsContext';
import { spacing } from '../styles/tokens';

// Types for the navigation items
export interface NavItem {
  path: string;
  icon: string;
  label: string;
  requiresAuth?: boolean;
  adminOnly?: boolean;
}

// Props type for AppShell
export interface AppShellProps {
  root: DirHandle | null;
  scouter: string;
  onLogout: () => void;
  onPickFolder?: () => void;
  isAdmin?: boolean;
  children: React.ReactNode;
}

// Navigation items configuration
const NAV_ITEMS: NavItem[] = [
  { path: '/', icon: 'home', label: 'Home' },
  { path: '/quick', icon: 'bolt', label: 'Quick Scout', requiresAuth: true },
  { path: '/pit', icon: 'robot', label: 'Pit Scouting', requiresAuth: true },
  { path: '/alliance', icon: 'users', label: 'Alliance Selection', requiresAuth: true },
  { path: '/match-planning', icon: 'chess', label: 'Match Planning', requiresAuth: true },
  { path: '/analytics', icon: 'chart-line', label: 'Analytics', requiresAuth: true },
  { path: '/schedule', icon: 'calendar', label: 'Schedule', requiresAuth: true },
  { path: '/export', icon: 'file-export', label: 'Export', requiresAuth: true, adminOnly: true },
  { path: '/admin', icon: 'shield-alt', label: 'Admin', requiresAuth: true, adminOnly: true },
  { path: '/settings', icon: 'cog', label: 'Settings' },
];

// Navigation link component
const NavLink = React.memo(({ 
  item, 
  isActive, 
  onClick,
  className = '',
  showLabel = true
}: { 
  item: NavItem; 
  isActive: boolean; 
  onClick: () => void;
  className?: string;
  showLabel?: boolean;
}) => (
  <button
    className={`flex items-center p-2 rounded transition-colors w-full text-left ${
      isActive
        ? 'bg-saxon-gold text-white'
        : 'text-gray-700 hover:bg-gray-100'
    } ${className}`}
    onClick={onClick}
    aria-current={isActive ? 'page' : undefined}
    aria-label={showLabel ? undefined : item.label}
  >
    <i className={`fa fa-${item.icon} w-6 text-center`} aria-hidden="true"></i>
    {showLabel && <span className="ml-2">{item.label}</span>}
  </button>
));

// Main AppShell component
export const AppShell: React.FC<AppShellProps> = ({
  root,
  scouter,
  onLogout,
  isAdmin = false,
  children,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { settings } = useSettings();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [navCollapsed, setNavCollapsed] = useState(settings.navCollapsedByDefault);

  // Check if current route is active
  const isActive = useCallback((path: string) => 
    location.pathname === path || (path !== '/' && location.pathname.startsWith(path)),
    [location.pathname]
  );

  // Prefetch route components for better performance
  const prefetch = useCallback((path: string) => {
    try {
      switch (path) {
        case '/quick': import('../views/QuickScout'); break;
        case '/pit': import('../views/PitScout'); break;
        case '/info': import('../views/InfoViewer'); break;
        case '/alliance': import('../views/AllianceSelection'); break;
        case '/match-planning': import('../views/MatchPlanning'); break;
        case '/schedule': import('../views/EventSchedule'); break;
        case '/analytics': import('../views/Analytics'); break;
        case '/export': import('../views/Export'); break;
        case '/settings': import('../views/Settings'); break;
        case '/admin': import('../views/AdminPortal'); break;
        case '/': import('../views/Home'); break;
        default: break;
      }
    } catch (error) {
      console.warn('Failed to prefetch route:', path, error);
    }
  }, []);

  // Handle navigation with prefetching
  const handleNavigate = useCallback((path: string) => {
    navigate(path);
    prefetch(path);
  }, [navigate, prefetch]);

  // Toggle mobile menu
  const toggleMobileMenu = useCallback(() => {
    setIsMobileMenuOpen(prev => !prev);
  }, []);

  // Toggle sidebar collapse
  const toggleSidebar = useCallback(() => {
    setNavCollapsed(prev => !prev);
  }, []);

  // Update nav collapsed state when settings change
  useEffect(() => {
    setNavCollapsed(settings.navCollapsedByDefault);
  }, [settings.navCollapsedByDefault]);

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  // Check if current view should be full screen
  const isFullScreen = useMemo(() => 
    ['/quick', '/pit', '/info'].some(path => 
      location.pathname.startsWith(path)
    ), 
    [location.pathname]
  );

  // Memoize filtered navigation items based on user role and authentication
  const filteredNavItems = useMemo(() => {
    return NAV_ITEMS.filter(item => 
      (!item.requiresAuth || scouter) && 
      (!item.adminOnly || isAdmin)
    );
  }, [scouter, isAdmin]);

  // If in full screen mode, just render the children
  if (isFullScreen) {
    return <div className="min-h-screen bg-gray-50">{children}</div>;
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside 
        className={`fixed inset-y-0 left-0 z-30 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        } md:relative md:translate-x-0 ${
          navCollapsed ? 'md:w-20' : 'md:w-64'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <div className="flex items-center">
              <img 
                src="/app/assets/Logo+611.png" 
                alt="Saxon Scout Logo" 
                className="w-8 h-8"
              />
              {!navCollapsed && (
                <h1 className="ml-2 text-xl font-bold text-saxon-black">Saxon Scout</h1>
              )}
            </div>
            <button 
              className="p-1 text-gray-500 rounded-md hover:bg-gray-100 md:hidden"
              onClick={toggleMobileMenu}
              aria-label="Close menu"
            >
              <i className="w-5 h-5 fa fa-times"></i>
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto">
            <ul className="p-2">
              {filteredNavItems.map((item) => (
                <li key={item.path} className="mb-1">
                  <NavLink
                    item={item}
                    isActive={isActive(item.path)}
                    onClick={() => handleNavigate(item.path)}
                    showLabel={!navCollapsed}
                  />
                </li>
              ))}
            </ul>
          </nav>

          {/* User info and logout */}
          <div className="p-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-8 h-8 rounded-full bg-saxon-gold flex items-center justify-center text-white">
                  {scouter ? scouter.charAt(0).toUpperCase() : 'U'}
                </div>
                {!navCollapsed && (
                  <div className="ml-2">
                    <p className="text-sm font-medium text-gray-700">{scouter || 'User'}</p>
                    <button 
                      onClick={onLogout}
                      className="text-xs text-gray-500 hover:text-saxon-gold"
                    >
                      Sign out
                    </button>
                  </div>
                )}
              </div>
              <button 
                onClick={toggleSidebar}
                className="p-1 text-gray-400 rounded-md hover:bg-gray-100"
                aria-label={navCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              >
                <i className={`fa ${navCollapsed ? 'fa-chevron-right' : 'fa-chevron-left'}`}></i>
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex flex-col flex-1 overflow-hidden md:pl-64">
        {/* Top navigation */}
        <header className="sticky top-0 z-20 bg-white border-b border-gray-200">
          <div className="flex items-center justify-between h-16 px-4">
            <div className="flex items-center">
              <button 
                className="p-2 mr-2 text-gray-500 rounded-md hover:bg-gray-100 md:hidden"
                onClick={toggleMobileMenu}
                aria-label="Open menu"
              >
                <i className="w-5 h-5 fa fa-bars"></i>
              </button>
              <h2 className="text-lg font-medium text-gray-900">
                {filteredNavItems.find(item => isActive(item.path))?.label || 'Dashboard'}
              </h2>
            </div>
            
            <div className="flex items-center space-x-4">
              {root && (
                <div className="hidden px-3 py-1 text-sm text-green-800 bg-green-100 rounded-md md:block">
                  <i className="mr-1 fa fa-check-circle"></i>
                  <span>Folder Connected</span>
                </div>
              )}
              <div className="relative">
                <button 
                  className="flex items-center text-sm text-gray-700 hover:text-saxon-gold"
                  onClick={onLogout}
                >
                  <i className="mr-1 fa fa-sign-out-alt"></i>
                  <span className="hidden md:inline">Sign out</span>
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-4 md:p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default AppShell;

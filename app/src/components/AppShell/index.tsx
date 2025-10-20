import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { NAV_ITEMS } from '../../config/navigation';
import { AppShellProps } from '../../types/navigation';
import NavLink from './NavLink';
import LoadingSpinner from '../LoadingSpinner';
import { useSettings } from '../../context/SettingsContext';

const AppShell: React.FC<AppShellProps> = ({ 
  root, 
  scouter, 
  onLogout, 
  isAdmin = false, 
  children 
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { settings, updateSetting } = useSettings();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [navCollapsed, setNavCollapsed] = useState(settings.navCollapsedByDefault);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Filter navigation items based on user role and authentication
  const filteredNavItems = useMemo(() => {
    return NAV_ITEMS.filter(item => 
      (!item.requiresAuth || scouter) && 
      (!item.adminOnly || isAdmin)
    );
  }, [scouter, isAdmin]);

  // Check if current route is active
  const isActive = useCallback((path: string, exact = false) => {
    return exact 
      ? location.pathname === path 
      : location.pathname.startsWith(path);
  }, [location.pathname]);

  // Toggle mobile menu
  const toggleMobileMenu = useCallback(() => {
    setIsMobileMenuOpen(prev => !prev);
  }, []);

  // Toggle sidebar collapse
  const toggleSidebar = useCallback(() => {
    const newState = !navCollapsed;
    setNavCollapsed(newState);
    updateSetting('navCollapsedByDefault', newState);
  }, [navCollapsed, updateSetting]);

  // Handle navigation with transition
  const handleNavigate = useCallback((path: string) => {
    setIsTransitioning(true);
    navigate(path);
    // Reset transition state after animation completes
    setTimeout(() => setIsTransitioning(false), 200);
  }, [navigate]);

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  // Check if current view should be full screen
  const isFullScreen = useMemo(() => {
    return ['/quick', '/pit', '/info'].some(path => 
      location.pathname.startsWith(path)
    );
  }, [location.pathname]);

  // Preload routes when hovering over nav items
  const prefetchRoute = useCallback((path: string) => {
    // This is a no-op in the browser, but can be used with a preload strategy
    console.log(`Prefetching route: ${path}`);
  }, []);

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {/* Mobile menu overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
          onClick={toggleMobileMenu}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`
          fixed lg:static z-30 h-full bg-white dark:bg-gray-800 shadow-lg lg:shadow-md 
          transition-all duration-300 ease-in-out
          ${isMobileMenuOpen ? 'left-0' : '-left-64'} 
          lg:left-0
          ${navCollapsed ? 'w-16' : 'w-64'}
        `}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className={`flex items-center h-16 px-4 border-b border-gray-200 dark:border-gray-700 ${
            navCollapsed ? 'justify-center' : 'justify-between'
          }`}>
            {!navCollapsed && (
              <div className="flex items-center">
                <img 
                  src="/app/assets/Logo+611.png" 
                  alt="Saxon Scout" 
                  className="w-8 h-8"
                />
                <span className="ml-2 text-xl font-bold text-gray-800 dark:text-white">
                  Saxon Scout
                </span>
              </div>
            )}
            <button 
              onClick={toggleSidebar}
              className="p-1 rounded-md text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"
              aria-label={navCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              <i className={`fa ${navCollapsed ? 'fa-chevron-right' : 'fa-chevron-left'}`} />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto py-4 px-2">
            <ul className="space-y-1">
              {filteredNavItems.map((item) => (
                <li key={item.path}>
                  <NavLink
                    item={item}
                    isActive={isActive(item.path, item.exact)}
                    onClick={() => handleNavigate(item.path)}
                    onMouseEnter={() => prefetchRoute(item.path)}
                    showLabel={!navCollapsed}
                    className="mb-1"
                  />
                </li>
              ))}
            </ul>
          </nav>

          {/* User info and logout */}
          {scouter && (
            <div className={`p-4 border-t border-gray-200 dark:border-gray-700 ${
              navCollapsed ? 'text-center' : ''
            }`}>
              <div className={`flex items-center ${navCollapsed ? 'justify-center' : 'justify-between'}`}>
                {!navCollapsed && (
                  <div className="text-sm">
                    <p className="font-medium text-gray-800 dark:text-white">{scouter}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {isAdmin ? 'Admin' : 'Scout'}
                    </p>
                  </div>
                )}
                <button
                  onClick={onLogout}
                  className="p-2 text-gray-500 hover:text-red-500 transition-colors"
                  aria-label="Logout"
                  title="Logout"
                >
                  <i className="fa fa-sign-out-alt" />
                </button>
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* Main content */}
      <div className={`
        flex-1 flex flex-col overflow-hidden 
        transition-all duration-300 ease-in-out
        ${navCollapsed ? 'lg:ml-16' : 'lg:ml-64'}
      `}>
        {/* Top navigation */}
        <header className="bg-white dark:bg-gray-800 shadow-sm z-10">
          <div className="flex items-center justify-between h-16 px-4">
            <button 
              onClick={toggleMobileMenu}
              className="p-2 rounded-md text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 lg:hidden"
              aria-label="Toggle menu"
            >
              <i className="fa fa-bars" />
            </button>

            <div className="flex-1 flex justify-between">
              <h1 className="text-xl font-semibold text-gray-800 dark:text-white ml-2">
                {filteredNavItems.find(item => isActive(item.path, item.exact))?.label || 'Dashboard'}
              </h1>
              
              <div className="flex items-center space-x-4">
                {root && (
                  <span className="hidden md:inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                    <i className="fa fa-check-circle mr-1" />
                    Folder Connected
                  </span>
                )}
                
                <div className="relative">
                  <button 
                    className="p-1 rounded-full text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"
                    onClick={() => updateSetting('darkMode', !settings.darkMode)}
                    aria-label={`Toggle ${settings.darkMode ? 'light' : 'dark'} mode`}
                  >
                    <i className={`fa ${settings.darkMode ? 'fa-sun' : 'fa-moon'}`} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-gray-50 dark:bg-gray-900">
          <div className={`transition-opacity duration-300 ${isTransitioning ? 'opacity-50' : 'opacity-100'}`}>
            {isTransitioning ? (
              <div className="flex items-center justify-center h-64">
                <LoadingSpinner size="lg" />
              </div>
            ) : (
              <ErrorBoundary>
                {children}
              </ErrorBoundary>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default React.memo(AppShell);

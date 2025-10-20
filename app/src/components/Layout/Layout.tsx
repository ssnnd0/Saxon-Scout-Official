import React, { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FaHome, FaRobot, FaUsers, FaChess, FaChartLine, FaCalendarAlt, FaFileExport, FaCog, FaSignOutAlt, FaBars, FaTimes, FaBolt, FaUserShield, FaUsersCog } from 'react-icons/fa';
import { useSettings } from '../../context/SettingsContext';

interface LayoutProps {
  children: ReactNode;
  title?: string;
  scouter?: string;
  onLogout?: () => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, title = 'Saxon Scout', scouter, onLogout }) => {
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const location = useLocation();
  const { settings } = useSettings();

  const navItems = [
    { path: '/', icon: <FaHome />, label: 'Home' },
    { path: '/quick', icon: <FaBolt />, label: 'Quick Scout' },
    { path: '/pit', icon: <FaRobot />, label: 'Pit Scouting' },
    { path: '/alliance', icon: <FaUsers />, label: 'Alliance Selection' },
    { path: '/match-planning', icon: <FaChess />, label: 'Match Planning' },
    { path: '/analytics', icon: <FaChartLine />, label: 'Analytics' },
    { path: '/schedule', icon: <FaCalendarAlt />, label: 'Schedule' },
    { path: '/export', icon: <FaFileExport />, label: 'Export' },
  ];

  const adminNavItems = [
    { path: '/admin', icon: <FaUserShield />, label: 'Admin' },
    { path: '/users', icon: <FaUsersCog />, label: 'User Management' },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Mobile header */}
      <header className="bg-white shadow-sm lg:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center">
            <button
              onClick={() => setSidebarOpen(true)}
              className="text-gray-500 hover:text-gray-600 focus:outline-none"
              aria-label="Open sidebar"
            >
              <FaBars className="h-6 w-6" />
            </button>
            <h1 className="ml-4 text-xl font-semibold text-gray-900">{title}</h1>
          </div>
          {scouter && (
            <div className="flex items-center space-x-4">
              <span className="text-sm font-medium text-gray-700">{scouter}</span>
              <button
                onClick={onLogout}
                className="text-gray-500 hover:text-gray-700"
                aria-label="Logout"
              >
                <FaSignOutAlt className="h-5 w-5" />
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Mobile sidebar */}
      <div
        className={`fixed inset-0 z-40 lg:hidden ${sidebarOpen ? 'block' : 'hidden'}`}
        onClick={() => setSidebarOpen(false)}
      >
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75" aria-hidden="true" />
        <div className="fixed inset-y-0 left-0 max-w-xs w-full bg-white shadow-lg">
          <div className="h-full overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Menu</h2>
              <button
                onClick={() => setSidebarOpen(false)}
                className="text-gray-500 hover:text-gray-700"
                aria-label="Close sidebar"
              >
                <FaTimes className="h-6 w-6" />
              </button>
            </div>
            <nav className="px-4 py-6 space-y-1">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center px-4 py-3 rounded-lg text-base font-medium ${
                    isActive(item.path)
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <span className="mr-3">{item.icon}</span>
                  {item.label}
                </Link>
              ))}
              
              {/* Admin section */}
              {scouter?.endsWith('@saxonrobotics.org') && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h3 className="px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Admin
                  </h3>
                  <div className="mt-2 space-y-1">
                    {adminNavItems.map((item) => (
                      <Link
                        key={item.path}
                        to={item.path}
                        className={`flex items-center px-4 py-3 rounded-lg text-base font-medium ${
                          isActive(item.path)
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'text-gray-700 hover:bg-gray-100'
                        }`}
                        onClick={() => setSidebarOpen(false)}
                      >
                        <span className="mr-3">{item.icon}</span>
                        {item.label}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </nav>
          </div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Desktop sidebar */}
        <div className="hidden lg:flex lg:flex-shrink-0">
          <div className="flex flex-col w-64 border-r border-gray-200 bg-white">
            <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
              <div className="flex items-center flex-shrink-0 px-6">
                <img
                  className="h-8 w-auto"
                  src="/app/assets/Logo+611.png"
                  alt="Saxon Scout"
                />
                <span className="ml-3 text-xl font-bold text-gray-900">Saxon Scout</span>
              </div>
              <nav className="mt-8 flex-1 px-2 space-y-1">
                {navItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`group flex items-center px-4 py-3 text-sm font-medium rounded-lg ${
                      isActive(item.path)
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <span className="mr-3 text-lg">{item.icon}</span>
                    {item.label}
                  </Link>
                ))}

                {/* Admin section */}
                {scouter?.endsWith('@saxonrobotics.org') && (
                  <div className="mt-8 pt-8 border-t border-gray-200">
                    <h3 className="px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Admin
                    </h3>
                    <div className="mt-2 space-y-1">
                      {adminNavItems.map((item) => (
                        <Link
                          key={item.path}
                          to={item.path}
                          className={`group flex items-center px-4 py-3 text-sm font-medium rounded-lg ${
                            isActive(item.path)
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'text-gray-700 hover:bg-gray-100'
                          }`}
                        >
                          <span className="mr-3 text-lg">{item.icon}</span>
                          {item.label}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </nav>
            </div>
            {scouter && (
              <div className="flex-shrink-0 flex border-t border-gray-200 p-4">
                <div className="flex items-center">
                  <div className="h-9 w-9 rounded-full bg-yellow-100 flex items-center justify-center text-yellow-800 font-medium">
                    {scouter.charAt(0).toUpperCase()}
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-700">{scouter}</p>
                    <button
                      onClick={onLogout}
                      className="text-xs font-medium text-gray-500 hover:text-gray-700"
                    >
                      Sign out
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 overflow-auto focus:outline-none">
          <main className="flex-1 relative pb-8 z-0 overflow-y-auto">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

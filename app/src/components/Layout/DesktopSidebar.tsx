import type React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faHome, 
  faBolt, 
  faRobot, 
  faUsers, 
  faChess, 
  faChartLine, 
  faCalendar, 
  faFileExport, 
  faShieldAlt, 
  faCog,
  faChevronLeft,
  faChevronRight,
  faSignOutAlt,
  faCheckCircle
} from '@fortawesome/free-solid-svg-icons';
import type { DirHandle } from '../../lib/fsStore';

interface NavItem {
  path: string;
  icon: typeof faHome;
  label: string;
  requiresAuth?: boolean;
  adminOnly?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { path: '/', icon: faHome, label: 'Home' },
  { path: '/quick', icon: faBolt, label: 'Quick Scout', requiresAuth: true },
  { path: '/pit', icon: faRobot, label: 'Pit Scouting', requiresAuth: true },
  { path: '/info', icon: faChartLine, label: 'Data Viewer', requiresAuth: true },
];

const STRATEGY_ITEMS: NavItem[] = [
  { path: '/alliance', icon: faUsers, label: 'Alliance Selection', requiresAuth: true },
  { path: '/match-planning', icon: faChess, label: 'Match Planning', requiresAuth: true },
  { path: '/schedule', icon: faCalendar, label: 'Event Schedule', requiresAuth: true },
  { path: '/analytics', icon: faChartLine, label: 'Analytics', requiresAuth: true },
];

const ADMIN_ITEMS: NavItem[] = [
  { path: '/export', icon: faFileExport, label: 'Export Data', requiresAuth: true, adminOnly: true },
  { path: '/admin', icon: faShieldAlt, label: 'Admin Portal', requiresAuth: true, adminOnly: true },
];

const SETTINGS_ITEMS: NavItem[] = [
  { path: '/settings', icon: faCog, label: 'Settings' },
];

interface DesktopSidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  onLogout: () => void;
  scouter: string;
  root: DirHandle | null;
  isAdmin?: boolean;
}

export const DesktopSidebar: React.FC<DesktopSidebarProps> = ({
  collapsed,
  onToggle,
  onLogout,
  scouter,
  root,
  isAdmin = false,
}) => {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path: string): boolean => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  const renderNavItem = (item: NavItem) => {
    const active = isActive(item.path);
    
    return (
      <li key={item.path} className="nav-item">
        <button
          onClick={() => navigate(item.path)}
          className={`nav-link d-flex align-items-center w-100 border-0 text-start ${
            active ? 'active' : ''
          }`}
          style={{
            padding: collapsed ? '0.75rem' : '0.75rem 1rem',
            color: active ? 'var(--brand-primary)' : 'var(--color-text-primary)',
            backgroundColor: active ? 'rgba(255, 215, 0, 0.1)' : 'transparent',
            borderLeft: active ? '3px solid var(--brand-primary)' : '3px solid transparent',
            transition: 'all 0.2s ease',
          }}
          aria-current={active ? 'page' : undefined}
        >
          <FontAwesomeIcon 
            icon={item.icon} 
            style={{ 
              fontSize: '18px',
              width: collapsed ? 'auto' : '24px',
              marginRight: collapsed ? 0 : '12px'
            }} 
          />
          {!collapsed && <span>{item.label}</span>}
        </button>
      </li>
    );
  };

  const renderNavGroup = (title: string, items: NavItem[]) => {
    const filteredItems = items.filter(item => 
      (!item.requiresAuth || scouter) && 
      (!item.adminOnly || isAdmin)
    );

    if (filteredItems.length === 0) return null;

    return (
      <div className="mb-3">
        {!collapsed && (
          <h6 
            className="text-uppercase text-muted px-3 mb-2" 
            style={{ fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.05em' }}
          >
            {title}
          </h6>
        )}
        <ul className="nav flex-column">
          {filteredItems.map(renderNavItem)}
        </ul>
      </div>
    );
  };

  return (
    <aside
      className="d-none d-md-flex flex-column bg-white border-end position-fixed"
      style={{
        width: collapsed ? '80px' : '260px',
        height: '100vh',
        top: 0,
        left: 0,
        transition: 'width 0.3s ease',
        zIndex: 1020,
      }}
    >
      {/* Header */}
      <div className="d-flex align-items-center justify-content-between p-3 border-bottom">
        <div className="d-flex align-items-center">
          <div 
            className="d-flex align-items-center justify-content-center rounded"
            style={{
              width: '40px',
              height: '40px',
              backgroundColor: 'var(--brand-primary)',
              color: 'white',
            }}
          >
            <FontAwesomeIcon icon={faShieldAlt} style={{ fontSize: '20px' }} />
          </div>
          {!collapsed && (
            <div className="ms-3">
              <h5 className="mb-0" style={{ fontSize: '1.125rem', fontWeight: 600 }}>
                Saxon Scout
              </h5>
              <small className="text-muted">Team 611</small>
            </div>
          )}
        </div>
        <button
          onClick={onToggle}
          className="btn btn-sm btn-link text-muted p-1"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <FontAwesomeIcon icon={collapsed ? faChevronRight : faChevronLeft} />
        </button>
      </div>

      {/* Navigation */}
      <div className="flex-grow-1 overflow-auto py-3">
        {renderNavGroup('Main', NAV_ITEMS)}
        {renderNavGroup('Strategy', STRATEGY_ITEMS)}
        {renderNavGroup('Admin', ADMIN_ITEMS)}
        {renderNavGroup('System', SETTINGS_ITEMS)}
      </div>

      {/* Footer */}
      <div className="border-top p-3">
        {/* Connection Status */}
        {root && !collapsed && (
          <div className="alert alert-success py-2 px-3 mb-2 d-flex align-items-center" style={{ fontSize: '0.875rem' }}>
            <FontAwesomeIcon icon={faCheckCircle} className="me-2" />
            <span>Folder Connected</span>
          </div>
        )}

        {/* User Info */}
        <div className="d-flex align-items-center justify-content-between">
          <div className="d-flex align-items-center flex-grow-1">
            <div
              className="d-flex align-items-center justify-content-center rounded-circle text-white"
              style={{
                width: '36px',
                height: '36px',
                backgroundColor: 'var(--brand-primary)',
                fontSize: '0.875rem',
                fontWeight: 600,
              }}
            >
              {scouter ? scouter.charAt(0).toUpperCase() : 'U'}
            </div>
            {!collapsed && (
              <div className="ms-2 flex-grow-1">
                <div style={{ fontSize: '0.875rem', fontWeight: 500 }}>
                  {scouter || 'Guest'}
                </div>
                <button
                  onClick={onLogout}
                  className="btn btn-link p-0 text-muted text-decoration-none"
                  style={{ fontSize: '0.75rem' }}
                >
                  <FontAwesomeIcon icon={faSignOutAlt} className="me-1" />
                  Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
};

export default DesktopSidebar;
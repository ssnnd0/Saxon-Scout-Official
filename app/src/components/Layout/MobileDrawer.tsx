import type React from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faUsers, 
  faChess, 
  faCalendar, 
  faChartBar, 
  faFileExport, 
  faShieldAlt,
  faUsersCog,
  faCog,
  faTimes
} from '@fortawesome/free-solid-svg-icons';

interface DrawerItem {
  path: string;
  icon: typeof faUsers;
  label: string;
  adminOnly?: boolean;
}

const DRAWER_ITEMS: DrawerItem[] = [
  { path: '/alliance', icon: faUsers, label: 'Alliance Selection' },
  { path: '/match-planning', icon: faChess, label: 'Match Planning' },
  { path: '/schedule', icon: faCalendar, label: 'Event Schedule' },
  { path: '/analytics', icon: faChartBar, label: 'Analytics' },
  { path: '/export', icon: faFileExport, label: 'Export Data', adminOnly: true },
  { path: '/admin', icon: faShieldAlt, label: 'Admin Portal', adminOnly: true },
  { path: '/users', icon: faUsersCog, label: 'User Management', adminOnly: true },
  { path: '/settings', icon: faCog, label: 'Settings' },
];

interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  isAdmin?: boolean;
}

export const MobileDrawer: React.FC<MobileDrawerProps> = ({ isOpen, onClose, isAdmin = false }) => {
  const navigate = useNavigate();

  const handleNavClick = (path: string) => {
    navigate(path);
    onClose();
  };

  const filteredItems = DRAWER_ITEMS.filter(item => !item.adminOnly || isAdmin);

  return (
    <>
      {/* Backdrop */}
      <div
        className={`position-fixed top-0 start-0 w-100 h-100 bg-dark ${isOpen ? 'd-block' : 'd-none'}`}
        style={{
          opacity: isOpen ? 0.5 : 0,
          transition: 'opacity 0.3s ease',
          zIndex: 1040,
        }}
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className="position-fixed top-0 end-0 h-100 bg-white shadow-lg d-md-none"
        style={{
          width: '280px',
          transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.3s ease',
          zIndex: 1050,
          paddingTop: 'env(safe-area-inset-top)',
        }}
      >
        {/* Header */}
        <div className="d-flex align-items-center justify-content-between p-3 border-bottom">
          <h5 className="mb-0" style={{ fontWeight: 600 }}>Menu</h5>
          <button
            onClick={onClose}
            className="btn btn-link text-dark p-1"
            aria-label="Close menu"
          >
            <FontAwesomeIcon icon={faTimes} style={{ fontSize: '1.25rem' }} />
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="p-2">
          <ul className="nav flex-column">
            {filteredItems.map((item) => (
              <li key={item.path} className="nav-item">
                <button
                  onClick={() => handleNavClick(item.path)}
                  className="nav-link d-flex align-items-center w-100 border-0 text-start"
                  style={{
                    padding: '0.75rem 1rem',
                    color: 'var(--color-text-primary)',
                    transition: 'background-color 0.2s ease',
                  }}
                >
                  <FontAwesomeIcon 
                    icon={item.icon} 
                    style={{ 
                      fontSize: '18px',
                      width: '24px',
                      marginRight: '12px',
                      color: 'var(--color-text-secondary)'
                    }} 
                  />
                  <span>{item.label}</span>
                </button>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </>
  );
};

export default MobileDrawer;
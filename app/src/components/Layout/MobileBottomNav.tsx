import type React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHome, faBolt, faChartLine, faRobot, faEllipsisH } from '@fortawesome/free-solid-svg-icons';

interface NavItem {
  path: string;
  icon: typeof faHome;
  label: string;
}

const PRIMARY_NAV_ITEMS: NavItem[] = [
  { path: '/', icon: faHome, label: 'Home' },
  { path: '/quick', icon: faBolt, label: 'Scout' },
  { path: '/info', icon: faChartLine, label: 'Data' },
  { path: '/pit', icon: faRobot, label: 'Pit' },
  { path: '/more', icon: faEllipsisH, label: 'More' },
];

interface MobileBottomNavProps {
  onMoreClick: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({ onMoreClick }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path: string): boolean => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  const handleNavClick = (path: string) => {
    if (path === '/more') {
      onMoreClick();
    } else {
      navigate(path);
    }
  };

  return (
    <nav 
      className="fixed-bottom bg-white border-top d-md-none" 
      style={{ 
        paddingBottom: 'env(safe-area-inset-bottom)',
        boxShadow: '0 -2px 10px rgba(0,0,0,0.1)',
        zIndex: 1030
      }}
    >
      <div className="d-flex justify-content-around align-items-center" style={{ height: '64px' }}>
        {PRIMARY_NAV_ITEMS.map((item) => {
          const active = isActive(item.path);
          return (
            <button
              key={item.path}
              onClick={() => handleNavClick(item.path)}
              className="btn btn-link text-decoration-none d-flex flex-column align-items-center justify-content-center flex-fill border-0"
              style={{
                minHeight: '48px',
                color: active ? 'var(--brand-primary)' : 'var(--color-text-secondary)',
                backgroundColor: 'transparent',
                transition: 'color 0.2s ease',
              }}
              aria-label={item.label}
              aria-current={active ? 'page' : undefined}
            >
              <FontAwesomeIcon 
                icon={item.icon} 
                style={{ 
                  fontSize: '20px',
                  marginBottom: '2px'
                }} 
              />
              <span 
                style={{ 
                  fontSize: '11px',
                  fontWeight: active ? 600 : 400,
                  marginTop: '2px'
                }}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default MobileBottomNav;
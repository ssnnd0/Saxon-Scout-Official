import type React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBars, faCheckCircle } from '@fortawesome/free-solid-svg-icons';
import type { DirHandle } from '../../lib/fsStore';

interface ResponsiveHeaderProps {
  title: string;
  onMenuClick: () => void;
  root: DirHandle | null;
  scouter: string;
}

export const ResponsiveHeader: React.FC<ResponsiveHeaderProps> = ({
  title,
  onMenuClick,
  root,
  scouter,
}) => {
  return (
    <header 
      className="bg-white border-bottom sticky-top" 
      style={{ 
        zIndex: 1010,
        paddingTop: 'env(safe-area-inset-top)'
      }}
    >
      <div className="container-fluid">
        <div className="d-flex align-items-center justify-content-between" style={{ height: '56px' }}>
          {/* Left: Menu button (mobile) + Title */}
          <div className="d-flex align-items-center">
            <button
              onClick={onMenuClick}
              className="btn btn-link text-dark d-md-none p-2 me-2"
              aria-label="Open menu"
              style={{ fontSize: '1.25rem' }}
            >
              <FontAwesomeIcon icon={faBars} />
            </button>
            <h1 className="mb-0" style={{ fontSize: '1.125rem', fontWeight: 600 }}>
              {title}
            </h1>
          </div>

          {/* Right: Status indicators */}
          <div className="d-flex align-items-center gap-3">
            {root && (
              <div className="d-none d-sm-flex align-items-center text-success" style={{ fontSize: '0.875rem' }}>
                <FontAwesomeIcon icon={faCheckCircle} className="me-1" />
                <span className="d-none d-lg-inline">Connected</span>
              </div>
            )}
            <div className="d-none d-sm-block" style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
              {scouter || 'Guest'}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default ResponsiveHeader;
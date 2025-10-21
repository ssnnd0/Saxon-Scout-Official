import type React from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faBolt, 
  faRobot, 
  faChartLine, 
  faUsers, 
  faClipboardList, 
  faCalendar, 
  faChartBar, 
  faDownload,
  faWifi,
  faDatabase,
  faShieldAlt,
  faTrophy
} from '@fortawesome/free-solid-svg-icons';

interface HomeProps {
  navigate: (view: string) => void;
}

const Home: React.FC<HomeProps> = ({ navigate: propNavigate }) => {
  const navigate = useNavigate();
  
  const modules = [
    {
      id: 'quick',
      icon: faBolt,
      title: 'Match Scouting',
      description: 'Rapid match data collection',
      color: 'primary'
    },
    {
      id: 'pit',
      icon: faRobot,
      title: 'Pit Scouting',
      description: 'Robot capability assessment',
      color: 'secondary'
    },
    {
      id: 'info',
      icon: faChartLine,
      title: 'Data Analysis',
      description: 'Strategic insights and visualizations',
      color: 'success'
    },
    {
      id: 'alliance',
      icon: faUsers,
      title: 'Alliance Selection',
      description: 'Team recommendations',
      color: 'warning'
    },
    {
      id: 'match-planning',
      icon: faClipboardList,
      title: 'Match Planning',
      description: 'Strategy and role assignment',
      color: 'danger'
    },
    {
      id: 'schedule',
      icon: faCalendar,
      title: 'Event Schedule',
      description: 'Match schedules from TBA',
      color: 'info'
    },
    {
      id: 'analytics',
      icon: faChartBar,
      title: 'Analytics',
      description: 'Performance metrics',
      color: 'dark'
    },
    {
      id: 'export',
      icon: faDownload,
      title: 'Data Export',
      description: 'Export and share data',
      color: 'secondary'
    }
  ];

  const statusCards = [
    {
      icon: faWifi,
      title: 'ONLINE',
      description: 'Server Connected',
      color: 'success'
    },
    {
      icon: faDatabase,
      title: 'SECURE',
      description: 'Data Protected',
      color: 'primary'
    },
    {
      icon: faShieldAlt,
      title: 'READY',
      description: 'Competition Mode',
      color: 'warning'
    },
    {
      icon: faTrophy,
      title: 'VICTORY',
      description: 'Team 611',
      color: 'dark'
    }
  ];

  return (
    <>
      {/* Hero Section */}
      <div className="card shadow-sm mb-4">
        <div className="card-body">
          <div className="row align-items-center g-4">
            <div className="col-lg-7">
              <div className="d-flex align-items-center mb-3">
                <div 
                  className="d-flex align-items-center justify-content-center rounded me-3"
                  style={{
                    width: '56px',
                    height: '56px',
                    backgroundColor: 'var(--brand-primary)',
                    color: 'white'
                  }}
                >
                  <FontAwesomeIcon icon={faShieldAlt} style={{ fontSize: '1.75rem' }} />
                </div>
                <div>
                  <h1 className="h2 mb-1" style={{ fontWeight: 700 }}>SAXON SCOUT</h1>
                  <div className="d-flex gap-2">
                    <span className="badge bg-warning text-dark">TEAM 611</span>
                    <span className="badge bg-secondary">v2.1</span>
                  </div>
                </div>
              </div>
              <p className="lead text-muted mb-0">
                Advanced FRC scouting platform for competitive advantage
              </p>
            </div>
            <div className="col-lg-5">
              <div className="bg-light rounded p-4 text-center">
                <div className="h2 mb-1" style={{ fontWeight: 700 }}>FRC 2025</div>
                <div className="h4 mb-3" style={{ color: 'var(--brand-primary)', fontWeight: 700 }}>
                  REEFSCAPE
                </div>
                <span className="badge bg-success">
                  <FontAwesomeIcon icon={faWifi} className="me-1" />
                  Competition Ready
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Module Grid */}
      <div className="row g-3 mb-4">
        {modules.map((module) => (
          <div key={module.id} className="col-sm-6 col-lg-3">
            <div 
              className={`card h-100 border-start border-${module.color} border-3 shadow-sm`}
              style={{ cursor: 'pointer', transition: 'all 0.2s ease' }}
              onClick={() => navigate(`/${module.id}`)}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 0.5rem 1rem rgba(0,0,0,0.15)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 0.125rem 0.25rem rgba(0,0,0,0.075)';
              }}
            >
              <div className="card-body d-flex flex-column">
                <div className="d-flex align-items-start mb-3">
                  <div 
                    className={`d-flex align-items-center justify-content-center rounded bg-${module.color} bg-opacity-10 me-3`}
                    style={{ width: '48px', height: '48px', flexShrink: 0 }}
                  >
                    <FontAwesomeIcon 
                      icon={module.icon} 
                      className={`text-${module.color}`}
                      style={{ fontSize: '1.5rem' }} 
                    />
                  </div>
                  <div>
                    <h5 className="card-title mb-1" style={{ fontSize: '1rem', fontWeight: 600 }}>
                      {module.title}
                    </h5>
                    <p className="card-text text-muted small mb-0">
                      {module.description}
                    </p>
                  </div>
                </div>
                <button 
                  className={`btn btn-outline-${module.color} btn-sm mt-auto w-100`}
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/${module.id}`);
                  }}
                >
                  LAUNCH
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Status Panel */}
      <div className="card shadow-sm">
        <div className="card-header bg-white">
          <div className="d-flex align-items-center">
            <FontAwesomeIcon icon={faShieldAlt} className="text-warning me-2" />
            <h5 className="mb-0" style={{ fontWeight: 600 }}>SYSTEM STATUS</h5>
          </div>
        </div>
        <div className="card-body">
          <div className="row g-3">
            {statusCards.map((card, index) => (
              <div key={index} className="col-sm-6 col-lg-3">
                <div className="text-center p-3 bg-light rounded">
                  <div 
                    className={`d-flex align-items-center justify-content-center rounded-circle bg-${card.color} text-white mx-auto mb-3`}
                    style={{ width: '56px', height: '56px' }}
                  >
                    <FontAwesomeIcon icon={card.icon} style={{ fontSize: '1.5rem' }} />
                  </div>
                  <div className={`fw-bold text-${card.color} mb-1`}>
                    {card.title}
                  </div>
                  <div className="small text-muted">
                    {card.description}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};

export default Home;
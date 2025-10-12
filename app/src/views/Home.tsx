// @ts-nocheck
import * as Inferno from 'inferno';
import { FC } from 'inferno';

interface HomeProps {
  navigate: (view: string) => void;
}

const Home: FC<HomeProps> = ({ navigate }) => {
  const modules = [
    {
      id: 'quick',
      icon: 'fa-bolt',
      title: 'Quick Scout',
      description: 'Fast match scoring with a large target grid designed for rapid input during matches.',
      color: 'primary',
      bgGradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    },
    {
      id: 'pit',
      icon: 'fa-tools',
      title: 'Pit Scout',
      description: 'Record robot capabilities, drivetrain type, climb ability, and other pit observations.',
      color: 'info',
      bgGradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'
    },
    {
      id: 'info',
      icon: 'fa-chart-line',
      title: 'View Info',
      description: 'Analyze collected data with summaries, charts, and quick team insights.',
      color: 'success',
      bgGradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)'
    },
    {
      id: 'export',
      icon: 'fa-file-archive',
      title: 'Export Data',
      description: 'Export matches and pit data as CSV inside a ZIP for analysis or submission.',
      color: 'warning',
      bgGradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)'
    }
  ];

  return (
    <div>
      <div className="mb-4">
        <h2 className="fw-bold mb-2">
          <i className="fa fa-home me-2 text-primary"></i>
          Welcome Back
        </h2>
        <p className="text-muted">Select a module to get started with your scouting session.</p>
      </div>

      <div className="home-grid">
        {modules.map(module => (
          <div 
            key={module.id} 
            className="card home-card card-modern home-card-hover"
            style={{ 
              borderTop: '4px solid transparent',
              borderImage: module.bgGradient + ' 1',
              transition: 'all 0.3s ease'
            }}
          >
            <div 
              className="home-card-icon-wrapper" 
              style={{ 
                background: module.bgGradient,
                marginBottom: '1rem'
              }}
            >
              <i className={`fa ${module.icon} text-white`} style={{ fontSize: '1.5rem' }}></i>
            </div>

            <div className="flex-grow-1">
              <h5 className="fw-bold mb-2" style={{ color: '#212529' }}>
                {module.title}
              </h5>
              <p className="muted-small mb-0" style={{ fontSize: '0.95rem', color: '#6c757d' }}>
                {module.description}
              </p>
            </div>

            <div className="mt-3 w-100">
              <button
                className={`btn btn-${module.color} w-100 d-flex align-items-center justify-content-center gap-2`}
                onClick={() => navigate(module.id)}
                style={{ fontWeight: '500', padding: '0.5rem 1rem', minHeight: '40px' }}
              >
                <span>Open</span>
                <i className="fa fa-arrow-right"></i>
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="alert alert-light border mt-4" style={{ borderRadius: '8px' }}>
        <i className="fa fa-info-circle me-2 text-primary"></i>
        <strong>Tip:</strong> Use the buttons above to navigate between different scouting modes. All data is stored locally on your device.
      </div>
    </div>
  );
};

export default Home;
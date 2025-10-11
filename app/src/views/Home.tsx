// @ts-nocheck
import * as Inferno from 'inferno';
import { FC } from 'inferno';

interface HomeProps {
  navigate: (view: string) => void;
}

/**
 * Home (kiosk) screen presenting primary actions. Each button navigates to a
 * different view (Quick Scout, Pit Scout, Info Viewer, Export, Settings).
 */
const Home: FC<HomeProps> = ({ navigate }) => {
  const modules = [
    {
      id: 'quick',
      icon: 'fa-bolt',
      title: 'Quick Scout',
      description: 'Fast match scoring with a large target grid designed for rapid input on mobile devices.',
      color: 'primary',
      gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    },
    {
      id: 'pit',
      icon: 'fa-tools',
      title: 'Pit Scout',
      description: 'Record robot capabilities, drivetrain, climb ability and notes for scouting analysis.',
      color: 'info',
      gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'
    },
    {
      id: 'info',
      icon: 'fa-chart-line',
      title: 'View Info',
      description: 'Summaries, charts and quick team insights from collected match data.',
      color: 'success',
      gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)'
    },
    {
      id: 'export',
      icon: 'fa-file-archive',
      title: 'Export Data',
      description: 'Export matches and pit data as CSV inside a ZIP for analysis or event submission.',
      color: 'warning',
      gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)'
    },
    {
      id: 'settings',
      icon: 'fa-cog',
      title: 'Settings',
      description: 'Configure app preferences and integrations.',
      color: 'secondary',
      gradient: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
      disabled: true
    }
  ];

  return (
    <div>
      <div className="mb-4">
        <h2 className="fw-bold mb-2">Welcome Back</h2>
        <p className="text-muted">Select a module to get started with your scouting session.</p>
      </div>
      <div className="home-grid">
        {modules.map(module => (
          <div key={module.id} className="card home-card card-modern home-card-hover" style={{ borderTop: `4px solid transparent`, borderImage: module.gradient, borderImageSlice: 1 }}>
            <div className="home-card-icon-wrapper" style={{ background: module.gradient }}>
              <i className={`fa ${module.icon} text-white`}></i>
            </div>
            <div className="flex-grow-1">
              <h5 className="fw-bold mb-2">{module.title}</h5>
              <p className="muted-small mb-0">{module.description}</p>
            </div>
            <div className="mt-3 w-100">
              {module.disabled ? (
                <button className="btn btn-secondary w-100" disabled>
                  <span>Coming Soon</span>
                </button>
              ) : (
                <button
                  className={`btn btn-${module.color} w-100 d-flex align-items-center justify-content-center gap-2`}
                  onClick={() => navigate(module.id)}
                >
                  <span>Open</span>
                  <i className="fa fa-arrow-right"></i>
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Home;
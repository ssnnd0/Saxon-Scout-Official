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
  return (
    <div className="home-grid">
      <div className="card home-card">
        <div>
          <i className="fa fa-bolt"></i>
        </div>
        <div>
          <h5>Quick Scout</h5>
          <p className="muted-small">Fast match scoring with a large target grid—designed for rapid input on mobile devices.</p>
        </div>
        <div className="mt-auto w-100">
          <button className="btn btn-primary w-100" onClick={() => navigate('quick')}>Open</button>
        </div>
      </div>

      <div className="card home-card">
        <div><i className="fa fa-tools"></i></div>
        <div>
          <h5>Pit Scout</h5>
          <p className="muted-small">Record robot capabilities, drivetrain, climb ability and notes for scouting analysis.</p>
        </div>
        <div className="mt-auto w-100"><button className="btn btn-info w-100" onClick={() => navigate('pit')}>Open</button></div>
      </div>

      <div className="card home-card">
        <div><i className="fa fa-chart-bar"></i></div>
        <div>
          <h5>View Info</h5>
          <p className="muted-small">Summaries, charts and quick team insights from collected match data.</p>
        </div>
        <div className="mt-auto w-100"><button className="btn btn-success w-100" onClick={() => navigate('info')}>Open</button></div>
      </div>

      <div className="card home-card">
        <div><i className="fa fa-file-archive"></i></div>
        <div>
          <h5>Export</h5>
          <p className="muted-small">Export matches and pit data as CSV inside a ZIP for analysis or event submission.</p>
        </div>
        <div className="mt-auto w-100"><button className="btn btn-warning w-100" onClick={() => navigate('export')}>Open</button></div>
      </div>

      <div className="card home-card">
        <div><i className="fa fa-cog"></i></div>
        <div>
          <h5>Settings</h5>
          <p className="muted-small">Configure app preferences and integrations (coming soon).</p>
        </div>
        <div className="mt-auto w-100"><button className="btn btn-secondary w-100" onClick={() => navigate('settings')}>Open</button></div>
      </div>
    </div>
  );
};

export default Home;
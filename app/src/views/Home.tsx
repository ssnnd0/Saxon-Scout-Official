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
    <div className="d-grid gap-3">
      <button className="btn btn-primary btn-lg" onClick={() => navigate('quick')}>Quick Scout</button>
      <button className="btn btn-info btn-lg" onClick={() => navigate('pit')}>Pit Scout</button>
      <button className="btn btn-success btn-lg" onClick={() => navigate('info')}>View Info</button>
      <button className="btn btn-warning btn-lg" onClick={() => navigate('export')}>Export</button>
      <button className="btn btn-secondary btn-lg" onClick={() => navigate('settings')}>Settings</button>
    </div>
  );
};

export default Home;
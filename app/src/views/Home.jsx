/**
 * Home (kiosk) screen presenting primary actions. Each button navigates to a
 * different view (Quick Scout, Pit Scout, Info Viewer, Export, Settings).
 */
const Home = ({ navigate }) => {
    return (<div class="d-grid gap-3">
      <button class="btn btn-primary btn-lg" onClick={() => navigate('quick')}>Quick Scout</button>
      <button class="btn btn-info btn-lg" onClick={() => navigate('pit')}>Pit Scout</button>
      <button class="btn btn-success btn-lg" onClick={() => navigate('info')}>View Info</button>
      <button class="btn btn-warning btn-lg" onClick={() => navigate('export')}>Export</button>
      <button class="btn btn-secondary btn-lg" onClick={() => navigate('settings')}>Settings</button>
    </div>);
};
export default Home;

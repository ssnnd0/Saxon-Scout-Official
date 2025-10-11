// @ts-nocheck
import { render } from 'inferno';
import App from './views/App';
import 'bootstrap/dist/css/bootstrap.min.css';
// Mount the Inferno application to the root div. This file is the entry point
// for the SPA and pulls in global CSS such as Bootstrap. When bundling
// the app (e.g. via Vite or Webpack), this will ensure the appropriate CSS
// is included in the final bundle.
render(<App />, document.getElementById('root'));

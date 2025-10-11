// @ts-nocheck
import * as Inferno from 'inferno';
import { render } from 'inferno';
import App from './views/App';

// Mount the Inferno application to the root div. This file is the entry point
// for the SPA and pulls in global CSS such as Bootstrap. Adding a top-level
// `Inferno` import lets bundlers (esbuild) transform JSX to calls into the
// Inferno runtime (we configure the JSX factory to use `Inferno.createVNode`).

console.log('Starting Saxon Scout application...');
console.log('Root element:', document.getElementById('root'));
render(<App />, document.getElementById('root')!);
console.log('App rendered successfully');

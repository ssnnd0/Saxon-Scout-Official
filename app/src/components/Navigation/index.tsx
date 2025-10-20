import React, { Suspense, ComponentType, FC } from 'react';
import { useNavigate } from 'react-router-dom';
import { DirHandle } from '../../lib/fsStore';
import LoadingSpinner from '../LoadingSpinner';

// Import components with proper typing
const Home = React.lazy(() => import('../../views/Home'));
const PitScout = React.lazy(() => import('../../views/PitScout'));
const Export = React.lazy(() => import('../../views/Export'));
const Settings = React.lazy(() => import('../../views/Settings'));

// Component props interfaces
interface HomeProps {
  navigate: (path: string) => void;
}

interface PitScoutProps {
  root: DirHandle | null;
  scouter: string;
  navigateHome: () => void;
}

interface ExportProps {
  root: DirHandle | null;
  navigateHome: () => void;
}

interface SettingsProps {
  navigateHome: () => void;
}

// Higher-order component for adding Suspense and proper typing
function withSuspense<P extends object>(
  WrappedComponent: ComponentType<P>
): FC<P> {
  const WithSuspense: FC<P> = (props) => (
    <Suspense fallback={<LoadingSpinner />}>
      <WrappedComponent {...props} />
    </Suspense>
  );
  return WithSuspense;
}

// Home component with navigation
const HomeWithNavigation = withSuspense<HomeProps>(() => {
  const navigate = useNavigate();
  return <Home navigate={navigate} />;
});

// PitScout component with navigation
const PitScoutWithNavigation = withSuspense<PitScoutProps>(({ root, scouter }) => {
  const navigate = useNavigate();
  return <PitScout root={root} scouter={scouter} navigateHome={() => navigate('/')} />;
});

// Export component with navigation
const ExportWithNavigation = withSuspense<ExportProps>(({ root }) => {
  const navigate = useNavigate();
  return <Export root={root} navigateHome={() => navigate('/')} />;
});

// Settings component with navigation
const SettingsWithNavigation = withSuspense<SettingsProps>(() => {
  const navigate = useNavigate();
  return <Settings navigateHome={() => navigate('/')} />;
});

export {
  HomeWithNavigation,
  PitScoutWithNavigation,
  ExportWithNavigation,
  SettingsWithNavigation
};

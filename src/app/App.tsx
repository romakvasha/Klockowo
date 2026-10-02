import { HashRouter } from 'react-router';
import { AppErrorBoundary } from './AppErrorBoundary';
import { AppRoutes } from './AppRoutes';
import { MusicRouteSync } from './MusicRouteSync';
import { RouteTransition } from './RouteTransition';
import { SettingsSync } from './SettingsSync';

export function App() {
  return (
    <HashRouter>
      <SettingsSync />
      <MusicRouteSync />
      <RouteTransition>
        <AppErrorBoundary>
          <AppRoutes />
        </AppErrorBoundary>
      </RouteTransition>
    </HashRouter>
  );
}

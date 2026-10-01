import { HashRouter } from 'react-router';
import { AppRoutes } from './AppRoutes';
import { MusicRouteSync } from './MusicRouteSync';

export function App() {
  return (
    <HashRouter>
      <MusicRouteSync />
      <AppRoutes />
    </HashRouter>
  );
}

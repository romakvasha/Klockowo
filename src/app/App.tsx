import { HashRouter } from 'react-router';
import { AppRoutes } from './AppRoutes';
import { MusicRouteSync } from './MusicRouteSync';
import { SettingsSync } from './SettingsSync';

export function App() {
  return (
    <HashRouter>
      <SettingsSync />
      <MusicRouteSync />
      <AppRoutes />
    </HashRouter>
  );
}

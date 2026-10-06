import { HashRouter } from 'react-router';
import { useLanguage } from '../speech/language';
import { AppErrorBoundary } from './AppErrorBoundary';
import { AppRoutes } from './AppRoutes';
import { MusicRouteSync } from './MusicRouteSync';
import { RouteTransition } from './RouteTransition';
import { SettingsSync } from './SettingsSync';

export function App() {
  // зміна мови гри перемонтовує екрани: усе перечитується вже новими таблицями рядків, сценарії голосу стартують наново
  const language = useLanguage();
  return (
    <HashRouter>
      <SettingsSync />
      <MusicRouteSync />
      <RouteTransition>
        <AppErrorBoundary key={language}>
          <AppRoutes />
        </AppErrorBoundary>
      </RouteTransition>
    </HashRouter>
  );
}

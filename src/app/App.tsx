import { HashRouter } from 'react-router';
import { AppRoutes } from './AppRoutes';

export function App() {
  return (
    <HashRouter>
      <AppRoutes />
    </HashRouter>
  );
}

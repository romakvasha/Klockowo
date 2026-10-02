import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './styles/fonts';
import './styles/tokens.css';
import './styles/global.css';
import './styles/responsive.css';
import './styles/motion.css';
import './styles/block.css';
import { App } from './app/App';
import { installAudioUnlock } from './speech/unlock';
import { registerOffline } from './app/registerOffline';
import { setLanguage } from './speech/language';
import { appStore } from './store';

const root = document.getElementById('root');
if (!root) throw new Error('#root not found');

// Звук і голос — лише після першого дотику
installAudioUnlock();
// Офлайн: service worker лише в production-збірці
registerOffline();
// Мова гри — ще до першого рендеру, щоб перший екран був одразу потрібною мовою (польська за замовчуванням)
setLanguage(appStore.getState().settings.language);

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

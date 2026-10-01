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

const root = document.getElementById('root');
if (!root) throw new Error('#root not found');

// Звук і голос — лише після першого дотику
installAudioUnlock();

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

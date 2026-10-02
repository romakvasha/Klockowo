import { Route, Routes } from 'react-router';
import { BlocksPage } from '../dev/blocks/BlocksPage';
import { CharactersPage } from '../dev/characters/CharactersPage';
import { DataPage } from '../dev/data/DataPage';
import { DevIndex } from '../dev/DevIndex';
import { DragPage } from '../dev/drag/DragPage';
import { GamesPage } from '../dev/games/GamesPage';
import { MissionPage } from '../dev/mission/MissionPage';
import { PathPage } from '../dev/path/PathPage';
import { RackPage } from '../dev/rack/RackPage';
import { SpeechPage } from '../dev/SpeechPage';
import { TokensPage } from '../dev/TokensPage';
import { FramePage } from '../dev/ui/FramePage';
import { UiPage } from '../dev/ui/UiPage';

/** Службові сторінки /#/dev/… — лише для розробки. AppRoutes підключає цей файл ліниво й тільки коли `import.meta.env.DEV`, тож у production-збірці (і в PWA на телефоні дитини) їх нема. */
export default function DevRoutes() {
  return (
    <Routes>
      <Route index element={<DevIndex />} />
      <Route path="tokens" element={<TokensPage />} />
      <Route path="speech" element={<SpeechPage />} />
      <Route path="ui" element={<UiPage />} />
      <Route path="characters" element={<CharactersPage />} />
      <Route path="data" element={<DataPage />} />
      <Route path="path" element={<PathPage />} />
      <Route path="drag" element={<DragPage />} />
      <Route path="games" element={<GamesPage />} />
      <Route path="rack" element={<RackPage />} />
      <Route path="blocks" element={<BlocksPage />} />
      <Route path="mission" element={<MissionPage />} />
      <Route path="ui-frame" element={<FramePage />} />
    </Routes>
  );
}

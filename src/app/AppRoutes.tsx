import type { ComponentType } from 'react';
import { Navigate, Route, Routes } from 'react-router';
import { DevIndex } from '../dev/DevIndex';
import { SpeechPage } from '../dev/SpeechPage';
import { TokensPage } from '../dev/TokensPage';
import { FramePage } from '../dev/ui/FramePage';
import { UiPage } from '../dev/ui/UiPage';
import { CharactersPage } from '../dev/characters/CharactersPage';
import { DataPage } from '../dev/data/DataPage';
import { DragPage } from '../dev/drag/DragPage';
import { MissionPage } from '../dev/mission/MissionPage';
import { PathPage } from '../dev/path/PathPage';
import { AdventureMap } from '../screens/AdventureMap';
import { Badges } from '../screens/Badges';
import { BreakTime } from '../screens/BreakTime';
import { EndOfDay } from '../screens/EndOfDay';
import { ErrorScreen } from '../screens/ErrorScreen';
import { GameScreen } from '../screens/GameScreen';
import { LevelComplete } from '../screens/LevelComplete';
import { Loading } from '../screens/Loading';
import { Mission } from '../screens/Mission';
import { NoVoice } from '../screens/NoVoice';
import { ParentGateScreen } from '../screens/ParentGateScreen';
import { ParentZone } from '../screens/ParentZone';
import { Playground } from '../screens/Playground';
import { PupChoice } from '../screens/PupChoice';
import { Start } from '../screens/Start';
import { StickerAlbum } from '../screens/StickerAlbum';
import { WorldComplete } from '../screens/WorldComplete';
import { WorldPath } from '../screens/WorldPath';
import { HOME_PATH, SCREENS, type ScreenId } from './routes';

// Record<ScreenId, …> змушує компілятор вимагати компонент для кожного екрана з таблиці.
const COMPONENTS: Record<ScreenId, ComponentType> = {
  loading: Loading,
  start: Start,
  'pup-choice': PupChoice,
  map: AdventureMap,
  'world-path': WorldPath,
  mission: Mission,
  game: GameScreen,
  'level-complete': LevelComplete,
  'world-complete': WorldComplete,
  album: StickerAlbum,
  badges: Badges,
  break: BreakTime,
  'end-of-day': EndOfDay,
  playground: Playground,
  'parent-gate': ParentGateScreen,
  'parent-zone': ParentZone,
  error: ErrorScreen,
  'no-voice': NoVoice,
};

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to={HOME_PATH} replace />} />
      {SCREENS.map(({ id, path }) => {
        const Screen = COMPONENTS[id];
        return <Route key={id} path={path} element={<Screen />} />;
      })}
      <Route path="/dev" element={<DevIndex />} />
      <Route path="/dev/tokens" element={<TokensPage />} />
      <Route path="/dev/speech" element={<SpeechPage />} />
      <Route path="/dev/ui" element={<UiPage />} />
      <Route path="/dev/characters" element={<CharactersPage />} />
      <Route path="/dev/data" element={<DataPage />} />
      <Route path="/dev/path" element={<PathPage />} />
      <Route path="/dev/drag" element={<DragPage />} />
      <Route path="/dev/mission" element={<MissionPage />} />
      <Route path="/dev/ui-frame" element={<FramePage />} />
      <Route path="*" element={<Navigate to={HOME_PATH} replace />} />
    </Routes>
  );
}

import { useEffect } from 'react';
import { useLocation } from 'react-router';
import { MUSIC_ENABLED, music } from '../speech/music';
import { isSilentRoute, musicRoute } from './musicRoute';

/** Єдина підписка на маршрут для музики: сцена (гра/решта) і світ; на перерві — тиша (isSilentRoute). Сама музика стартує лише після першого дотику. */
export function MusicRouteSync() {
  const { pathname } = useLocation();
  useEffect(() => {
    if (!MUSIC_ENABLED) return;
    const { scene, world, dev } = musicRoute(pathname);
    if (dev) return;
    if (isSilentRoute(pathname)) {
      music.stop();
      return;
    }
    music.setScene(scene);
    music.setWorld(world);
    music.start();
  }, [pathname]);
  return null;
}

// Офлайн-режим (M24): service worker реєструється лише в production-збірці й лише там, де браузер його підтримує. У розробці (npm run dev) SW вимкнено, щоб він не віддавав застарілі файли.
import { registerSW } from 'virtual:pwa-register';

export function registerOffline(): void {
  if (!import.meta.env.PROD || typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return;
  // autoUpdate: нова версія стає активною при наступному відкритті; повідомлень дитині не показуємо
  registerSW({ immediate: true });
}

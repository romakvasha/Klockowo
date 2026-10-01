// Реєстр dev-сторінок /#/dev/... (службові підписи українською — для власника, не для дитини).
// Новий етап додає сюди рядок і маршрут у app/AppRoutes.tsx.

export interface DevPage {
  path: string;
  title: string;
  /** етап PLAN.md, у якому сторінка з'являється */
  stage: string;
  ready: boolean;
}

export const DEV_PAGES: readonly DevPage[] = [
  { path: '/dev/tokens', title: 'Токени, шрифти, діакритика', stage: 'M1', ready: true },
  { path: '/dev/speech', title: 'Голос, звуки і музика: число + предмет → фраза → озвучення', stage: 'M2 · M2b', ready: true },
  { path: '/dev/ui', title: 'UI-компоненти зі станами (кнопки, плитки, HUD, бульбашка, Overlay, Toggle, Slider, аватар)', stage: 'M3', ready: true },
  { path: '/dev/characters', title: 'Персонажі: Kubik (17 поз, аксесуари, рот A/O/E), команда, 8 цуценят, MascotStage', stage: 'M4', ready: true },
];

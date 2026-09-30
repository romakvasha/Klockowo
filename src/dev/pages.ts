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
  { path: '/dev/speech', title: 'Голос: число + предмет → фраза → озвучення', stage: 'M2', ready: true },
  { path: '/dev/ui', title: 'UI-компоненти зі станами', stage: 'M3', ready: false },
  { path: '/dev/characters', title: 'Kubik, команда, цуценята', stage: 'M4', ready: false },
];

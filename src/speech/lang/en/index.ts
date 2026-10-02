// Пакет англійської мови для speech/language.ts.
import type { LanguagePack } from '../../language';
import { EN_LINES } from './lines';
import { EN_NOUNS } from './nouns';
import { numberWords } from './numbers';
import { EN_STORIES } from './stories';
import { EN_TEMPLATES } from './templates';

export const EN_PACK: LanguagePack = {
  lines: EN_LINES,
  templates: EN_TEMPLATES,
  nouns: EN_NOUNS,
  numberWords,
  stories: EN_STORIES,
};

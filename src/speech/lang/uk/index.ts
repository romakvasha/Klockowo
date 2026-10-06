// Пакет української мови для speech/language.ts.
import type { LanguagePack } from '../../language';
import { UK_LINES } from './lines';
import { UK_NOUNS } from './nouns';
import { numberWords } from './numbers';
import { UK_STORIES } from './stories';
import { UK_TEMPLATES } from './templates';

export const UK_PACK: LanguagePack = {
  lines: UK_LINES,
  templates: UK_TEMPLATES,
  nouns: UK_NOUNS,
  numberWords,
  stories: UK_STORIES,
};

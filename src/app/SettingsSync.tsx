import { useEffect } from 'react';
import { setLanguage } from '../speech/language';
import { music } from '../speech/music';
import { sfx } from '../speech/sfx';
import { tts } from '../speech/tts';
import { appStore } from '../store';
import { applySettings, setReduceMotionAttribute, type SettingsTargets } from './applySettings';

const targets: SettingsTargets = {
  tts,
  sfx,
  music,
  setReduceMotion: (on) => setReduceMotionAttribute(document.documentElement, on),
  setLanguage,
};

/** Єдина підписка на налаштування: застосовує їх при старті й після кожної зміни у Strefa rodzica. */
export function SettingsSync() {
  useEffect(() => {
    applySettings(appStore.getState().settings, targets);
    return appStore.subscribe((state, previous) => {
      if (state.settings !== previous.settings) applySettings(state.settings, targets);
    });
  }, []);
  return null;
}

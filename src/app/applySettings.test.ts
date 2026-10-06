import { describe, expect, it } from 'vitest';
import { defaultSettings } from '../store/defaults';
import { applySettings, setReduceMotionAttribute, type SettingsTargets } from './applySettings';

function fakeTargets() {
  const calls: string[] = [];
  const targets: SettingsTargets = {
    tts: {
      setRate: (r) => calls.push(`tts.rate ${r}`),
      setVolume: (v) => calls.push(`tts.volume ${v}`),
      setVoiceURI: (u) => calls.push(`tts.voice ${u}`),
    },
    sfx: { setVolume: (v) => calls.push(`sfx.volume ${v}`) },
    music: { setVolume: (v) => calls.push(`music.volume ${v}`) },
    setReduceMotion: (on) => calls.push(`reduceMotion ${on}`),
    setLanguage: (lang) => calls.push(`language ${lang}`),
  };
  return { calls, targets };
}

describe('applySettings', () => {
  it('типові налаштування: Mowa 80 %, Efekty 60 %, Muzyka 30 %, темп 0,9, автоголос', () => {
    const { calls, targets } = fakeTargets();
    applySettings(defaultSettings(), targets);
    expect(calls).toEqual(['language pl', 'tts.rate 0.9', 'tts.volume 0.8', 'tts.voice null', 'sfx.volume 0.6', 'music.volume 0.3', 'reduceMotion false']);
  });

  it('повзунки йдуть у свої цілі; обраний голос і «Mniej animacji» передаються', () => {
    const { calls, targets } = fakeTargets();
    applySettings(
      { ...defaultSettings(), speechRate: 1.1, voiceURI: 'urn:pl', reduceMotion: true, volumes: { speech: 1, effects: 0, music: 0.05 } },
      targets,
    );
    expect(calls).toEqual(['language pl', 'tts.rate 1.1', 'tts.volume 1', 'tts.voice urn:pl', 'sfx.volume 0', 'music.volume 0.05', 'reduceMotion true']);
  });

  it('мова гри застосовується першою — голос далі обирається вже для неї', () => {
    const { calls, targets } = fakeTargets();
    applySettings({ ...defaultSettings(), language: 'uk' }, targets);
    expect(calls[0]).toBe('language uk');
  });
});

describe('setReduceMotionAttribute', () => {
  it('ставить і знімає data-reduce-motion на кореневому елементі', () => {
    const root: { dataset: Record<string, string | undefined> } = { dataset: {} };
    setReduceMotionAttribute(root, true);
    expect(root.dataset.reduceMotion).toBe('true');
    setReduceMotionAttribute(root, false);
    expect('reduceMotion' in root.dataset).toBe(false);
  });
});

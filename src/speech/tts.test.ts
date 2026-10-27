import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createTts, watchdogMs, DEFAULT_RATE } from './tts';
import { EN, FakeUtterance, PL, PL2, setup } from './ttsFakes';
import { startScript } from './script';
import { isPolishVoice, pickVoice, polishVoices, type VoiceLike } from './voices';

const flush = () => vi.advanceTimersByTimeAsync(0);

beforeEach(() => {
  vi.useFakeTimers();
});
afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('tts: розблокування', () => {
  it('до першого дотику — тиша: speak() одразу повертає «skipped»', async () => {
    const { synth, tts } = setup();
    await expect(tts.speak('Dzień dobry')).resolves.toBe('skipped');
    expect(synth.utterances).toHaveLength(0);
    expect(tts.getState().unlocked).toBe(false);
  });

  it('unlock() вмикає голос і робить тиху «розминку» (volume 0)', () => {
    const { synth, tts } = setup();
    tts.unlock();
    expect(tts.getState().unlocked).toBe(true);
    expect(synth.utterances).toHaveLength(1);
    expect(synth.utterances[0]?.volume).toBe(0);
    tts.unlock(); // повторний виклик нічого не робить
    expect(synth.utterances).toHaveLength(1);
  });

  it('застрягла «розминка» не блокує чергу браузера', async () => {
    const { synth, tts } = setup();
    tts.unlock();
    await vi.advanceTimersByTimeAsync(600);
    expect(synth.cancelCount).toBe(1);
  });
});

describe('tts: черга і Promise', () => {
  it('Promise вирішується лише після закінчення озвучення', async () => {
    const { synth, tts } = setup();
    tts.unlock();
    let result: string | undefined;
    const p = tts.speak('Brawo!').then((r) => (result = r));
    await flush();
    expect(result).toBeUndefined();
    expect(synth.real).toHaveLength(1);
    synth.end();
    await p;
    expect(result).toBe('spoken');
  });

  it('озвучення з польським голосом, темпом 0,9 і гучністю 1', () => {
    const { synth, tts } = setup();
    tts.unlock();
    void tts.speak('Brawo!');
    const u = synth.real[0];
    expect(u?.lang).toBe('pl-PL');
    expect(u?.voice?.voiceURI).toBe('paulina');
    expect(u?.rate).toBe(DEFAULT_RATE);
    expect(u?.volume).toBe(1);
  });

  it('фрази йдуть по одній: друга стартує, коли закінчилась перша', async () => {
    const { synth, tts } = setup();
    tts.unlock();
    const order: string[] = [];
    const a = tts.speak('Jeden').then(() => order.push('a'));
    const b = tts.speak('Dwa').then(() => order.push('b'));
    await flush();
    expect(synth.real.map((u) => u.text)).toEqual(['Jeden']);
    synth.end();
    await a;
    expect(synth.real.map((u) => u.text)).toEqual(['Jeden', 'Dwa']);
    expect(order).toEqual(['a']);
    synth.end();
    await b;
    expect(order).toEqual(['a', 'b']);
  });

  it('speaking = true, поки є фраза, і false, коли черга спорожніла (для приглушення музики)', async () => {
    const { synth, tts } = setup();
    tts.unlock();
    const seen: boolean[] = [];
    tts.subscribe(() => seen.push(tts.getState().speaking));
    const p = tts.speak('Raz');
    expect(tts.getState().speaking).toBe(true);
    synth.end();
    await p;
    expect(tts.getState().speaking).toBe(false);
    expect(seen).toEqual([true, false]);
  });

  it('getState() повертає той самий об’єкт, доки нічого не змінилось (useSyncExternalStore)', () => {
    const { tts } = setup();
    expect(tts.getState()).toBe(tts.getState());
    const before = tts.getState();
    tts.setRate(0.8);
    expect(tts.getState()).not.toBe(before);
  });

  it('порожній текст → «skipped», нічого не озвучується', async () => {
    const { synth, tts } = setup();
    tts.unlock();
    await expect(tts.speak('   ')).resolves.toBe('skipped');
    expect(synth.real).toHaveLength(0);
  });
});

describe('tts: interrupt і cancel', () => {
  it('interrupt скасовує поточну й чергу; нова фраза стартує після короткої паузи', async () => {
    const { synth, tts } = setup();
    tts.unlock();
    const a = tts.speak('A');
    const b = tts.speak('B');
    const c = tts.speak('C', { interrupt: true });
    await expect(a).resolves.toBe('cancelled');
    await expect(b).resolves.toBe('cancelled');
    expect(synth.real.map((u) => u.text)).toEqual(['A']); // «C» ще чекає — Chrome губить speak() одразу після cancel()
    await vi.advanceTimersByTimeAsync(100);
    expect(synth.real.map((u) => u.text)).toEqual(['A', 'C']);
    synth.end();
    await expect(c).resolves.toBe('spoken');
  });

  it('cancel() вирішує все як «cancelled» і гасить speaking', async () => {
    const { synth, tts } = setup();
    tts.unlock();
    const a = tts.speak('A');
    const b = tts.speak('B');
    tts.cancel();
    await expect(a).resolves.toBe('cancelled');
    await expect(b).resolves.toBe('cancelled');
    await vi.advanceTimersByTimeAsync(100);
    expect(tts.getState().speaking).toBe(false);
    expect(synth.real.map((u) => u.text)).toEqual(['A']);
  });

  it('пізня подія end скасованої фрази нічого не ламає', async () => {
    const { synth, tts } = setup();
    tts.unlock();
    const a = tts.speak('A');
    const first = synth.real[0];
    tts.cancel();
    await a;
    first?.onend?.(); // браузер усе ж надіслав end
    const b = tts.speak('B');
    await vi.advanceTimersByTimeAsync(100);
    expect(synth.real.map((u) => u.text)).toEqual(['A', 'B']);
    synth.end();
    await expect(b).resolves.toBe('spoken');
  });

  it('error «canceled»/«interrupted» від браузера → cancelled, інша помилка → skipped', async () => {
    const { synth, tts } = setup();
    tts.unlock();
    const a = tts.speak('A');
    synth.real[0]?.onerror?.({ error: 'interrupted' });
    await expect(a).resolves.toBe('cancelled');
    const b = tts.speak('B');
    synth.real[1]?.onerror?.({ error: 'synthesis-failed' });
    await expect(b).resolves.toBe('skipped');
  });

  it('після помилки черга не застрягає', async () => {
    const { synth, tts } = setup();
    tts.unlock();
    const a = tts.speak('A');
    const b = tts.speak('B');
    synth.real[0]?.onerror?.({ error: 'synthesis-failed' });
    await a;
    expect(synth.real.map((u) => u.text)).toEqual(['A', 'B']);
    synth.end();
    await expect(b).resolves.toBe('spoken');
  });
});

describe('tts: застосунок згорнуто (setHidden)', () => {
  it('голос замовкає, але фрази вирішуються як «skipped», а не «cancelled»', async () => {
    const { synth, tts } = setup();
    tts.unlock();
    const a = tts.speak('A');
    const b = tts.speak('B');
    tts.setHidden(true);
    await expect(a).resolves.toBe('skipped');
    await expect(b).resolves.toBe('skipped');
    expect(synth.cancelCount).toBeGreaterThan(0);
    await vi.advanceTimersByTimeAsync(100);
    expect(tts.getState().speaking).toBe(false);
  });

  it('поки сховано, нові фрази не звучать; після повернення — знову звучать', async () => {
    const { synth, tts } = setup();
    tts.unlock();
    tts.setHidden(true);
    await expect(tts.speak('A')).resolves.toBe('skipped');
    expect(synth.real).toHaveLength(0);
    tts.setHidden(false);
    const b = tts.speak('B');
    await vi.advanceTimersByTimeAsync(100);
    expect(synth.real.map((u) => u.text)).toEqual(['B']);
    synth.end();
    await expect(b).resolves.toBe('spoken');
  });

  it('сценарій (похвала → далі) доходить до кінця, якщо застосунок згорнули посеред фрази', async () => {
    const { tts } = setup();
    tts.unlock();
    const steps: string[] = [];
    startScript({ speak: (t, o) => tts.speak(t, o), sleep: (ms) => new Promise((r) => setTimeout(r, ms)) }, async ({ say, wait }) => {
      await say('Brawo! Trzy rybki.');
      steps.push('after-praise');
      await wait(500);
      steps.push('next-task');
    });
    await flush();
    tts.setHidden(true);
    await vi.advanceTimersByTimeAsync(600);
    expect(steps).toEqual(['after-praise', 'next-task']);
  });
});

describe('tts: сторожовий таймер', () => {
  it('якщо браузер не надіслав end, Promise усе одно вирішується («skipped»), гра не зависає', async () => {
    const { synth, tts } = setup();
    tts.unlock();
    const p = tts.speak('Brawo!');
    await vi.advanceTimersByTimeAsync(watchdogMs('Brawo!', DEFAULT_RATE) + 10);
    await expect(p).resolves.toBe('skipped');
    expect(synth.cancelCount).toBeGreaterThan(0);
    const next = tts.speak('Dalej');
    await vi.advanceTimersByTimeAsync(100);
    expect(synth.real.at(-1)?.text).toBe('Dalej');
    synth.end();
    await expect(next).resolves.toBe('spoken');
  });

  it('watchdogMs росте з довжиною тексту і повільнішим темпом', () => {
    expect(watchdogMs('x'.repeat(40), 0.9)).toBeGreaterThan(watchdogMs('x'.repeat(10), 0.9));
    expect(watchdogMs('Brawo!', 0.5)).toBeGreaterThan(watchdogMs('Brawo!', 1));
  });
});

describe('tts: польський голос', () => {
  it('голоси вантажаться асинхронно: фраза чекає й звучить, щойно з’явився польський', async () => {
    const { synth, tts } = setup([]);
    expect(tts.getState().status).toBe('loading');
    tts.unlock();
    const p = tts.speak('Dzień dobry');
    await flush();
    expect(synth.real).toHaveLength(0);
    synth.voices = [EN, PL];
    synth.onvoiceschanged?.();
    expect(tts.getState().status).toBe('ready');
    expect(synth.real).toHaveLength(1);
    synth.end();
    await expect(p).resolves.toBe('spoken');
  });

  it('польського голосу немає → після очікування status «no-voice», фрази «skipped»', async () => {
    const { synth, tts } = setup([EN]);
    tts.unlock();
    const p = tts.speak('Dzień dobry');
    await vi.advanceTimersByTimeAsync(2600);
    await expect(p).resolves.toBe('skipped');
    expect(tts.getState().status).toBe('no-voice');
    expect(tts.getState().voiceCount).toBe(1);
    expect(tts.getState().voices).toHaveLength(0);
    expect(synth.real).toHaveLength(0); // англійський голос не читає польський текст
    // пізніше голос з'явився (встановили мовний пакет) → усе оживає
    synth.voices = [EN, PL];
    synth.onvoiceschanged?.();
    expect(tts.getState().status).toBe('ready');
  });

  it('браузер без speechSynthesis → «unsupported», фрази «skipped»', async () => {
    const tts = createTts({ synth: undefined, makeUtterance: (t) => new FakeUtterance(t) });
    expect(tts.getState().status).toBe('unsupported');
    tts.unlock();
    await expect(tts.speak('Dzień dobry')).resolves.toBe('skipped');
  });

  it('голос, обраний батьками, має перевагу над автовибором', () => {
    const { synth, tts } = setup([PL, PL2, EN]);
    tts.unlock();
    tts.setVoiceURI('google-pl');
    void tts.speak('Brawo!');
    expect(synth.real[0]?.voice?.voiceURI).toBe('google-pl');
  });

  it('у стані — лише польські голоси', () => {
    const { tts } = setup([EN, PL, PL2]);
    expect(tts.getState().voices.map((v) => v.voiceURI).sort()).toEqual(['google-pl', 'paulina']);
  });
});

describe('tts: темп і гучність', () => {
  it('темп = загальний × множник фрази, гучність береться з налаштування', () => {
    const { synth, tts } = setup();
    tts.unlock();
    tts.setRate(0.8);
    tts.setVolume(0.5);
    void tts.speak('Trzynaście', { rate: 0.5 });
    expect(synth.real[0]?.rate).toBeCloseTo(0.4);
    expect(synth.real[0]?.volume).toBe(0.5);
  });

  it('значення обмежуються розумними межами', () => {
    const { tts } = setup();
    tts.setRate(9);
    expect(tts.getState().rate).toBe(1.5);
    tts.setRate(0);
    expect(tts.getState().rate).toBe(0.5);
    tts.setVolume(3);
    expect(tts.getState().volume).toBe(1);
    tts.setVolume(-1);
    expect(tts.getState().volume).toBe(0);
  });
});

describe('tts: цифри в тексті', () => {
  it('у режимі розробки попереджає, що числа озвучують словами', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const { tts } = setup();
    tts.unlock();
    void tts.speak('2 gruszki');
    expect(warn).toHaveBeenCalledTimes(1);
  });
});

describe('voices.ts', () => {
  it('isPolishVoice: pl-PL, pl_PL (Android), pl, pol-POL — так; інші мови — ні', () => {
    const v = (lang: string): VoiceLike => ({ name: 'x', lang, voiceURI: lang });
    for (const lang of ['pl-PL', 'pl_PL', 'pl', 'PL-pl', 'pol-POL']) expect(isPolishVoice(v(lang)), lang).toBe(true);
    for (const lang of ['pt-PT', 'plt', 'en-US', 'ru-RU', 'uk-UA', '']) expect(isPolishVoice(v(lang)), lang).toBe(false);
  });

  it('pickVoice: обрана → pl-PL + локальний + «природний»; без польського — undefined', () => {
    const local: VoiceLike = { name: 'Microsoft Paulina Desktop', lang: 'pl-PL', voiceURI: 'local', localService: true };
    const natural: VoiceLike = { name: 'Microsoft Zofia Online (Natural)', lang: 'pl-PL', voiceURI: 'natural', localService: false };
    const plain: VoiceLike = { name: 'Jakiś głos', lang: 'pl_PL', voiceURI: 'plain', localService: false };
    expect(pickVoice([EN, plain, local], null)?.voiceURI).toBe('local');
    expect(pickVoice([plain, natural], null)?.voiceURI).toBe('natural');
    expect(pickVoice([local, natural, plain], 'plain')?.voiceURI).toBe('plain');
    expect(pickVoice([local, natural], 'nie-ma-takiego')?.voiceURI).toBe('local');
    expect(pickVoice([EN], null)).toBeUndefined();
    expect(pickVoice([], null)).toBeUndefined();
  });

  it('polishVoices відкидає не польські й зберігає порядок рівних', () => {
    const a: VoiceLike = { name: 'a', lang: 'pl-PL', voiceURI: 'a' };
    const b: VoiceLike = { name: 'b', lang: 'pl-PL', voiceURI: 'b' };
    expect(polishVoices([EN, a, b]).map((v) => v.voiceURI)).toEqual(['a', 'b']);
  });
});

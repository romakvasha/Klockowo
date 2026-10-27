import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { clipKey, clipsFor, splitSentences, type ClipManifest } from './clips';
import { EN, PL, setup } from './ttsFakes';

const flush = () => vi.advanceTimersByTimeAsync(0);
const GAP = 100;

/** «Brawo!» і «Pięć jabłek.» записані, «Sześć gruszek.» — ні. */
const PL_CLIPS: ClipManifest = { clips: { brawo: 'b1', 'pięć jabłek': 'p5', siedem: 's7' } };

async function ready(manifest: ClipManifest = PL_CLIPS, voices = [EN, PL], refuse = false) {
  const t = setup(voices, { sentenceGapMs: GAP }, { manifests: { pl: manifest }, refuse });
  await flush(); // маніфест завантажився
  t.tts.unlock();
  return t;
}

beforeEach(() => {
  vi.useFakeTimers();
});
afterEach(() => {
  vi.useRealTimers();
});

describe('clips: речення й ключі', () => {
  it('висловлювання ділиться на речення за . ! ? …', () => {
    expect(splitSentences('Brawo! Pięć jabłek.')).toEqual(['Brawo!', 'Pięć jabłek.']);
    expect(splitSentences('Ile jest?  Policz razem… Dobrze.')).toEqual(['Ile jest?', 'Policz razem…', 'Dobrze.']);
    expect(splitSentences('siedem')).toEqual(['siedem']);
    expect(splitSentences('   ')).toEqual([]);
  });

  it('ключ: без регістру й крапки чи знака оклику в кінці; знак питання лишається', () => {
    expect(clipKey('Siedem.')).toBe('siedem');
    expect(clipKey('siedem')).toBe('siedem');
    expect(clipKey('Brawo!')).toBe('brawo');
    expect(clipKey('Pięć  jabłek.')).toBe('pięć jabłek');
    expect(clipKey('Ile jest?')).toBe('ile jest?');
    expect(clipKey('Policz razem…')).toBe('policz razem');
  });

  it('clipsFor: файли для кожного речення або null, якщо бракує хоч одного', () => {
    expect(clipsFor(PL_CLIPS, 'Brawo! Pięć jabłek.')).toEqual(['b1', 'p5']);
    expect(clipsFor(PL_CLIPS, 'Brawo! Sześć gruszek.')).toBeNull();
    expect(clipsFor(PL_CLIPS, '')).toBeNull();
    expect(clipsFor(null, 'Brawo!')).toBeNull();
  });
});

describe('tts: записаний голос', () => {
  it('усе висловлювання записано → речення з файлів одне за одним, синтез мовчить; Promise — після останнього', async () => {
    const { synth, tts, audios } = await ready();
    tts.setVolume(0.7);
    let result: string | undefined;
    void tts.speak('Brawo! Pięć jabłek.').then((r) => (result = r));
    await flush();
    expect(audios.map((a) => a.url)).toEqual(['audio/pl/b1.mp3']);
    expect(audios[0]).toMatchObject({ played: true, volume: 0.7, playbackRate: 1 });
    expect(tts.getState().speaking).toBe(true);
    audios[0]?.end();
    await vi.advanceTimersByTimeAsync(GAP - 1);
    expect(audios).toHaveLength(1); // пауза між реченнями
    await vi.advanceTimersByTimeAsync(1);
    expect(audios.map((a) => a.url)).toEqual(['audio/pl/b1.mp3', 'audio/pl/p5.mp3']);
    expect(result).toBeUndefined();
    audios[1]?.end();
    await flush();
    expect(result).toBe('spoken');
    expect(synth.real).toHaveLength(0);
    expect(tts.getState().speaking).toBe(false);
  });

  it('бракує одного речення → усе висловлювання каже браузерний голос (без змішування)', async () => {
    const { synth, tts, audios } = await ready();
    void tts.speak('Brawo! Sześć gruszek.');
    await flush();
    expect(audios).toHaveLength(0);
    expect(synth.real.map((u) => u.text)).toEqual(['Brawo! Sześć gruszek.']);
  });

  it('темп «Tempo mowy» і повільніші пари: звичайний 0,9 — запис як є', async () => {
    const { tts, audios } = await ready();
    tts.setRate(1.2);
    void tts.speak('siedem', { rate: 0.75 });
    await flush();
    expect(audios[0]?.playbackRate).toBeCloseTo(1);
    audios[0]?.end();
    tts.setRate(0.9);
    void tts.speak('siedem', { rate: 0.8 });
    await flush();
    expect(audios[1]?.playbackRate).toBeCloseTo(0.8);
  });

  it('статус recorded: частина / усе; для мови без записів — none; маніфест мови вантажиться один раз', async () => {
    const { tts, loads } = await ready();
    expect(tts.getState().recorded).toBe('partial');
    tts.setLanguage('uk');
    expect(tts.getState().recorded).toBe('none');
    await flush();
    expect(tts.getState().recorded).toBe('none');
    tts.setLanguage('pl');
    expect(tts.getState().recorded).toBe('partial');
    expect(loads).toEqual(['pl', 'uk']);
    const full = await ready({ ...PL_CLIPS, complete: true });
    expect(full.tts.getState().recorded).toBe('complete');
  });

  it('записи однієї мови не грають іншою', async () => {
    const { synth, tts, audios } = await ready(PL_CLIPS, [EN, PL, { name: 'uk', lang: 'uk-UA', voiceURI: 'uk' }]);
    tts.setLanguage('uk');
    await vi.advanceTimersByTimeAsync(100);
    void tts.speak('siedem');
    await flush();
    expect(audios).toHaveLength(0);
    expect(synth.real.map((u) => u.text)).toEqual(['siedem']);
  });

  it('«Nagrany głos» вимкнено → лише браузерний голос', async () => {
    const { synth, tts, audios } = await ready();
    tts.setUseRecorded(false);
    void tts.speak('siedem');
    await flush();
    expect(audios).toHaveLength(0);
    expect(synth.real).toHaveLength(1);
  });

  it('файл не зіграв посеред висловлювання → решту (з цього речення) каже браузерний голос', async () => {
    const { synth, tts, audios } = await ready();
    const p = tts.speak('Brawo! Pięć jabłek.');
    await flush();
    audios[0]?.end();
    await vi.advanceTimersByTimeAsync(GAP);
    audios[1]?.onerror?.();
    expect(audios[1]?.paused).toBe(true);
    expect(synth.real.map((u) => u.text)).toEqual(['Pięć jabłek.']);
    synth.end();
    await expect(p).resolves.toBe('spoken');
  });

  it('play() відхилено (iOS без дотику) → браузерний голос, гра не зависає', async () => {
    const { synth, tts } = await ready(PL_CLIPS, [EN, PL], true);
    const p = tts.speak('siedem');
    await flush();
    expect(synth.real.map((u) => u.text)).toEqual(['siedem']);
    synth.end();
    await expect(p).resolves.toBe('spoken');
  });

  it('файл «завис» без події end → сторожовий таймер, далі браузерний голос', async () => {
    const { synth, tts } = await ready();
    void tts.speak('siedem');
    await vi.advanceTimersByTimeAsync(15000);
    expect(synth.real.map((u) => u.text)).toEqual(['siedem']);
  });

  it('cancel() під час речення чи паузи між реченнями: «cancelled», далі нічого не грає', async () => {
    const { tts, audios } = await ready();
    const p1 = tts.speak('siedem');
    await flush();
    tts.cancel();
    await expect(p1).resolves.toBe('cancelled');
    expect(audios[0]?.paused).toBe(true);

    await vi.advanceTimersByTimeAsync(100);
    const p2 = tts.speak('Brawo! Pięć jabłek.');
    await flush();
    audios[1]?.end();
    tts.cancel(); // у паузі між реченнями
    await expect(p2).resolves.toBe('cancelled');
    await vi.advanceTimersByTimeAsync(GAP * 2);
    expect(audios).toHaveLength(2);
  });

  it('вкладку сховано → запис замовкає, фраза «skipped»', async () => {
    const { tts, audios } = await ready();
    const p = tts.speak('siedem');
    await flush();
    tts.setHidden(true);
    await expect(p).resolves.toBe('skipped');
    expect(audios[0]?.paused).toBe(true);
  });

  it('браузерного голосу мови немає: записане звучить, незаписане — «skipped»', async () => {
    const { tts, audios } = await ready(PL_CLIPS, [EN]);
    await vi.advanceTimersByTimeAsync(3000);
    expect(tts.getState().status).toBe('no-voice');
    const p = tts.speak('siedem');
    await flush();
    audios[0]?.end();
    await expect(p).resolves.toBe('spoken');
    await expect(tts.speak('osiem')).resolves.toBe('skipped');
  });

  it('перший дотик «розблоковує» програвач записів (iOS) — один раз', async () => {
    const { tts, primes } = await ready();
    tts.unlock();
    expect(primes()).toBe(1);
  });
});

import { describe, expect, it } from 'vitest';
import { startScript, type ScriptEnv } from './script';
import type { SpeakResult } from './ttsTypes';

/** Підроблене середовище: speak і sleep вирішуються вручну, у порядку виклику. */
function fakeEnv() {
  const log: string[] = [];
  const speaks: { text: string; resolve: (r: SpeakResult) => void }[] = [];
  const sleeps: { ms: number; resolve: () => void }[] = [];
  const env: ScriptEnv = {
    speak: (text) => new Promise((resolve) => { log.push(`say:${text}`); speaks.push({ text, resolve }); }),
    sleep: (ms) => new Promise((resolve) => { log.push(`wait:${ms}`); sleeps.push({ ms, resolve }); }),
  };
  return { env, log, speaks, sleeps };
}

const tick = () => new Promise<void>((resolve) => setTimeout(resolve, 0));

describe('startScript', () => {
  it('виконує кроки по черзі: наступний не починається, доки голос не договорив', async () => {
    const { env, log, speaks, sleeps } = fakeEnv();
    startScript(env, async ({ say, wait }) => {
      await say('a');
      await wait(100);
      await say('b');
      log.push('end');
    });
    await tick();
    expect(log).toEqual(['say:a']);
    speaks[0]?.resolve('spoken');
    await tick();
    expect(log).toEqual(['say:a', 'wait:100']);
    sleeps[0]?.resolve();
    await tick();
    expect(log).toEqual(['say:a', 'wait:100', 'say:b']);
    speaks[1]?.resolve('spoken');
    await tick();
    expect(log.at(-1)).toBe('end');
  });

  it('нема голосу (skipped) — сценарій іде далі', async () => {
    const { env, log, speaks } = fakeEnv();
    startScript(env, async ({ say }) => {
      await say('a');
      log.push('after');
    });
    await tick();
    speaks[0]?.resolve('skipped');
    await tick();
    expect(log).toEqual(['say:a', 'after']);
  });

  it('фразу скасовано ззовні (cancelled) — сценарій обривається', async () => {
    const { env, log, speaks } = fakeEnv();
    startScript(env, async ({ say }) => {
      await say('a');
      log.push('after');
    });
    await tick();
    speaks[0]?.resolve('cancelled');
    await tick();
    expect(log).toEqual(['say:a']);
  });

  it('обрив: наступні кроки не виконуються, а помилки обриву не спливають', async () => {
    const { env, log, speaks } = fakeEnv();
    const stop = startScript(env, async ({ say, wait }) => {
      await say('a');
      await wait(50);
      log.push('never');
    });
    await tick();
    stop();
    speaks[0]?.resolve('spoken');
    await tick();
    expect(log).toEqual(['say:a']);
  });

  it('обрив під час паузи', async () => {
    const { env, log, sleeps } = fakeEnv();
    const stop = startScript(env, async ({ wait }) => {
      await wait(500);
      log.push('never');
    });
    await tick();
    stop();
    sleeps[0]?.resolve();
    await tick();
    expect(log).toEqual(['wait:500']);
  });
});

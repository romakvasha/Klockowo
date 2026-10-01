import { describe, expect, it } from 'vitest';
import { BOOT_MIN_MS, BOOT_SLOTS, bootProgress, filledSlots, isBooted } from './bootProgress';

describe('bootProgress', () => {
  it('росте з часом, але не вище за реально виконані завдання', () => {
    expect(bootProgress(0, 0, 2)).toBe(0);
    expect(bootProgress(800, 2, 2)).toBe(0.5); // завдання готові, чекаємо мінімальний час
    expect(bootProgress(BOOT_MIN_MS, 2, 2)).toBe(1);
    expect(bootProgress(5000, 1, 2)).toBe(0.5); // час минув, одне завдання ще виконується
    expect(bootProgress(5000, 0, 2)).toBe(0);
  });

  it('без завдань — лише час; нульовий мінімальний час — лише завдання; значення обмежуються', () => {
    expect(bootProgress(400, 0, 0)).toBe(0.25);
    expect(bootProgress(0, 1, 2, 0)).toBe(0.5);
    expect(bootProgress(-5, 3, 2)).toBe(0);
    expect(bootProgress(1e9, 9, 2)).toBe(1);
  });
});

describe('filledSlots (смужка з 10 кубиків)', () => {
  it('борд: 6 із 10 при 60 %', () => {
    expect(BOOT_SLOTS).toBe(10);
    expect(filledSlots(0)).toBe(0);
    expect(filledSlots(0.6)).toBe(6);
    expect(filledSlots(0.99)).toBe(9);
    expect(filledSlots(1)).toBe(10);
    expect(filledSlots(2)).toBe(10);
    expect(filledSlots(-1)).toBe(0);
  });

  it('точні соті не «губляться» через плаваючу кому (0,3 → 3, 0,7 → 7)', () => {
    expect(filledSlots(0.3)).toBe(3);
    expect(filledSlots(0.7)).toBe(7);
    expect(filledSlots(0.1 + 0.2)).toBe(3);
  });
});

describe('isBooted', () => {
  it('потрібні і мінімальний час, і всі завдання', () => {
    expect(isBooted(BOOT_MIN_MS, 2, 2)).toBe(true);
    expect(isBooted(BOOT_MIN_MS - 1, 2, 2)).toBe(false);
    expect(isBooted(9999, 1, 2)).toBe(false);
    expect(isBooted(BOOT_MIN_MS, 0, 0)).toBe(true);
  });
});

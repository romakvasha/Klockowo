// Бар'єр для дорослих (BRIEF §6 п.14): після утримання шестерні 3 с — письмове питання без озвучення («Wpisz wynik: siedem razy osiem»), цифрова клавіатура, «Wejdź».
// Приклад щоразу інший. Помилка: «Niepoprawny wynik. Spróbuj ponownie.»; після 3 помилок — назад до дитини. Чиста логіка: завдання й редуктор вводу.
import type { Rng } from '../games/engine/rng';

export const MAX_ATTEMPTS = 3;
/** Відповідь не більше 81 (9 × 9): цифр у відповіді ≤ 2, але дозволяємо 3, щоб випадкове сміття не блокувало ввід. */
export const MAX_DIGITS = 3;

export interface Challenge {
  a: number;
  b: number;
  answer: number;
}

/** Множення двох цифр 3…9 (без «× 1» і «× 2»): дорослий порахує за секунду, дитина 5–6 років — ні. Не повторює попереднє завдання. */
export function makeChallenge(rng: Rng, previous?: Challenge): Challenge {
  let a = rng.int(3, 9);
  let b = rng.int(3, 9);
  for (let attempt = 0; attempt < 10 && previous && a === previous.a && b === previous.b; attempt++) {
    a = rng.int(3, 9);
    b = rng.int(3, 9);
  }
  return { a, b, answer: a * b };
}

export type GateStatus = 'typing' | 'wrong' | 'open' | 'locked';

export interface GateState {
  input: string;
  errors: number;
  status: GateStatus;
}

export const INITIAL_GATE: GateState = { input: '', errors: 0, status: 'typing' };

export type GateKey = { type: 'digit'; digit: number } | { type: 'back' } | { type: 'submit' };

/** Редуктор вводу: цифри дописуються (до MAX_DIGITS), «⌫» стирає, «Wejdź» перевіряє. Правильно — open; хибно — повідомлення, ввід очищується, помилок +1; третя помилка — locked. */
export function gateReducer(state: GateState, key: GateKey, challenge: Challenge): GateState {
  if (state.status === 'open' || state.status === 'locked') return state;
  switch (key.type) {
    case 'digit':
      if (!Number.isInteger(key.digit) || key.digit < 0 || key.digit > 9 || state.input.length >= MAX_DIGITS) return state;
      return { ...state, input: state.input === '0' ? String(key.digit) : state.input + key.digit, status: 'typing' };
    case 'back':
      return { ...state, input: state.input.slice(0, -1), status: 'typing' };
    case 'submit': {
      if (state.input === '') return state;
      if (Number(state.input) === challenge.answer) return { ...state, status: 'open' };
      const errors = state.errors + 1;
      return { input: '', errors, status: errors >= MAX_ATTEMPTS ? 'locked' : 'wrong' };
    }
  }
}

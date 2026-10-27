// Фрази для проби голосу — справжні репліки Klockowo кожною мовою.
// whole — ціле речення одним файлом (так буде для незмінних реплік);
// pieces — те саме речення зі шматків (так буде для фраз із числами): порівняйте на слух, чи не чути стиків;
// counting — числа окремими файлами (лічба вголос, дотик до плитки).

export const SAMPLES = {
  pl: {
    whole: [
      'Łapki w górę, liczymy!',
      'Policz biedronki. Dotykaj po kolei. Ile jest biedronek?',
      'Brawo! Pięć jabłek.',
      'Spróbujmy jeszcze raz!',
      'Pomogę ci. Zrobimy to razem.',
      'Witaj na Łące Liczenia! Tu liczymy biedronki i kwiatki.',
      'Rakieta jest na liczbie trzydzieści cztery. Leci o dziesięć dalej. Gdzie wyląduje?',
    ],
    pieces: [
      ['Daj', 'misiowi', 'pięć', 'jabłek.'],
      ['Trzy', 'dodać', 'dwa', 'równa się', 'pięć.'],
      ['Cztery', 'dziesiątki', 'i', 'siedem', 'jedności', 'to', 'czterdzieści siedem.'],
    ],
    counting: ['jeden', 'dwa', 'trzy', 'cztery', 'pięć', 'trzynaście', 'trzydzieści', 'czternaście', 'czterdzieści'],
  },
  uk: {
    whole: [
      'Лапки вгору, лічимо!',
      'Скільки тут сонечок? Торкайся по черзі й лічи.',
      "Браво! П'ять яблук.",
      'Спробуймо ще раз!',
      'Я допоможу. Зробимо це разом.',
      'Вітаю на Галявині Лічби! Тут ми лічимо сонечка й квіточки.',
      'Ракета на числі тридцять чотири. Вона летить на десять далі. Де вона приземлиться?',
    ],
    pieces: [
      ['Дай', 'ведмедикові', "п'ять", 'яблук.'],
      ['Три', 'додати', 'два', '— це', "п'ять."],
      ['Чотири', 'десятки', 'й', 'сім', 'одиниць', '— це', 'сорок сім.'],
    ],
    counting: ['один', 'два', 'три', 'чотири', "п'ять", 'тринадцять', 'тридцять', 'чотирнадцять', 'сорок'],
  },
  en: {
    whole: [
      "Paws up, let's count!",
      'Count the ladybirds. Touch them one by one. How many ladybirds are there?',
      'Well done! Five apples.',
      "Let's try again!",
      "I'll help you. Let's do it together.",
      'Welcome to Counting Meadow! Here we count ladybirds and flowers.',
      'The rocket is on number thirty-four. It flies ten further. Where will it land?',
    ],
    pieces: [
      ['Give', 'the bear', 'five', 'apples.'],
      ['Three', 'plus', 'two', 'equals', 'five.'],
      ['Four', 'tens', 'and', 'seven', 'ones', 'make', 'forty-seven.'],
    ],
    counting: ['one', 'two', 'three', 'four', 'five', 'thirteen', 'thirty', 'fourteen', 'forty'],
  },
};

/** Скільки символів піде на одну мову для одного голосу й однієї моделі (кредити ≈ символи). */
export function sampleChars(lang) {
  const s = SAMPLES[lang];
  const whole = s.whole.join('') + s.pieces.map((p) => p.join(' ')).join('');
  return whole.length + s.pieces.flat().join('').length + s.counting.join('').length;
}

// Фрази для проби голосу — справжні репліки Klockowo кожною мовою.
// whole — висловлювання одним файлом (у грі записи звучать цілими реченнями);
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
    counting: ['one', 'two', 'three', 'four', 'five', 'thirteen', 'thirty', 'fourteen', 'forty'],
  },
};

/** Скільки символів піде на одну мову для одного голосу й однієї моделі (кредити ≈ символи). */
export function sampleChars(lang) {
  const s = SAMPLES[lang];
  return s.whole.join('').length + s.counting.join('').length;
}

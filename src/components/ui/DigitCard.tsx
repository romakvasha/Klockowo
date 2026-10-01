import { TileButton, type TileButtonProps } from './TileButton';

export type DigitCardProps = Omit<TileButtonProps, 'shape'>;

/** Картка цифри 120×160 з цифрою 110 px: картки цифр, доріжка, «Cyfra i obrazek», картка в лапах Kubika.
 *  Крапки на картці за замовчуванням по 3 в ряд (кубик: 6 = 3 + 3). */
export function DigitCard(props: DigitCardProps) {
  return <TileButton dotsPerRow={3} {...props} shape="card" />;
}

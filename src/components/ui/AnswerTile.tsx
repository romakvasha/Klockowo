import { TileButton, type TileButtonProps } from './TileButton';

export type AnswerTileProps = Omit<TileButtonProps, 'shape'>;

/** Плитка-відповідь 120×120 (140 / 128 / 96 / 88 за в'юпортом): дотик лише вибирає її й озвучує число,
 *  перевіряє «Gotowe» (BRIEF §7). Усі стани — у TileState. */
export function AnswerTile(props: AnswerTileProps) {
  return <TileButton {...props} shape="square" />;
}

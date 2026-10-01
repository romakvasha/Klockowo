import { BUTTONS } from '../../speech/lines';
import { cx } from './cx';
import { IconButton } from './IconButton';
import styles from './HintButton.module.css';

export interface HintButtonProps {
  /** Лампочка з'являється після першої помилки (BRIEF §7): до того її нема. */
  visible: boolean;
  /** Kubik зараз показує підказку: кнопка підсвічена й неактивна. */
  active?: boolean;
  onPress: () => void;
  className?: string;
}

/** «Pomóż mi» — жовта лампочка 72 px (80 на телефоні) праворуч від Kubika (design etap2/06). Дотик: Kubik каже «Patrz, pokażę ci.» і показує
 *  лише перший крок. Вискакує за 350 мс; у режимі «Mniej animacji» — з'являється згасанням. */
export function HintButton({ visible, active = false, onPress, className }: HintButtonProps) {
  if (!visible) return null;
  return (
    <IconButton
      icon="bulb"
      label={BUTTONS.help}
      variant="hint"
      className={cx(styles.hint, active && styles.active, className)}
      disabled={active}
      onClick={onPress}
    />
  );
}

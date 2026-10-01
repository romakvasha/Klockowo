import logoUrl from '../../assets/logo/klockowo.svg';
import { SITE_NAME } from '../../speech/lines';
import { cx } from './cx';
import styles from './Logo.module.css';

/** Логотип «Klockowo»: літери, складені з кубиків кольорів світів W1–W7, «K» — primary (design etap1/00). Ширину задає клас/батько. */
export function Logo({ className }: { className?: string }) {
  return <img className={cx(styles.logo, className)} src={logoUrl} alt={SITE_NAME} draggable={false} />;
}

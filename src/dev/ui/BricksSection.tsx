import { BRICK_COLORS, DiligenceBadge, ICON_NAMES, IconButton, Logo, type BrickColor } from '../../components/ui';
import { cx } from '../../components/ui/cx';
import { LABELS } from '../../speech/lines';
import { Cell, Hint, Row, Section, Sub } from './UiSection';
import styles from './Bricks.module.css';
import ui from './Ui.module.css';

/** Підписи палітри (токени --kl-brick-* у styles/tokens.css). */
const NOTES: Readonly<Record<BrickColor, string>> = {
  red: '#E8352F',
  yellow: '#FFCF1F · значок #4A3300',
  blue: '#1F7FE0 · плитки',
  green: '#3FAE35 · «Graj!», правильно',
  orange: '#FF8A1F · «Mapa», «Gotowe»',
  purple: '#8B4FE0 · «Naklejki»',
  white: '#F3F6FB · значок ink',
  grey: '#A9B2C0 · замок',
  pale: '#E6ECF4 · після помилки',
};

/** Система цеглинок v2 (полотно D1 «System cegiełek»): палітра, значки на кольорах, усі іконки, логотип, жетони, картка. */
export function BricksSection() {
  return (
    <>
      <Section title="Цеглинки v2 — кольори" note="DESIGN_V2 §4 · блік угорі, темніший низ, край 7 px, пупирці · значок білий із темним контуром">
        <Row>
          {BRICK_COLORS.map((c) => (
            <Cell key={c} caption={<>{c}<br />{NOTES[c]}</>}>
              <span className={cx('kl-brick', 'kl-studs', styles.swatch)} data-brick={c} />
            </Cell>
          ))}
        </Row>
        <Sub>Той самий значок на кожному кольорі (проп color)</Sub>
        <Row>
          {BRICK_COLORS.map((c) => <IconButton key={c} icon="home" label={c} color={c} />)}
        </Row>
        <Hint>
          Контраст значка — тест styles/contrast.test.ts: білий значок обведено темнішим краєм цеглинки (≥ 6,5 : 1); на жовтій, білій і блідій
          цеглинках значок темний. Сигнал ніколи не лише кольором: є форма, рамка або значок.
        </Hint>
      </Section>

      <Section title="Іконки" note="26 SVG · одна дія — одна іконка · кожна на цеглинці кольору своєї дії">
        <div className={styles.icons}>
          {ICON_NAMES.map((name) => (
            <Cell key={name} caption={name}><IconButton icon={name} label={name} /></Cell>
          ))}
        </div>
        <Hint>badge — новий квадратний жетон для «Odznaki»: зірка ★ лишається лише для необов'язкових гілок і їхніх наліпок (бриф §8).</Hint>
      </Section>

      <Section title="Логотип і жетони" note="літери на кольорових цеглинках · «Nie poddajesz się!» — квадратна жовта цеглинка з пупирцем">
        <div className={cx(ui.stage, styles.logoStage)}>
          <Logo />
          <Logo className={styles.logoSmall} />
        </div>
        <Row>
          <Cell caption="DiligenceBadge 150"><DiligenceBadge /></Cell>
          <Cell caption="96 · сторінка «Odznaki»"><DiligenceBadge size={96} /></Cell>
          <Cell caption="кнопка «Odznaki»"><IconButton icon="badge" label={LABELS.badges} /></Cell>
        </Row>
      </Section>

      <Section title="Картка" note="біла 92 %, радіус 24, м'яка тінь · текст ніколи не стоїть просто на фото">
        <div className={ui.stage}>
          <div className={cx('kl-card', styles.card)}>Картка kl-card: підписи, кісточки HUD, дошка завдання, панелі.</div>
        </div>
      </Section>
    </>
  );
}

import type { WorldKey } from '../speech/nouns';
import { CARD_BOX, KUBIK_URL, MOUTH_BOX, MOUTH_URL, artOf, need } from './art';
import { CardDigits } from './CardDigits';
import { Figure, boxStyle, type FigureProps } from './Figure';
import styles from './Figure.module.css';
import { MOUTH_SHAPES, kubikImage, motionOf, type KubikPose } from './poses';

export interface KubikProps extends Pick<FigureProps, 'talking' | 'animate' | 'size' | 'label' | 'className' | 'style'> {
  pose?: KubikPose;
  /** Аксесуар світу на голові (W1 капелюшок … W7 шолом) — у позах спокою й радості; у хабі й на мапі — без нього. */
  accessory?: WorldKey | null;
  /** Число на картці в лапах — лише для пози with-card. */
  card?: number;
}

/** «Kubik» — провідник дитини (BRIEF §9). Поза — картинка v2; коли `talking` (зазвичай `useTts().speaking`), у позі спокою рот
 *  говорить кадрами A/O/E, в інших позах Kubik легенько киває. Лапками не рахує «на пальцях»: кількість — кубиками (demonstrating)
 *  чи карткою (with-card). */
export function Kubik({ pose = 'idle', accessory = null, card, ...rest }: KubikProps) {
  const image = kubikImage(pose, accessory);
  const mouthBox = MOUTH_BOX[image];
  return (
    <Figure key={image} art={artOf(KUBIK_URL, image, `kubik-${image}`)} pose={pose} motion={motionOf(pose)} mouth={mouthBox !== undefined} {...rest}>
      {mouthBox &&
        MOUTH_SHAPES.map((m) => (
          <img key={m} className={styles.mouth} data-m={m} src={need(MOUTH_URL, `${image}-${m}`, 'Kubik mouth')} alt="" draggable={false} style={boxStyle(mouthBox)} />
        ))}
      {pose === 'with-card' && card !== undefined && <CardDigits value={card} className={styles.card} style={boxStyle(CARD_BOX)} />}
    </Figure>
  );
}

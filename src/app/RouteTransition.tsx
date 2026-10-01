import { useEffect, useRef, type ReactNode } from 'react';
import { useLocation } from 'react-router';
import styles from './RouteTransition.module.css';

/** Перехід між екранами (BRIEF §11: ковзання 350 мс): кожна зміна шляху монтує екран заново, і він в'їжджає справа. Перший екран після
 *  завантаження й dev-сторінки — без руху. «Mniej animacji» і prefers-reduced-motion замінюють ковзання на згасання 150 мс (motion.css). */
export function RouteTransition({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  const first = useRef(true);
  const animate = !first.current && !pathname.startsWith('/dev');
  useEffect(() => {
    first.current = false;
  }, [pathname]);
  return (
    <div key={pathname} className={animate ? styles.slide : undefined}>
      {children}
    </div>
  );
}

import { Component, type ErrorInfo, type ReactNode } from 'react';
import { useLocation } from 'react-router';
import { ErrorScreen } from '../screens/ErrorScreen';

interface Props {
  children: ReactNode;
  /** Зміна ключа (адреси) скидає помилку: перехід на інший екран дає шанс. */
  resetKey: string;
}

interface State {
  failed: boolean;
}

/** Запасний екран «Błąd» (BRIEF §6 п.16): якщо якийсь екран упав під час рендеру, дитина бачить здивованого Kubika, чує «Ups! Spróbujmy jeszcze raz.» і торкається «Jeszcze raz» — помилка
 *  скидається, застосунок іде на мапу. Деталі лише в консоль (без аналітики й мережі). */
class Boundary extends Component<Props, State> {
  state: State = { failed: false };

  static getDerivedStateFromError(): State {
    return { failed: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('Klockowo: екран упав', error, info.componentStack);
  }

  componentDidUpdate(prev: Props): void {
    if (this.state.failed && prev.resetKey !== this.props.resetKey) this.setState({ failed: false });
  }

  render(): ReactNode {
    if (!this.state.failed) return this.props.children;
    return (
      <ErrorScreen
        onRetry={() => {
          this.setState({ failed: false });
          window.location.hash = '#/map';
        }}
      />
    );
  }
}

export function AppErrorBoundary({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  return <Boundary resetKey={pathname}>{children}</Boundary>;
}

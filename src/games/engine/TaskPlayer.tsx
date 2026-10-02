import { useCallback, useEffect, useReducer, useRef, useState } from 'react';
import type { MascotState } from '../../characters/poses';
import { AnswerTile } from '../../components/ui/AnswerTile';
import { IconButton } from '../../components/ui/IconButton';
import type { Level } from '../../curriculum/types';
import { BUTTONS, FEEDBACK_LINES, GAME_TITLES, PRAISE } from '../../speech/lines';
import { numberWords } from '../../speech/numberWords';
import { sfx } from '../../speech/sfx';
import { tts } from '../../speech/tts';
import { useScriptRunner } from '../../speech/useScript';
import { useTts } from '../../speech/useTts';
import type { AnswerEntry, TaskOutcome } from '../../store/types';
import { buildEntry, playMinutes } from './entry';
import { GameFrame } from './GameFrame';
import type { PlaceholderTask, PlannedTask } from './levelPlan';
import { INITIAL_TASK, canCheck, hintAvailable, taskOutcome, taskReducer, tileView } from './taskFlow';
import type { Assist, GameDef, TaskBase } from './types';
import { NO_ASSIST } from './types';
import styles from './TaskPlayer.module.css';

/** Наступне завдання — не раніше ніж через 1,2 с після правильної відповіді (BRIEF §7): голос і кісточка встигають. */
export const MIN_AFTER_CORRECT_MS = 1200;

export interface SolvedResult {
  outcome: TaskOutcome;
  /** Рядок історії відповідей; null для заглушки. */
  entry: AnswerEntry | null;
  /** Хвилини гри за завдання для лічильника «Minuty dziś». */
  minutes: number;
}

export interface TaskPlayerProps {
  level: Level;
  planned: PlannedTask;
  /** Скільки кісточок уже отримано до цього завдання. */
  filled: number;
  onSolved: (result: SolvedResult) => void;
  onMap: () => void;
}

interface PlayProps extends Omit<TaskPlayerProps, 'planned'> {
  def: GameDef;
  instance: TaskBase;
  index: number;
}

/** Завдання (BRIEF §7 «Спільні правила»): інструкція голосом [+ вступний показ гри] → дитина діє → відповідь (плитка чи зібране на сцені) → «Gotowe» →
 *  правильно / 1-ша помилка («Spróbujmy jeszcze raz!») / 2-га помилка (Kubik показує «разом», дитина завершує сама). Голос і кісточка — за сценарієм.
 *  choice — відповіді-плитки в лотку; build — дитина збирає відповідь на сцені (сцена пише її через onRespond, лоток — місце для зон). */
function PlayTask({ level, def, instance, index, filled, onSolved, onMap }: PlayProps) {
  const speaking = useTts().speaking;
  const { run, stop } = useScriptRunner();
  const [state, dispatch] = useReducer(taskReducer, INITIAL_TASK);
  const [mood, setMood] = useState<MascotState>('talking');
  const [assist, setAssist] = useState<Assist>(NO_ASSIST);
  const [listenPulse, setListenPulse] = useState(false);
  const [replay, setReplay] = useState(0);
  const [celebrating, setCelebrating] = useState(false);
  const startedAt = useRef(Date.now());
  /** Остання відповідь дитини (вибрана плитка чи зібране число): потрібна підказкам, навіть коли після помилки вибір скинуто. */
  const responseRef = useRef<number | null>(null);
  const answer = def.answer(instance);

  // Інструкція: голос читає завдання (+ вступний показ гри), «Posłuchaj» повторює її й пульсує, коли голос договорив. Один сценарій на раз —
  // відгук обриває інструкцію, а не перетинається з нею.
  useEffect(() => {
    run(async ({ say, wait }) => {
      setListenPulse(false);
      setMood('talking');
      await wait(replay === 0 ? 450 : 100);
      await say(def.prompt(instance), { interrupt: true });
      if (def.intro) {
        setMood('idle');
        await def.intro(instance, { say, wait, setAssist });
        setAssist(NO_ASSIST);
      }
      setMood('idle');
      setListenPulse(true);
    });
  }, [replay, run, def, instance]);

  const respond = useCallback((value: number | null, ready: boolean = value !== null) => {
    responseRef.current = value;
    dispatch({ type: 'respond', value: ready ? value : null });
  }, []);

  const select = (value: number) => {
    if (state.phase !== 'play' || state.wrong.includes(value)) return;
    stop();
    setMood('idle');
    responseRef.current = value;
    dispatch({ type: 'select', value });
    void tts.speak(numberWords(value), { interrupt: true });
  };

  const check = () => {
    if (!canCheck(state) || state.selected === null) return;
    const verdict = def.check(instance, state.selected);
    const event = { type: 'check', verdict } as const;
    const next = taskReducer(state, event);
    dispatch(event);

    if (verdict.ok) {
      const ms = Date.now() - startedAt.current;
      const result: SolvedResult = {
        outcome: taskOutcome(next),
        entry: buildEntry({ instance, level, state: next, answer: def.recordsAnswer === false ? null : answer, ms, now: new Date() }),
        minutes: playMinutes(ms),
      };
      run(async ({ say, wait }) => {
        setMood('correct');
        setCelebrating(true);
        sfx.play('correct');
        const t0 = performance.now();
        await say(def.praise(instance, PRAISE[index % PRAISE.length] ?? PRAISE[0]), { interrupt: true });
        const rest = MIN_AFTER_CORRECT_MS - (performance.now() - t0);
        if (rest > 0) await wait(rest);
        dispatch({ type: 'feedbackDone' });
        onSolved(result);
      });
      return;
    }

    if (next.last === 'wrong1') {
      run(async ({ say }) => {
        setMood('retry');
        sfx.play('retry');
        await say(verdict.almost ? FEEDBACK_LINES.almost : FEEDBACK_LINES.retry, { interrupt: true });
        dispatch({ type: 'feedbackDone' });
        setMood('idle');
      });
      return;
    }

    // 2-га помилка: Kubik показує розв'язок разом, правильну плитку підсвічено; дитина завершує сама й теж отримує кісточку
    run(async ({ say, wait }) => {
      setMood('together');
      sfx.play('retry');
      await say(FEEDBACK_LINES.together, { interrupt: true });
      await def.together(instance, { say, wait, setAssist }, { nth: state.hints, response: responseRef.current });
      setAssist(NO_ASSIST);
      dispatch({ type: 'feedbackDone' });
      setMood('pointing');
    });
  };

  // «Pomóż mi» (після першої помилки): «Patrz, pokażę ci.» і лише перший крок — відповідь дитина дає сама
  const help = () => {
    if (!hintAvailable(state) || state.phase !== 'play') return;
    const nth = state.hints + 1;
    dispatch({ type: 'hint' });
    run(async ({ say, wait }) => {
      setMood('hint');
      await say(FEEDBACK_LINES.show, { interrupt: true });
      await def.hint(instance, { say, wait, setAssist }, { nth, response: responseRef.current });
      setAssist(NO_ASSIST);
      dispatch({ type: 'feedbackDone' });
      setMood('idle');
    });
  };

  const tray =
    def.kind === 'choice'
      ? def.tiles(instance).map((tile) => (
          <AnswerTile
            key={tile.value}
            value={tile.value}
            dots={tile.dots}
            state={tileView(state, tile.value, answer)}
            onClick={() => select(tile.value)} // під час відгуку дотик ігнорується в select; плитки не вимикаємо, щоб вони не тьмяніли (40 % — лише хибна)
          />
        ))
      : null;

  return (
    <GameFrame
      world={level.world}
      filled={filled + (celebrating ? 1 : 0)}
      arriving={celebrating ? filled : null}
      listenPulse={listenPulse}
      onMap={onMap}
      onListen={() => {
        // «Posłuchaj» повторює інструкцію лише коли дитина діє: відгук (кілька секунд) не обриваємо, інакше завдання зависло б у фазі feedback
        if (state.phase === 'play') setReplay((r) => r + 1);
      }}
      mascot={mood}
      speaking={speaking && mood !== 'correct'}
      bubble={def.bubble(instance)}
      hint={{ visible: hintAvailable(state), active: state.phase === 'feedback' && state.last === 'hint', onPress: help }}
      sceneLabel={def.sceneLabel(instance)}
      tray={tray}
      check={{ enabled: canCheck(state), onPress: check }}
    >
      {({ area, reserved, kind, tray: trayEl }) => (
        <def.Scene
          instance={instance}
          world={level.world}
          kind={kind}
          area={area}
          reserved={reserved}
          assist={assist}
          phase={state.phase}
          celebrating={celebrating}
          last={state.last}
          tray={trayEl}
          onRespond={def.kind === 'build' ? respond : undefined}
          onTouch={() => {
            stop();
            setMood('idle');
          }}
        />
      )}
    </GameFrame>
  );
}

/** Заглушка для гри, якої ще немає (M10–M19): «Dalej» зараховує завдання без запису відповіді. Лише на час розробки. */
function PlaceholderTaskView({ level, task, filled, onSolved, onMap }: Omit<TaskPlayerProps, 'planned'> & { task: PlaceholderTask }) {
  return (
    <GameFrame
      world={level.world}
      filled={filled}
      arriving={null}
      listenPulse={false}
      onMap={onMap}
      onListen={() => undefined}
      mascot="idle"
      speaking={false}
      bubble={null}
      hint={{ visible: false, active: false, onPress: () => undefined }}
      sceneLabel={GAME_TITLES[task.game]}
      check={null}
    >
      {() => (
        <div className={styles.placeholder}>
          <p>Гру «{GAME_TITLES[task.game]}» ще не реалізовано (етапи M10–M19) — це тимчасова заглушка для розробки.</p>
          <IconButton
            icon="next"
            label={BUTTONS.next}
            variant="primary"
            size={88}
            onClick={() => onSolved({ outcome: 'first', entry: null, minutes: 0 })}
          />
        </div>
      )}
    </GameFrame>
  );
}

export function TaskPlayer({ planned, ...rest }: TaskPlayerProps) {
  if (!planned.def) return <PlaceholderTaskView {...rest} task={planned.instance as PlaceholderTask} />;
  return <PlayTask {...rest} def={planned.def} instance={planned.instance} index={planned.index} />;
}

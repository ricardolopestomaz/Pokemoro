import { useCallback, useEffect, useRef, useState } from 'react';

export type TimerStatus = 'idle' | 'running' | 'finished';

interface Options {
  /** Minutos alvo. 0 = cronômetro livre. */
  targetMinutes: number;
  /** Multiplicador de velocidade (1 = real, 60 = modo demo: 1s real = 1 min). */
  speed?: number;
  onFinish?: (elapsedSeconds: number) => void;
}

/** Cronômetro baseado em timestamps (preciso mesmo com a aba em segundo plano). */
export function usePomodoroTimer({ targetMinutes, speed = 1, onFinish }: Options) {
  const [status, setStatus] = useState<TimerStatus>('idle');
  const [elapsed, setElapsed] = useState(0);
  const startRef = useRef(0);
  const finishRef = useRef(onFinish);
  finishRef.current = onFinish;

  const targetSeconds = targetMinutes * 60;

  useEffect(() => {
    if (status !== 'running') return;

    const tick = () => {
      const secs = ((Date.now() - startRef.current) / 1000) * speed;
      if (targetSeconds > 0 && secs >= targetSeconds) {
        setElapsed(targetSeconds);
        setStatus('finished');
        finishRef.current?.(targetSeconds);
      } else {
        setElapsed(secs);
      }
    };

    const id = setInterval(tick, 250);

    // Atualização instantânea ao retornar de segundo plano ou alternar de app
    const onWake = () => { tick(); };
    document.addEventListener('visibilitychange', onWake);
    window.addEventListener('focus', onWake);
    window.addEventListener('pageshow', onWake);

    return () => {
      clearInterval(id);
      document.removeEventListener('visibilitychange', onWake);
      window.removeEventListener('focus', onWake);
      window.removeEventListener('pageshow', onWake);
    };
  }, [status, speed, targetSeconds]);

  const start = useCallback((customStartTimestamp?: number) => {
    startRef.current = customStartTimestamp || Date.now();
    const currentSecs = ((Date.now() - startRef.current) / 1000) * speed;
    setElapsed(Math.max(0, currentSecs));
    setStatus('running');
  }, [speed]);

  const stop = useCallback(() => {
    const secs = ((Date.now() - startRef.current) / 1000) * speed;
    setStatus('idle');
    return Math.min(secs, targetSeconds > 0 ? targetSeconds : secs);
  }, [speed, targetSeconds]);

  const reset = useCallback(() => {
    setStatus('idle');
    setElapsed(0);
  }, []);

  const remaining = targetSeconds > 0 ? Math.max(0, targetSeconds - elapsed) : elapsed;
  const progress = targetSeconds > 0 ? Math.min(1, elapsed / targetSeconds) : (elapsed % 60) / 60;

  return { status, elapsed, remaining, progress, start, stop, reset, startTimestamp: startRef.current };
}

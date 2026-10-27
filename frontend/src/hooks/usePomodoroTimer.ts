import { useCallback, useEffect, useRef, useState } from 'react';

export type TimerStatus = 'idle' | 'running' | 'paused' | 'finished';

interface Options {
  /** Minutos alvo. 0 = cronômetro livre. */
  targetMinutes: number;
  /** Multiplicador de velocidade (1 = real, 60 = modo demo: 1s real = 1 min). */
  speed?: number;
  onFinish?: (elapsedSeconds: number) => void;
}

/** Cronômetro baseado em timestamps com suporte estrito a Pausa/Retomar no Modo Livre. */
export function usePomodoroTimer({ targetMinutes, speed = 1, onFinish }: Options) {
  const [status, setStatus] = useState<TimerStatus>('idle');
  const [elapsed, setElapsed] = useState(0);

  const startRef = useRef(0);
  const lastResumeRef = useRef(0);
  const accumulatedSecsRef = useRef(0);
  const finishRef = useRef(onFinish);
  finishRef.current = onFinish;

  const targetSeconds = targetMinutes * 60;

  useEffect(() => {
    if (status !== 'running') return;

    const tick = () => {
      const slice = ((Date.now() - lastResumeRef.current) / 1000) * speed;
      const currentElapsed = accumulatedSecsRef.current + slice;
      if (targetSeconds > 0 && currentElapsed >= targetSeconds) {
        setElapsed(targetSeconds);
        setStatus('finished');
        finishRef.current?.(targetSeconds);
      } else {
        setElapsed(currentElapsed);
      }
    };

    const id = setInterval(tick, 250);

    // Atualização instantânea ao retornar de segundo plano ou alternar de app
    const onWake = () => {
      if (status === 'running') tick();
    };
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

  const start = useCallback((customStartTimestamp?: number, initialAccumulatedSecs = 0) => {
    const now = Date.now();
    startRef.current = customStartTimestamp || now;
    lastResumeRef.current = customStartTimestamp || now;
    accumulatedSecsRef.current = Math.max(0, initialAccumulatedSecs);
    const slice = customStartTimestamp ? Math.max(0, ((now - customStartTimestamp) / 1000) * speed) : 0;
    setElapsed(accumulatedSecsRef.current + slice);
    setStatus('running');
  }, [speed]);

  const pause = useCallback(() => {
    if (status !== 'running') return;
    const slice = ((Date.now() - lastResumeRef.current) / 1000) * speed;
    accumulatedSecsRef.current += slice;
    setElapsed(accumulatedSecsRef.current);
    setStatus('paused');
  }, [status, speed]);

  const resume = useCallback(() => {
    if (status !== 'paused') return;
    lastResumeRef.current = Date.now();
    setStatus('running');
  }, [status]);

  const stop = useCallback(() => {
    let totalSecs = accumulatedSecsRef.current;
    if (status === 'running') {
      const slice = ((Date.now() - lastResumeRef.current) / 1000) * speed;
      totalSecs += slice;
    }
    setStatus('idle');
    return Math.min(totalSecs, targetSeconds > 0 ? targetSeconds : totalSecs);
  }, [status, speed, targetSeconds]);

  const reset = useCallback(() => {
    setStatus('idle');
    setElapsed(0);
    startRef.current = 0;
    lastResumeRef.current = 0;
    accumulatedSecsRef.current = 0;
  }, []);

  const remaining = targetSeconds > 0 ? Math.max(0, targetSeconds - elapsed) : elapsed;
  const progress = targetSeconds > 0 ? Math.min(1, elapsed / targetSeconds) : (elapsed % 60) / 60;

  return {
    status,
    elapsed,
    remaining,
    progress,
    start,
    pause,
    resume,
    stop,
    reset,
    startTimestamp: startRef.current,
    lastResumeTimestamp: lastResumeRef.current,
    accumulatedSecs: accumulatedSecsRef.current,
  };
}

import { useCallback, useEffect, useRef, useState } from 'react';

export const GRACE_SECONDS = 60;

/**
 * Anti-cheat "Deep Focus": acumula o tempo em que a aba/janela esteve oculta
 * enquanto `active` é true, usando timestamps (robusto a throttling de timers).
 */
export function usePageVisibility(active: boolean) {
  const outMsRef = useRef(0);
  const hiddenAtRef = useRef<number | null>(null);
  const [outSeconds, setOutSeconds] = useState(0);
  const [isOut, setIsOut] = useState(false);

  const compute = useCallback(() => {
    const live = hiddenAtRef.current ? Date.now() - hiddenAtRef.current : 0;
    return Math.floor((outMsRef.current + live) / 1000);
  }, []);

  useEffect(() => {
    if (!active) return;
    outMsRef.current = 0;
    hiddenAtRef.current = document.visibilityState === 'hidden' ? Date.now() : null;
    setOutSeconds(0);
    setIsOut(document.visibilityState === 'hidden');

    const onChange = () => {
      if (document.visibilityState === 'hidden') {
        hiddenAtRef.current = Date.now();
        setIsOut(true);
      } else {
        if (hiddenAtRef.current) outMsRef.current += Date.now() - hiddenAtRef.current;
        hiddenAtRef.current = null;
        setIsOut(false);
        setOutSeconds(compute());
      }
    };
    document.addEventListener('visibilitychange', onChange);
    const tick = setInterval(() => setOutSeconds(compute()), 1000);
    return () => {
      document.removeEventListener('visibilitychange', onChange);
      clearInterval(tick);
    };
  }, [active, compute]);

  return {
    outSeconds,
    isOut,
    deepFocus: outSeconds <= GRACE_SECONDS,
    graceLeft: Math.max(0, GRACE_SECONDS - outSeconds),
    getOutSeconds: compute,
  };
}

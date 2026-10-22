import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePomodoroTimer } from '../hooks/usePomodoroTimer';

describe('hooks/usePomodoroTimer', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('deve inicializar com status idle e progresso 0', () => {
    const { result } = renderHook(() =>
      usePomodoroTimer({ targetMinutes: 25 })
    );

    expect(result.current.status).toBe('idle');
    expect(result.current.elapsed).toBe(0);
    expect(result.current.remaining).toBe(1500); // 25 * 60
    expect(result.current.progress).toBe(0);
  });

  it('deve iniciar o timer e avançar o tempo decorrido', () => {
    const { result } = renderHook(() =>
      usePomodoroTimer({ targetMinutes: 25 })
    );

    act(() => {
      result.current.start();
    });

    expect(result.current.status).toBe('running');

    act(() => {
      vi.advanceTimersByTime(2000); // 2 segundos
    });

    expect(result.current.elapsed).toBeGreaterThanOrEqual(2);
    expect(result.current.remaining).toBeLessThanOrEqual(1498);
  });

  it('deve disparar onFinish e mudar status para finished ao atingir a meta', () => {
    const onFinish = vi.fn();
    const { result } = renderHook(() =>
      usePomodoroTimer({ targetMinutes: 1, speed: 60, onFinish }) // 1 min com speed 60 = 1 segundo real
    );

    act(() => {
      result.current.start();
    });

    act(() => {
      vi.advanceTimersByTime(1100);
    });

    expect(result.current.status).toBe('finished');
    expect(onFinish).toHaveBeenCalledWith(60);
    expect(result.current.remaining).toBe(0);
    expect(result.current.progress).toBe(1);
  });

  it('stop deve interromper o timer e retornar os segundos decorridos', () => {
    const { result } = renderHook(() =>
      usePomodoroTimer({ targetMinutes: 25 })
    );

    act(() => {
      result.current.start();
    });

    act(() => {
      vi.advanceTimersByTime(5000);
    });

    let stoppedSecs = 0;
    act(() => {
      stoppedSecs = result.current.stop();
    });

    expect(result.current.status).toBe('idle');
    expect(stoppedSecs).toBeGreaterThanOrEqual(5);
  });

  it('reset deve zerar os dados do timer', () => {
    const { result } = renderHook(() =>
      usePomodoroTimer({ targetMinutes: 25 })
    );

    act(() => {
      result.current.start();
      vi.advanceTimersByTime(3000);
      result.current.reset();
    });

    expect(result.current.status).toBe('idle');
    expect(result.current.elapsed).toBe(0);
  });
});

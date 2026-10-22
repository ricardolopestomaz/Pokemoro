import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePageVisibility, GRACE_SECONDS } from '../hooks/usePageVisibility';

describe('hooks/usePageVisibility (Deep Focus Anti-Cheat)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      value: 'visible',
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('deve manter deepFocus=true quando usuário não sai da aba', () => {
    const { result } = renderHook(() => usePageVisibility(true));

    expect(result.current.deepFocus).toBe(true);
    expect(result.current.isOut).toBe(false);
    expect(result.current.outSeconds).toBe(0);
    expect(result.current.graceLeft).toBe(GRACE_SECONDS);
  });

  it('deve detectar quando a aba fica oculta (hidden) e computar tempo fora', () => {
    const { result } = renderHook(() => usePageVisibility(true));

    act(() => {
      Object.defineProperty(document, 'visibilityState', {
        configurable: true,
        value: 'hidden',
      });
      document.dispatchEvent(new Event('visibilitychange'));
    });

    expect(result.current.isOut).toBe(true);

    // Passa 30 segundos fora
    act(() => {
      vi.advanceTimersByTime(30000);
    });

    expect(result.current.outSeconds).toBe(30);
    expect(result.current.graceLeft).toBe(30);
    expect(result.current.deepFocus).toBe(true); // Ainda dentro da tolerância de 60s
  });

  it('deve desativar deepFocus quando o tempo fora ultrapassar 60s (grace period)', () => {
    const { result } = renderHook(() => usePageVisibility(true));

    act(() => {
      Object.defineProperty(document, 'visibilityState', {
        configurable: true,
        value: 'hidden',
      });
      document.dispatchEvent(new Event('visibilitychange'));
    });

    // Passa 65 segundos fora (> GRACE_SECONDS)
    act(() => {
      vi.advanceTimersByTime(65000);
    });

    expect(result.current.outSeconds).toBe(65);
    expect(result.current.graceLeft).toBe(0);
    expect(result.current.deepFocus).toBe(false); // Perdeu o bônus Deep Focus 1.2x
  });

  it('não deve acumular tempo quando o hook estiver inativo (active = false)', () => {
    const { result } = renderHook(() => usePageVisibility(false));

    act(() => {
      Object.defineProperty(document, 'visibilityState', {
        configurable: true,
        value: 'hidden',
      });
      document.dispatchEvent(new Event('visibilitychange'));
      vi.advanceTimersByTime(40000);
    });

    expect(result.current.outSeconds).toBe(0);
    expect(result.current.deepFocus).toBe(true);
  });
});

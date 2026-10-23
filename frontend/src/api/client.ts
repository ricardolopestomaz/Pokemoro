const isNative = typeof window !== 'undefined' && Boolean((window as any).Capacitor?.isNativePlatform?.());
const defaultHost = typeof window !== 'undefined' && window.location.hostname !== 'localhost'
  ? `http://${window.location.hostname}:3001`
  : isNative
    ? 'http://192.168.10.103:3001'
    : 'http://localhost:3001';

export const API_BASE = (import.meta.env.VITE_API_URL as string | undefined) ?? defaultHost;

export class ApiError extends Error {
  constructor(message: string, public status: number) {
    super(message);
  }
}

export async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
  });
  const text = await res.text();
  let data: any = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = null;
    }
  }
  if (!res.ok) {
    const errorMsg = data?.error ?? data?.message ?? (text && !text.startsWith('<') ? text : `Erro ${res.status}`);
    throw new ApiError(errorMsg, res.status);
  }
  return data as T;
}

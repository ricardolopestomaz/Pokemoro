import type { AppSettings } from '../types';
import { setMuted, setHapticsEnabled } from './sfx';

const KEY_SETTINGS = 'pokemoro_settings';

export const DEFAULT_SETTINGS: AppSettings = {
  lowPowerMode: false,
  enableFoilEffect: true,
  enableConfetti: true,
  enableTeamRoaming: true,
  enableVisualEffects: true,
  enableAudio: true,
  enableHaptics: true,
};

export const LOW_POWER_PRESET: AppSettings = {
  lowPowerMode: true,
  enableFoilEffect: false,
  enableConfetti: false,
  enableTeamRoaming: false,
  enableVisualEffects: false,
  enableAudio: true,
  enableHaptics: false,
};

export function loadSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(KEY_SETTINGS);
    const parsed = raw ? JSON.parse(raw) : {};
    const settings: AppSettings = { ...DEFAULT_SETTINGS, ...parsed };
    setMuted(!settings.enableAudio);
    setHapticsEnabled(settings.enableHaptics);
    return settings;
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export function saveSettings(settings: AppSettings): void {
  try {
    localStorage.setItem(KEY_SETTINGS, JSON.stringify(settings));
    // Sincroniza estado com módulo de áudio e háptico
    setMuted(!settings.enableAudio);
    setHapticsEnabled(settings.enableHaptics);
  } catch {}
}

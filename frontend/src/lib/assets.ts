import { API_BASE } from '../api/client';
import type { EnvironmentId, SleepStyle, PokemonVariant, StudyRole } from '../types';

export const ENVIRONMENTS: Record<string, { file: string; label: string; emoji: string }> = {
  greengrass: { file: 'cenario_pokemon_sleep_9_16.png', label: 'Ilha Verdejante', emoji: '🌿' },
  beach: { file: 'cenario_praia_ciano.png', label: 'Praia Ciano', emoji: '🏖️' },
  tundra: { file: 'cenario_tundra_neve.png', label: 'Tundra de Neve', emoji: '❄️' },
  cave: { file: 'cenario_caverna_taupe.png', label: 'Caverna Toupeira', emoji: '💎' },
  study_room: { file: 'cenario_sala_estudos.png', label: 'Sala de Estudos', emoji: '📚' },
};

export const envUrl = (env: EnvironmentId | string) =>
  `${API_BASE}/assets/${(ENVIRONMENTS[env] ?? ENVIRONMENTS.greengrass).file}`;

const pad = (id: number) => String(id).padStart(4, '0');

export const sleepSprite = (id: number, style: SleepStyle, variant: PokemonVariant = 'regular') =>
  `${API_BASE}/sprites/sleep/${variant}/${pad(id)}-${style}${variant === 'shiny' ? '_s' : ''}.png`;

export const menuSprite = (id: number, variant: PokemonVariant = 'regular') =>
  `${API_BASE}/sprites/menu/${variant}/${pad(id)}${variant === 'shiny' ? '_s' : ''}.png`;

export const caterpieIcon = `${API_BASE}/assets/icon_caterpie_frente.png`;

export const STYLE_NAMES: Record<SleepStyle, string> = {
  1: 'Dormindo de Lado',
  2: 'Dormindo Aconchegado',
  3: 'Dormindo de Barriga',
};

export const STYLE_BLURBS: Record<SleepStyle, string> = {
  1: 'Adormeceu tranquilo depois de ver você estudar tanto!',
  2: 'Se aconchegou ao seu lado para descansar a mente.',
  3: 'Está tão relaxado que dorme de barriga para cima!',
};

export const ROLE_INFO: Record<StudyRole, { label: string; emoji: string; color: string }> = {
  SUBJECT_EXACT: { label: 'Exatas & Tech', emoji: '⚡', color: '#FFCB05' },
  SUBJECT_HUMAN: { label: 'Humanas', emoji: '📖', color: '#A78BFA' },
  ITEMS: { label: 'Itens & Café', emoji: '☕', color: '#FF8C42' },
  STAMINA: { label: 'Stamina & Retenção', emoji: '🌿', color: '#48D0B0' },
  ENERGY: { label: 'Energia & Motivação', emoji: '🔥', color: '#FF5B84' },
};

export const formatTime = (totalSeconds: number) => {
  const s = Math.max(0, Math.floor(totalSeconds));
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
};

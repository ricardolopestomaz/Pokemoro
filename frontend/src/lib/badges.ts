/**
 * Sistema de Insígnias de Ginásio do Pokémoro.
 * A cada 10 dias de ofensiva (streak) o treinador conquista 1 insígnia.
 * A conquista é permanente: guardamos o maior streak já atingido,
 * então perder a ofensiva NÃO remove insígnias já ganhas.
 */

export const BADGE_STEP_DAYS = 10;
const KEY_MAX_STREAK = 'pokemoro_max_streak';

export interface BadgeTier {
  id: string;
  name: string;
  gym: string;
  color: string;
  dark: string;
  shape: 'round' | 'diamond' | 'star' | 'drop' | 'flame' | 'hex' | 'heart' | 'leaf';
}

/** 8 insígnias de Kanto — repetem em ciclo (Brilhante) após a 8ª. */
export const BADGE_TIERS: BadgeTier[] = [
  { id: 'boulder', name: 'Insígnia Pedra', gym: 'Ginásio de Pewter', color: '#9CA3AF', dark: '#4B5563', shape: 'hex' },
  { id: 'cascade', name: 'Insígnia Cascata', gym: 'Ginásio de Cerulean', color: '#38BDF8', dark: '#0369A1', shape: 'drop' },
  { id: 'thunder', name: 'Insígnia Trovão', gym: 'Ginásio de Vermilion', color: '#FACC15', dark: '#A16207', shape: 'star' },
  { id: 'rainbow', name: 'Insígnia Arco-Íris', gym: 'Ginásio de Celadon', color: '#4ADE80', dark: '#15803D', shape: 'leaf' },
  { id: 'soul', name: 'Insígnia Alma', gym: 'Ginásio de Fuchsia', color: '#F472B6', dark: '#9D174D', shape: 'heart' },
  { id: 'marsh', name: 'Insígnia Pântano', gym: 'Ginásio de Saffron', color: '#A78BFA', dark: '#5B21B6', shape: 'diamond' },
  { id: 'volcano', name: 'Insígnia Vulcão', gym: 'Ginásio de Cinnabar', color: '#FB923C', dark: '#C2410C', shape: 'flame' },
  { id: 'earth', name: 'Insígnia Terra', gym: 'Ginásio de Viridian', color: '#A16207', dark: '#451A03', shape: 'round' },
];

export function badgeCountForStreak(streakDays: number): number {
  return Math.max(0, Math.floor((streakDays || 0) / BADGE_STEP_DAYS));
}

export function getBadgeTier(index: number): BadgeTier {
  return BADGE_TIERS[((index % BADGE_TIERS.length) + BADGE_TIERS.length) % BADGE_TIERS.length];
}

/** Retorna a URL do arquivo GIF local da insígnia (de 01.gif a 08.gif) */
export function getBadgeGifUrl(index: number): string {
  const badgeNum = (Math.abs(index) % BADGE_TIERS.length) + 1;
  const formatted = badgeNum < 10 ? `0${badgeNum}` : `${badgeNum}`;
  return `/badges/${formatted}.gif`;
}

/** Retorna a URL do Serebii como fallback online direto */
export function getBadgeFallbackGifUrl(index: number): string {
  const badgeNum = (Math.abs(index) % BADGE_TIERS.length) + 1;
  const formatted = badgeNum < 10 ? `0${badgeNum}` : `${badgeNum}`;
  return `https://www.serebii.net/badges/${formatted}.gif`;
}

export function getMaxStreak(): number {
  try {
    return Number(localStorage.getItem(KEY_MAX_STREAK)) || 0;
  } catch {
    return 0;
  }
}

/** Número de insígnias já conquistadas pelo jogador local (considera o maior streak da história). */
export function getEarnedBadgeCount(currentStreak = 0): number {
  return badgeCountForStreak(Math.max(getMaxStreak(), currentStreak));
}

/**
 * Registra o streak atual e devolve quantas insígnias NOVAS foram conquistadas
 * desde a última verificação (para disparar celebração apenas uma vez).
 */
export function registerStreak(currentStreak: number): { total: number; newlyEarned: number } {
  const before = badgeCountForStreak(getMaxStreak());
  const max = Math.max(getMaxStreak(), currentStreak || 0);
  try {
    localStorage.setItem(KEY_MAX_STREAK, String(max));
  } catch {}
  const total = badgeCountForStreak(max);
  return { total, newlyEarned: Math.max(0, total - before) };
}

/** Progresso rumo à próxima insígnia (0..1) e dias restantes. */
export function nextBadgeProgress(currentStreak: number): { progress: number; daysLeft: number; nextIndex: number } {
  const streak = Math.max(0, currentStreak || 0);
  const into = streak % BADGE_STEP_DAYS;
  return {
    progress: into / BADGE_STEP_DAYS,
    daysLeft: BADGE_STEP_DAYS - into,
    nextIndex: badgeCountForStreak(Math.max(getMaxStreak(), streak)),
  };
}

import type { MagikarpUserProgressDTO } from '../../types/magikarp-event';

const PROGRESS_STORAGE_KEY_PREFIX = 'POKEMORO_MAGIKARP_PROGRESS_';
const CUTSCENE_SEEN_PREFIX = 'POKEMORO_MAGIKARP_CLIMAX_SEEN_';

export function getLocalUserEventProgress(userId: string, cycleYear: number): MagikarpUserProgressDTO {
  const key = `${PROGRESS_STORAGE_KEY_PREFIX}${userId}_${cycleYear}`;
  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      return JSON.parse(raw) as MagikarpUserProgressDTO;
    }
  } catch {
    // fallback
  }

  return {
    userId,
    cycleYear,
    eventMinutesStudied: 0,
    jumpMeters: 0,
    claimedMilestoneIds: [],
    highestMiniGameJumpMeters: 0,
    unlockedGyaradosShiny: false,
    unlockedTieMagikarp: false,
    unlockedFurySkin: false,
    unlockedSwimmerTitle: false,
  };
}

export function saveLocalUserEventProgress(progress: MagikarpUserProgressDTO): void {
  const key = `${PROGRESS_STORAGE_KEY_PREFIX}${progress.userId}_${progress.cycleYear}`;
  try {
    localStorage.setItem(key, JSON.stringify(progress));
  } catch {
    // noop
  }
}

export function recordEventMinutes(userId: string, cycleYear: number, additionalMinutes: number): MagikarpUserProgressDTO {
  const progress = getLocalUserEventProgress(userId, cycleYear);
  progress.eventMinutesStudied += additionalMinutes;
  progress.jumpMeters = progress.eventMinutesStudied * 10;
  saveLocalUserEventProgress(progress);
  return progress;
}

export function claimEventMilestone(
  userId: string,
  cycleYear: number,
  milestoneId: string
): MagikarpUserProgressDTO {
  const progress = getLocalUserEventProgress(userId, cycleYear);
  if (!progress.claimedMilestoneIds.includes(milestoneId)) {
    progress.claimedMilestoneIds.push(milestoneId);
    if (milestoneId === 'm_25min') progress.unlockedSwimmerTitle = true;
    if (milestoneId === 'm_50min') progress.unlockedFurySkin = true;
    if (milestoneId === 'm_100min') progress.unlockedTieMagikarp = true;
    if (milestoneId === 'comm_100pct') progress.unlockedGyaradosShiny = true;
    saveLocalUserEventProgress(progress);
  }
  return progress;
}

export function recordMiniGameJump(
  userId: string,
  cycleYear: number,
  jumpMeters: number
): MagikarpUserProgressDTO {
  const progress = getLocalUserEventProgress(userId, cycleYear);
  if (jumpMeters > progress.highestMiniGameJumpMeters) {
    progress.highestMiniGameJumpMeters = jumpMeters;
    saveLocalUserEventProgress(progress);
  }
  return progress;
}

export function hasSeenClimaxCutscene(cycleYear: number): boolean {
  try {
    return localStorage.getItem(`${CUTSCENE_SEEN_PREFIX}${cycleYear}`) === 'true';
  } catch {
    return false;
  }
}

export function setClimaxCutsceneSeen(cycleYear: number, seen = true): void {
  try {
    localStorage.setItem(`${CUTSCENE_SEEN_PREFIX}${cycleYear}`, seen ? 'true' : 'false');
  } catch {
    // noop
  }
}

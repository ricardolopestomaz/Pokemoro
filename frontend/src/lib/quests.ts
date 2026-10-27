/**
 * Sistema de Missões Diárias do Professor Ricardo.
 * Incentiva hábitos consistentes de estudo com recompensas automáticas que resetam à meia-noite.
 */

export interface DailyQuest {
  id: string;
  title: string;
  desc: string;
  icon: string;
  target: number;
  current: number;
  completed: boolean;
  claimed: boolean;
  rewardType: 'coins' | 'biscuit_basic' | 'biscuit_great';
  rewardAmount: number;
  rewardLabel: string;
}

const STORAGE_KEY = 'pokemoro_daily_quests';

function getTodayKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function loadDailyQuests(): DailyQuest[] {
  const today = getTodayKey();
  try {
    const raw = localStorage.getItem(`${STORAGE_KEY}_${today}`);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch {}

  // Quests padrão geradas para o dia
  const initialQuests: DailyQuest[] = [
    {
      id: 'quest_study_minutes',
      title: 'Foco do Dia',
      desc: 'Estude pelo menos 25 minutos no Pomodoro ou Modo Livre.',
      icon: '⏱️',
      target: 25,
      current: 0,
      completed: false,
      claimed: false,
      rewardType: 'coins',
      rewardAmount: 60,
      rewardLabel: '+60 Moedas 🪙',
    },
    {
      id: 'quest_feed_snack',
      title: 'Lanche dos Parceiros',
      desc: 'Alimente 1 Pokémon com biscoito no intervalo de descanso.',
      icon: '🍪',
      target: 1,
      current: 0,
      completed: false,
      claimed: false,
      rewardType: 'biscuit_basic',
      rewardAmount: 1,
      rewardLabel: '+1 Biscoito de Café 🍪',
    },
    {
      id: 'quest_photo_dex',
      title: 'Fotógrafo Pokémon',
      desc: 'Fotografe e registre 1 pose de sono na Focus Dex.',
      icon: '📸',
      target: 1,
      current: 0,
      completed: false,
      claimed: false,
      rewardType: 'coins',
      rewardAmount: 80,
      rewardLabel: '+80 Moedas 🪙',
    },
  ];

  saveDailyQuests(initialQuests);
  return initialQuests;
}

export function saveDailyQuests(quests: DailyQuest[]): void {
  const today = getTodayKey();
  try {
    localStorage.setItem(`${STORAGE_KEY}_${today}`, JSON.stringify(quests));
  } catch {}
}

export function recordQuestAction(
  type: 'study' | 'feed' | 'photo',
  amount = 1
): { quests: DailyQuest[]; newlyCompleted: boolean } {
  const quests = loadDailyQuests();
  let newlyCompleted = false;

  for (const q of quests) {
    if (type === 'study' && q.id === 'quest_study_minutes') {
      q.current = Math.min(q.target, q.current + amount);
      if (q.current >= q.target && !q.completed) {
        q.completed = true;
        newlyCompleted = true;
      }
    } else if (type === 'feed' && q.id === 'quest_feed_snack') {
      q.current = Math.min(q.target, q.current + amount);
      if (q.current >= q.target && !q.completed) {
        q.completed = true;
        newlyCompleted = true;
      }
    } else if (type === 'photo' && q.id === 'quest_photo_dex') {
      q.current = Math.min(q.target, q.current + amount);
      if (q.current >= q.target && !q.completed) {
        q.completed = true;
        newlyCompleted = true;
      }
    }
  }

  saveDailyQuests(quests);
  return { quests, newlyCompleted };
}

export function claimDailyReward(questId: string): { success: boolean; quest?: DailyQuest } {
  const quests = loadDailyQuests();
  const quest = quests.find((q) => q.id === questId);
  if (!quest || !quest.completed || quest.claimed) {
    return { success: false };
  }

  quest.claimed = true;
  saveDailyQuests(quests);
  return { success: true, quest };
}

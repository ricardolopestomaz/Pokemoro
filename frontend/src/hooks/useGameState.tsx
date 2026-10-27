import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { api } from '../api/endpoints';
import { loadSettings, saveSettings, LOW_POWER_PRESET, DEFAULT_SETTINGS } from '../lib/settings';
import type {
  AppSettings, BiscuitInventory, CoffeeBreak, FocusDex, SpawnedPokemon, Subject, TabId, TeamResponse, UserPokemon, UserProfile,
} from '../types';

interface Toast { id: number; text: string; tone: 'ok' | 'error' | 'info' }

interface GameState {
  loading: boolean;
  offline: boolean;
  profile: UserProfile | null;
  subjects: Subject[];
  coffeeBreak: CoffeeBreak | null;
  team: TeamResponse | null;
  collection: UserPokemon[];
  dex: FocusDex | null;
  tab: TabId;
  setTab: (t: TabId) => void;
  toasts: Toast[];
  toast: (text: string, tone?: Toast['tone']) => void;
  settings: AppSettings;
  updateSettings: (patch: Partial<AppSettings>) => void;
  toggleLowPowerMode: () => void;
  refreshAll: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  refreshBreak: () => Promise<void>;
  refreshTeam: () => Promise<void>;
  refreshDex: () => Promise<void>;
  refreshSubjects: () => Promise<void>;
  patchInventory: (inv: BiscuitInventory) => void;
  patchSpawn: (spawnId: string, patch: Partial<SpawnedPokemon>) => void;
  removeSpawn: (spawnId: string) => void;
  renamePokemon: (id: string | number, nickname: string) => Promise<UserPokemon>;
  evolvePokemon: (id: string | number) => Promise<{ evolvedPokemon: UserPokemon; evolutionNode: any }>;
  /** Biscoito de café (básico) mostrado no HUD */
  coinsLabel: string;
}

const Ctx = createContext<GameState | null>(null);

export function GameProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [offline, setOffline] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [coffeeBreak, setCoffeeBreak] = useState<CoffeeBreak | null>(null);
  const [team, setTeam] = useState<TeamResponse | null>(null);
  const [collection, setCollection] = useState<UserPokemon[]>([]);
  const [dex, setDex] = useState<FocusDex | null>(null);
  const [tab, setTab] = useState<TabId>(() => {
    try {
      const raw = localStorage.getItem('pokemoro_active_session');
      if (raw) {
        const saved = JSON.parse(raw);
        if (saved && saved.sessionId) {
          return 'focus';
        }
      }
    } catch {}
    return 'rest';
  });
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [settings, setSettings] = useState<AppSettings>(() => loadSettings());

  const updateSettings = useCallback((patch: Partial<AppSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      saveSettings(next);
      return next;
    });
  }, []);

  const toggleLowPowerMode = useCallback(() => {
    setSettings((prev) => {
      const next = prev.lowPowerMode
        ? { ...DEFAULT_SETTINGS, lowPowerMode: false }
        : { ...LOW_POWER_PRESET };
      saveSettings(next);
      return next;
    });
  }, []);

  const toast = useCallback((text: string, tone: Toast['tone'] = 'info') => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, text, tone }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3200);
  }, []);

  const refreshProfile = useCallback(async () => setProfile(await api.getProfile()), []);
  const refreshSubjects = useCallback(async () => setSubjects(await api.getSubjects()), []);
  const refreshBreak = useCallback(async () => setCoffeeBreak(await api.getActiveBreak()), []);
  const refreshTeam = useCallback(async () => {
    const [t, c] = await Promise.all([api.getTeam(), api.getCollection()]);
    setTeam(t);
    setCollection(c);
  }, []);
  const refreshDex = useCallback(async () => setDex(await api.getDex()), []);

  const refreshAll = useCallback(async () => {
    try {
      await refreshProfile(); // garante que o usuário local exista antes das demais chamadas
      await Promise.all([refreshSubjects(), refreshBreak(), refreshTeam(), refreshDex()]);
      setOffline(false);
    } catch {
      setOffline(true);
    } finally {
      setLoading(false);
    }
  }, [refreshProfile, refreshSubjects, refreshBreak, refreshTeam, refreshDex]);

  useEffect(() => { void refreshAll(); }, [refreshAll]);

  // Monitoramento dinâmico da Meia-Noite (Zera a ofensiva no Supabase e no app se o usuário não estudou)
  useEffect(() => {
    const handleMidnightCheck = async () => {
      try {
        const { reset } = api.checkMidnightStreak();
        if (reset) {
          await refreshProfile();
          toast('Sua sequência terminou à meia-noite. Estude hoje para acender seu foguinho! 🔥', 'info');
        }
      } catch {}
    };

    // Checa a cada 30 segundos se virou a meia-noite
    const interval = setInterval(handleMidnightCheck, 30000);

    // Checa também quando a aba ou app mobile volta ao foco
    const onVisibilityOrFocus = () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        void handleMidnightCheck();
        void refreshBreak();
      }
    };

    window.addEventListener('visibilitychange', onVisibilityOrFocus);
    window.addEventListener('focus', onVisibilityOrFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener('visibilitychange', onVisibilityOrFocus);
      window.removeEventListener('focus', onVisibilityOrFocus);
    };
  }, [refreshProfile, refreshBreak, toast]);

  const patchInventory = useCallback((inventory: BiscuitInventory) => {
    setProfile((p) => (p ? { ...p, inventory } : p));
  }, []);

  const patchSpawn = useCallback((spawnId: string, patch: Partial<SpawnedPokemon>) => {
    setCoffeeBreak((cb) =>
      cb ? { ...cb, spawns: cb.spawns.map((s) => (s.spawnId === spawnId ? { ...s, ...patch } : s)) } : cb,
    );
  }, []);

  const removeSpawn = useCallback((spawnId: string) => {
    void api.removeSpawn(spawnId);
    setCoffeeBreak((cb) => {
      if (!cb) return null;
      const remaining = cb.spawns.filter((s) => s.spawnId !== spawnId);
      if (remaining.length === 0) return null;
      return { ...cb, spawns: remaining };
    });
  }, []);

  const renamePokemon = useCallback(async (id: string | number, nickname: string) => {
    const updated = await api.renamePokemon(id, nickname);
    await refreshTeam();
    toast(`Nome atualizado para "${nickname}"!`, 'ok');
    return updated;
  }, [refreshTeam, toast]);

  const evolvePokemon = useCallback(async (id: string | number) => {
    const result = await api.evolvePokemon(id);
    await Promise.all([refreshTeam(), refreshDex()]);
    toast(`Parabéns! Evoluiu para ${result.evolutionNode.evolvedName}!`, 'ok');
    return result;
  }, [refreshTeam, refreshDex, toast]);

  const value = useMemo<GameState>(() => ({
    loading, offline, profile, subjects, coffeeBreak, team, collection, dex, tab, setTab, toasts, toast,
    settings, updateSettings, toggleLowPowerMode,
    refreshAll, refreshProfile, refreshBreak, refreshTeam, refreshDex, refreshSubjects, patchInventory, patchSpawn, removeSpawn,
    renamePokemon, evolvePokemon,
    coinsLabel: String(profile?.focusCoins ?? 0),
  }), [loading, offline, profile, subjects, coffeeBreak, team, collection, dex, tab, toasts, toast,
    settings, updateSettings, toggleLowPowerMode,
    refreshAll, refreshProfile, refreshBreak, refreshTeam, refreshDex, refreshSubjects, patchInventory, patchSpawn, removeSpawn,
    renamePokemon, evolvePokemon]);


  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useGame() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useGame deve ser usado dentro de <GameProvider>');
  return ctx;
}

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
  const [tab, setTab] = useState<TabId>('rest');
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

  const patchInventory = useCallback((inventory: BiscuitInventory) => {
    setProfile((p) => (p ? { ...p, inventory } : p));
  }, []);

  const patchSpawn = useCallback((spawnId: string, patch: Partial<SpawnedPokemon>) => {
    setCoffeeBreak((cb) =>
      cb ? { ...cb, spawns: cb.spawns.map((s) => (s.spawnId === spawnId ? { ...s, ...patch } : s)) } : cb,
    );
  }, []);

  const removeSpawn = useCallback((spawnId: string) => {
    setCoffeeBreak((cb) =>
      cb ? { ...cb, spawns: cb.spawns.filter((s) => s.spawnId !== spawnId) } : cb,
    );
  }, []);

  const value = useMemo<GameState>(() => ({
    loading, offline, profile, subjects, coffeeBreak, team, collection, dex, tab, setTab, toasts, toast,
    settings, updateSettings, toggleLowPowerMode,
    refreshAll, refreshProfile, refreshBreak, refreshTeam, refreshDex, refreshSubjects, patchInventory, patchSpawn, removeSpawn,
    coinsLabel: String(profile?.focusCoins ?? 0),
  }), [loading, offline, profile, subjects, coffeeBreak, team, collection, dex, tab, toasts, toast,
    settings, updateSettings, toggleLowPowerMode,
    refreshAll, refreshProfile, refreshBreak, refreshTeam, refreshDex, refreshSubjects, patchInventory, patchSpawn, removeSpawn]);


  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useGame() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useGame deve ser usado dentro de <GameProvider>');
  return ctx;
}

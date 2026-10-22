import { useCallback, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { GameProvider, useGame } from './hooks/useGameState';
import { MobileFrame } from './components/layout/MobileFrame';
import { TopHUD } from './components/layout/TopHUD';
import { BottomNav } from './components/layout/BottomNav';
import { Toasts } from './components/layout/Toasts';
import { Campsite } from './components/campsite/Campsite';
import { PomodoroScreen } from './components/pomodoro/PomodoroScreen';
import { PolaroidModal } from './components/dex/PolaroidModal';
import { SnackPanel } from './components/snack/SnackPanel';
import { ShopSheet } from './components/snack/ShopSheet';
import { TeamScreen } from './components/team/TeamScreen';
import { DexScreen } from './components/dex/DexScreen';
import { caterpieIcon, envUrl } from './lib/assets';
import type { SpawnedPokemon } from './types';

function Splash({ offline, onRetry }: { offline: boolean; onRetry: () => void }) {
  return (
    <div className="absolute inset-0 z-[80] flex flex-col items-center justify-center gap-4 bg-gradient-to-b from-leaf to-ocean p-8 text-center text-white">
      <img src={caterpieIcon} alt="Pokémoro" className="h-28 w-28 rounded-[1.6rem] shadow-2xl" />
      <h1 className="text-3xl font-black drop-shadow">Pokémoro</h1>
      {offline ? (
        <>
          <p className="text-sm font-extrabold">Não consegui falar com o servidor em localhost:3001.</p>
          <code className="rounded-xl bg-black/25 px-3 py-2 text-xs">cd backend &amp;&amp; npm start</code>
          <button id="btn-retry" className="btn" onClick={onRetry}>Tentar novamente</button>
        </>
      ) : (
        <p className="animate-pulse text-sm font-extrabold">Acordando os Pokémon...</p>
      )}
    </div>
  );
}

function Shell() {
  const { loading, offline, profile, tab, refreshAll } = useGame();
  const [sessionRunning, setSessionRunning] = useState(false);
  const [active, setActive] = useState<{ spawnId: string; stage: 'polaroid' | 'snack' } | null>(null);
  const [seen, setSeen] = useState<Set<string>>(new Set());
  const [shop, setShop] = useState(false);
  const { coffeeBreak } = useGame();

  const openSpawn = useCallback((s: SpawnedPokemon) => {
    setActive({ spawnId: s.spawnId, stage: seen.has(s.spawnId) ? 'snack' : 'polaroid' });
  }, [seen]);

  const spawn = coffeeBreak?.spawns.find((s) => s.spawnId === active?.spawnId);
  const bg = envUrl(profile?.activeEnvironment ?? 'greengrass');

  return (
    <MobileFrame>
      <img src={bg} alt="" className="absolute inset-0 h-full w-full object-cover" draggable={false} />

      {(loading || offline) && <Splash offline={offline} onRetry={() => void refreshAll()} />}

      {!loading && !offline && (
        <>
          <TopHUD onShop={() => setShop(true)} />
          {tab === 'rest' && <Campsite onOpenSpawn={openSpawn} />}
          {/* O Pomodoro permanece montado para o timer sobreviver à troca de abas */}
          <div className={tab === 'focus' ? '' : 'hidden'}>
            <PomodoroScreen onRunningChange={setSessionRunning} />
          </div>
          {tab === 'team' && <TeamScreen />}
          {tab === 'dex' && <DexScreen />}
          {!sessionRunning && <BottomNav />}

          <AnimatePresence>
            {active && spawn && active.stage === 'polaroid' && (
              <PolaroidModal
                key="polaroid"
                spawn={spawn}
                onClose={() => setActive(null)}
                onRegister={() => {
                  setSeen((s) => new Set(s).add(spawn.spawnId));
                  setActive({ spawnId: spawn.spawnId, stage: 'snack' });
                }}
              />
            )}
            {active && spawn && active.stage === 'snack' && (
              <SnackPanel key="snack" spawnId={spawn.spawnId} onClose={() => setActive(null)} />
            )}
            {shop && <ShopSheet key="shop" onClose={() => setShop(false)} />}
          </AnimatePresence>
          <Toasts />
        </>
      )}
    </MobileFrame>
  );
}

export default function App() {
  return (
    <GameProvider>
      <Shell />
    </GameProvider>
  );
}

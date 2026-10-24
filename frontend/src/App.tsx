import { useCallback, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { motion } from 'framer-motion';
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
import { DiaryScreen } from './components/diary/DiaryScreen';
import { OnboardingTour } from './components/onboarding/OnboardingTour';
import { caterpieIcon, envUrl } from './lib/assets';
import type { SpawnedPokemon, TabId } from './types';

function Splash({ offline, onRetry }: { offline: boolean; onRetry: () => void }) {
  return (
    <div className="absolute inset-0 z-[80] flex flex-col items-center justify-center gap-4 bg-gradient-to-b from-leaf to-ocean p-8 text-center text-white">
      <img src={caterpieIcon} alt="Pokémoro" className="h-28 w-28 rounded-[1.6rem] shadow-2xl" />
      <h1 className="text-3xl font-black drop-shadow">Pokémoro</h1>
      {offline ? (
        <>
          <p className="text-sm font-extrabold">Não foi possível carregar os dados locais do aplicativo.</p>
          <button id="btn-retry" className="btn bg-white text-emerald-700 font-black shadow-lg mt-2" onClick={onRetry}>Tentar novamente</button>
        </>
      ) : (
        <p className="animate-pulse text-sm font-extrabold">Acordando os Pokémon...</p>
      )}
    </div>
  );
}

function Shell() {
  const { loading, offline, profile, tab, setTab, refreshAll } = useGame();
  const [sessionRunning, setSessionRunning] = useState(false);
  const [active, setActive] = useState<{ spawnId: string; stage: 'polaroid' | 'snack'; photoDataUrl?: string } | null>(null);
  const [seen, setSeen] = useState<Set<string>>(new Set());
  const [shop, setShop] = useState(false);
  const [tourTimer, setTourTimer] = useState<{ seconds: number; running: boolean } | null>(null);
  const { coffeeBreak } = useGame();

  const openSpawn = useCallback((s: SpawnedPokemon, photoDataUrl?: string) => {
    setActive({
      spawnId: s.spawnId,
      stage: seen.has(s.spawnId) ? 'snack' : 'polaroid',
      photoDataUrl: photoDataUrl || s.photoDataUrl || undefined,
    });
  }, [seen]);

  // Callback para o tour mudar aba
  const handleTourSetTab = useCallback((t: TabId) => {
    setTab(t);
  }, [setTab]);

  const spawn = coffeeBreak?.spawns.find((s) => s.spawnId === active?.spawnId);
  const bg = envUrl(profile?.activeEnvironment ?? 'greengrass');
  const isTour = profile !== null && !profile.hasCompletedOnboarding;

  return (
    <MobileFrame>
      <img src={bg} alt="" className="absolute inset-0 h-full w-full object-cover" draggable={false} />

      {(loading || offline) && <Splash offline={offline} onRetry={() => void refreshAll()} />}

      {!loading && !offline && (
        <>
          {/* Telas reais sempre montadas durante o tour (para mostrar a aba certa) */}
          <TopHUD onShop={() => setShop(true)} />
          {tab === 'rest' && (
            <div className="absolute inset-0 z-10">
              <Campsite onOpenSpawn={openSpawn} isTour={isTour} />
            </div>
          )}
          {/* O Pomodoro permanece montado para o timer sobreviver à troca de abas */}
          <div className={tab === 'focus' ? '' : 'hidden'}>
            <PomodoroScreen
              onRunningChange={setSessionRunning}
              tourRunning={tourTimer?.running}
              tourSeconds={tourTimer?.seconds}
            />
          </div>
          {tab === 'journey' && <DiaryScreen />}
          {tab === 'team' && <TeamScreen />}
          {tab === 'dex' && <DexScreen />}
          {!sessionRunning && !isTour && <BottomNav />}

          {/* Modals reais (só fora do tour) */}
          {!isTour && (
            <AnimatePresence>
              {active && spawn && active.stage === 'polaroid' && (
                <PolaroidModal
                  key="polaroid"
                  spawn={spawn}
                  photoDataUrl={active.photoDataUrl}
                  onClose={() => setActive(null)}
                  onRegister={() => {
                    setSeen((s) => new Set(s).add(spawn.spawnId));
                    setActive({ spawnId: spawn.spawnId, stage: 'snack', photoDataUrl: active.photoDataUrl });
                  }}
                />
              )}
              {active && spawn && active.stage === 'snack' && (
                <SnackPanel key="snack" spawnId={spawn.spawnId} onClose={() => setActive(null)} />
              )}
              {shop && <ShopSheet key="shop" onClose={() => setShop(false)} />}
            </AnimatePresence>
          )}

          {/* Tour Interativo — overlay sobre tudo */}
          {isTour && (
            <OnboardingTour
              key="onboarding-tour"
              onSetTab={handleTourSetTab}
              onTourTimer={setTourTimer}
              onCompleted={async () => { await refreshAll(); }}
            />
          )}

          <Toasts />
        </>
      )}

      {/* Bloqueador de Orientação Paisagem (App só em pé) */}
      <div
        id="orientation-landscape-blocker"
        className="hidden fixed inset-0 z-[999] flex-col items-center justify-center bg-slate-900 text-white p-6 text-center"
      >
        <div className="text-5xl animate-bounce mb-4">📱</div>
        <h2 className="text-xl font-black mb-2">Por favor, gire seu celular</h2>
        <p className="text-xs text-slate-300 font-bold max-w-xs">
          O Pokémoro foi desenhado exclusivamente para ser jogado em pé (Modo Retrato) para acompanhar sua rotina de estudos.
        </p>
      </div>
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

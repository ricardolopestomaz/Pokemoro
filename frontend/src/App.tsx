import { useCallback, useEffect, useState } from 'react';
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
import { SplashScreen } from './components/layout/SplashScreen';
import { ProfessorPatchNotesModal, shouldShowProfessorPatchNotes } from './components/common/ProfessorPatchNotesModal';
import { api } from './api/endpoints';
import { envUrl } from './lib/assets';
import type { SpawnedPokemon, TabId } from './types';

function Shell() {
  const { loading, offline, profile, tab, setTab, refreshAll } = useGame();
  const [splashFinished, setSplashFinished] = useState(false);
  const [sessionRunning, setSessionRunning] = useState(false);
  const [active, setActive] = useState<{ spawnId: string; stage: 'polaroid' | 'snack'; photoDataUrl?: string } | null>(null);
  const [seen, setSeen] = useState<Set<string>>(new Set());
  const [shop, setShop] = useState(false);
  const [showPatchNotes, setShowPatchNotes] = useState(false);
  const [tourTimer, setTourTimer] = useState<{ seconds: number; running: boolean } | null>(null);
  const { coffeeBreak } = useGame();

  const openSpawn = useCallback((s: SpawnedPokemon, photoDataUrl?: string) => {
    setActive({
      spawnId: s.spawnId,
      stage: seen.has(s.spawnId) ? 'snack' : 'polaroid',
      photoDataUrl: photoDataUrl || s.photoDataUrl || undefined,
    });
  }, [seen]);

  // Retorno automático para a aba de foco caso o usuário saia/minimize ou recarregue o app com sessão ativa
  useEffect(() => {
    const handleReturnToFocus = () => {
      try {
        const raw = localStorage.getItem('pokemoro_active_session');
        if (raw) {
          const saved = JSON.parse(raw);
          if (saved && saved.sessionId) {
            setTab('focus');
          }
        }
      } catch {}
    };

    handleReturnToFocus();
    window.addEventListener('focus', handleReturnToFocus);
    window.addEventListener('pageshow', handleReturnToFocus);
    const onVisChange = () => {
      if (document.visibilityState === 'visible') {
        handleReturnToFocus();
      }
    };
    document.addEventListener('visibilitychange', onVisChange);

    return () => {
      window.removeEventListener('focus', handleReturnToFocus);
      window.removeEventListener('pageshow', handleReturnToFocus);
      document.removeEventListener('visibilitychange', onVisChange);
    };
  }, [setTab]);

  // Sincronização automática com o Supabase ao entrar no app ou reconectar à internet:
  // Identifica se está conectado e envia pokémons, horas e insígnias para atualizar o banco
  useEffect(() => {
    let syncTimeout: ReturnType<typeof setTimeout> | null = null;

    const triggerFullSync = () => {
      if (typeof navigator !== 'undefined' && navigator.onLine) {
        if (syncTimeout) clearTimeout(syncTimeout);
        syncTimeout = setTimeout(() => {
          void api.syncFullUserState();
        }, 500);
      }
    };

    triggerFullSync();

    window.addEventListener('online', triggerFullSync);
    window.addEventListener('focus', triggerFullSync);
    window.addEventListener('pageshow', triggerFullSync);
    const onVis = () => {
      if (document.visibilityState === 'visible') {
        triggerFullSync();
      }
    };
    document.addEventListener('visibilitychange', onVis);

    return () => {
      if (syncTimeout) clearTimeout(syncTimeout);
      window.removeEventListener('online', triggerFullSync);
      window.removeEventListener('focus', triggerFullSync);
      window.removeEventListener('pageshow', triggerFullSync);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, []);

  const isTour = profile !== null && !profile.hasCompletedOnboarding;
  const spawn = coffeeBreak?.spawns.find((s) => s.spawnId === active?.spawnId);
  const bg = envUrl(profile?.activeEnvironment ?? 'greengrass');

  // Exibição automática do Boletim de Novidades do Professor Ricardo
  useEffect(() => {
    if (splashFinished && !loading) {
      if (!isTour && shouldShowProfessorPatchNotes()) {
        setShowPatchNotes(true);
      }
    }
  }, [splashFinished, loading, isTour]);

  // Callback para o tour interativo trocar de aba
  const handleTourSetTab = useCallback((t: TabId) => {
    setTab(t);
  }, [setTab]);

  return (
    <MobileFrame>
      <img src={bg} alt="" className="absolute inset-0 h-full w-full object-cover" draggable={false} />

      {/* Tela de Carregamento Estilo Pokémon GO com arte de festival e barra de progresso */}
      <AnimatePresence>
        {!splashFinished && (
          <SplashScreen
            dataLoaded={!loading}
            offline={offline}
            onRetry={() => void refreshAll()}
            onFinished={() => setSplashFinished(true)}
          />
        )}
      </AnimatePresence>

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
              onCompleted={async () => {
                await refreshAll();
                if (shouldShowProfessorPatchNotes()) {
                  setShowPatchNotes(true);
                }
              }}
            />
          )}

          {/* Boletim de Atualizações do Professor Ricardo */}
          <AnimatePresence>
            {showPatchNotes && (
              <ProfessorPatchNotesModal
                key="professor-patch-notes"
                onClose={() => setShowPatchNotes(false)}
              />
            )}
          </AnimatePresence>

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

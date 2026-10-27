import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Flame, Zap, Clock, Cat, Play, Pause, Share2, Volume2 } from 'lucide-react';
import confetti from 'canvas-confetti';
import { api } from '../../api/endpoints';
import { useGame } from '../../hooks/useGameState';
import { usePageVisibility } from '../../hooks/usePageVisibility';
import { usePomodoroTimer } from '../../hooks/usePomodoroTimer';
import { sfx } from '../../lib/sfx';
import { ambientSound, type AmbientSoundType } from '../../lib/ambientSound';
import { recordQuestAction } from '../../lib/quests';
import { generateStudyStoryCard, shareOrDownloadStory } from '../../lib/storyCard';
import { PokeCoinIcon } from '../common/PokemonThemedIcons';
import { CircularTimer } from './CircularTimer';
import { DeepFocusBadge } from './DeepFocusBadge';
import { SubjectSelector } from './SubjectSelector';
import type { PomodoroMode, SessionSummary } from '../../types';

const MODES: { id: PomodoroMode; label: string; sub: string; minutes: number }[] = [
  { id: 'CLASSIC_25', label: 'Clássico', sub: '25 min', minutes: 25 },
  { id: 'EXTENDED_50', label: 'Extendido', sub: '50 min', minutes: 50 },
  { id: 'FREE_STOPWATCH', label: 'Livre', sub: 'cronômetro', minutes: 0 },
];

const BUBBLES = Array.from({ length: 10 }, (_, i) => ({
  left: (i * 37) % 100, size: 14 + ((i * 13) % 34), dur: 10 + ((i * 7) % 12), delay: -((i * 3) % 10),
}));

interface Props {
  onRunningChange: (running: boolean) => void;
  tourRunning?: boolean;
  tourSeconds?: number;
}

export function PomodoroScreen({ onRunningChange, tourRunning, tourSeconds }: Props) {
  const { subjects, team, profile, settings, setTab, toast, refreshAll, refreshProfile } = useGame();
  const [modeId, setModeId] = useState<PomodoroMode>('CLASSIC_25');
  const [subjectId, setSubjectId] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [summary, setSummary] = useState<SessionSummary | null>(null);
  const [confirmQuit, setConfirmQuit] = useState(false);
  const [busy, setBusy] = useState(false);
  const [ambientType, setAmbientType] = useState<AmbientSoundType>('off');
  const submitting = useRef(false);

  useEffect(() => {
    return () => {
      ambientSound.stop();
    };
  }, []);

  const mode = useMemo(() => MODES.find((m) => m.id === modeId)!, [modeId]);
  const partner = team?.activeTeam[0];
  const partnerId = partner?.pokemonId ?? 10;
  const partnerVariant = partner?.variant ?? 'regular';

  useEffect(() => {
    if (!subjectId && subjects.length) setSubjectId(subjects[0].id);
  }, [subjects, subjectId]);

  const timer = usePomodoroTimer({
    targetMinutes: mode.minutes,
    speed: 1,
    onFinish: () => {
      if (
        typeof window !== 'undefined' &&
        'Notification' in window &&
        Notification.permission === 'granted' &&
        document.visibilityState === 'hidden'
      ) {
        try {
          new Notification('Pokémoro - Foco Concluído! 💤', {
            body: 'Sua sessão de estudos terminou! Venha ver os Pokémon no Coffee Break.',
            icon: '/assets/icon_caterpie_frente.png',
          });
        } catch {}
      }
      void submit(false, mode.minutes * 60);
    },
  });
  const running = timer.status === 'running';
  const isPaused = timer.status === 'paused';
  const activeRunning = running || isPaused || Boolean(tourRunning);
  const vis = usePageVisibility(running);

  useEffect(() => { onRunningChange(activeRunning); }, [activeRunning, onRunningChange]);

  // Recupera sessão ativa de segundo plano caso o navegador tenha recarregado a aba
  useEffect(() => {
    try {
      const raw = localStorage.getItem('pokemoro_active_session');
      if (raw) {
        const saved = JSON.parse(raw);
        if (saved && saved.sessionId && saved.startTimestamp) {
          setSessionId(saved.sessionId);
          if (saved.subjectId) setSubjectId(saved.subjectId);
          if (saved.modeId) setModeId(saved.modeId);
          if (saved.isPaused) {
            timer.start(saved.startTimestamp, saved.accumulatedSecs || 0);
            timer.pause();
          } else {
            timer.start(saved.lastResumeTimestamp || saved.startTimestamp, saved.accumulatedSecs || 0);
          }
        }
      }
    } catch {}
  }, []);

  // Aviso de fechar a aba durante a sessão
  useEffect(() => {
    if (!running) return;
    const h = (e: BeforeUnloadEvent) => { e.preventDefault(); };
    window.addEventListener('beforeunload', h);
    return () => window.removeEventListener('beforeunload', h);
  }, [running]);

  const start = async () => {
    if (!subjectId) { toast('Escolha ou crie uma matéria primeiro!', 'info'); return; }
    setBusy(true);
    try {
      // Cronômetro livre: o backend exige alvo > 0, então usamos 1 min como mínimo para liberar o Coffee Break.
      const res = await api.startSession(subjectId, mode.id, mode.minutes || 1);
      setSessionId(res.sessionId);
      submitting.current = false;
      const now = Date.now();
      try {
        localStorage.setItem(
          'pokemoro_active_session',
          JSON.stringify({
            sessionId: res.sessionId,
            subjectId,
            modeId: mode.id,
            startTimestamp: now,
          })
        );
      } catch {}

      // Pede permissão para avisar o término em segundo plano
      if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission().catch(() => {});
      }

      sfx.start();
      if (ambientType !== 'off') {
        ambientSound.play(ambientType);
      }
      timer.start(now);
    } catch (e) {
      toast((e as Error).message, 'error');
    } finally {
      setBusy(false);
    }
  };

  async function submit(interrupted: boolean, elapsedSeconds: number) {
    if (submitting.current || !sessionId) return;
    submitting.current = true;
    setConfirmQuit(false);
    ambientSound.stop();
    let startedAtIso: string | undefined;
    let sessionSubjectId: string | undefined;
    try {
      const activeRaw = localStorage.getItem('pokemoro_active_session');
      if (activeRaw) {
        const saved = JSON.parse(activeRaw);
        if (saved && saved.startTimestamp) {
          startedAtIso = new Date(saved.startTimestamp).toISOString();
        }
        if (saved && saved.subjectId) sessionSubjectId = saved.subjectId;
      }
    } catch {}

    const completedAtIso = new Date().toISOString();
    if (!startedAtIso) {
      startedAtIso = new Date(Date.now() - Math.max(1, elapsedSeconds) * 1000).toISOString();
    }

    try {
      localStorage.removeItem('pokemoro_active_session');
    } catch {}

    const realMinutes = Math.floor(elapsedSeconds / 60);
    const isFreeMode = mode.id === 'FREE_STOPWATCH';

    const minutes = isFreeMode
      ? realMinutes
      : interrupted ? Math.floor(elapsedSeconds / 60) : mode.minutes;

    recordQuestAction('study', minutes);

    try {
      const res = await api.endSession({
        sessionId,
        mode: mode.id,
        actualDurationMinutes: minutes,
        interruptedEarly: interrupted,
        timeSpentOutOfAppSeconds: vis.getOutSeconds(),
        startedAt: startedAtIso,
        completedAt: completedAtIso,
        subjectId: sessionSubjectId || subjectId || undefined,
      });
      if (!interrupted && res.isCoffeeBreakUnlocked) {
        sfx.bell();
        if (settings?.enableConfetti ?? true) {
          confetti({ particleCount: 160, spread: 90, origin: { y: 0.4 } });
        }
      }
      timer.reset();
      setSummary(res);
      void refreshProfile();
    } catch (e) {
      submitting.current = false;
      toast((e as Error).message, 'error');
    }
  }

  const quit = () => {
    // A chave pokemoro_active_session é lida e removida dentro de submit()
    const secs = timer.stop();
    const isFree = mode.id === 'FREE_STOPWATCH';
    const interrupted = isFree ? secs < 25 * 60 : secs < mode.minutes * 60;
    void submit(interrupted, secs);
  };

  const closeSummary = async () => {
    sfx.tap();
    try {
      localStorage.removeItem('pokemoro_active_session');
    } catch {}
    const unlocked = summary?.isCoffeeBreakUnlocked;
    setSummary(null);
    setSessionId(null);
    await refreshAll();
    if (unlocked) setTab('rest');
  };

  const isTour = Boolean(tourRunning);
  const caption = isTour
    ? '• • •  Foco Demonstrativo (10s)  • • •'
    : isPaused
    ? '• • •  Pausado  • • •'
    : running
    ? (mode.minutes === 0 ? '• • •  Tempo livre  • • •' : '• • •  Focando  • • •')
    : 'Pronto para focar';
  const displayProgress = isTour ? Math.min(1, (tourSeconds ?? 0) / 10) : timer.progress;
  const displaySeconds = isTour
    ? (tourSeconds ?? 0)
    : (mode.minutes === 0 ? timer.elapsed : (running || isPaused || timer.status === 'finished' ? timer.remaining : mode.minutes * 60));

  return (
    <section
      className="absolute inset-0 z-20 overflow-y-auto bg-gradient-to-b from-[#3b6bff] via-[#2a4fd6] to-night no-scrollbar"
      aria-label="Modo Pomodoro"
    >
      {/* Bolhas flutuantes ambientais (desativáveis em modo econômico) */}
      {(settings?.enableVisualEffects ?? true) && (
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
          {BUBBLES.map((b, i) => (
            <span key={i} className="bubble" style={{ left: `${b.left}%`, width: b.size, height: b.size, animationDuration: `${b.dur}s`, animationDelay: `${b.delay}s` }} />
          ))}
        </div>
      )}

      <div className={`relative flex min-h-full flex-col items-center gap-4 px-5 pt-[104px] ${activeRunning ? 'pb-8' : 'pb-28'}`}>
        {!activeRunning && (
          <div className="grid w-full grid-cols-3 gap-2" role="tablist" aria-label="Modo do timer">
            {MODES.map((m) => {
              const active = m.id === modeId;
              return (
                <button
                  key={m.id}
                  id={`mode-${m.id}`}
                  role="tab"
                  aria-selected={active}
                  onClick={() => { sfx.tap(); setModeId(m.id); }}
                  className="rounded-2xl px-2 py-2 text-center transition-all active:scale-95"
                  style={{ background: active ? '#fff' : 'rgba(255,255,255,0.15)', color: active ? '#2b3a67' : '#fff', boxShadow: active ? '0 4px 0 #b7c5ff' : 'none' }}
                >
                  <div className="text-sm font-black">{m.label}</div>
                  <div className="text-[10px] font-bold opacity-70">{m.sub}</div>
                </button>
              );
            })}
          </div>
        )}

        {!activeRunning && <SubjectSelector value={subjectId} onChange={setSubjectId} />}

        {/* Seletor de Áudio Ambiente & Lo-Fi (sempre acessível para o usuário alternar som/lo-fi quando quiser) */}
        <div className="flex items-center gap-1.5 rounded-2xl border border-white/20 bg-white/15 px-3 py-1.5 text-white shadow-xs backdrop-blur-xs">
          <Volume2 size={14} className="opacity-70 shrink-0" />
          <span className="text-[10px] font-black uppercase opacity-75 mr-1">Áudio:</span>
          {(['off', 'rain', 'fire', 'lofi'] as const).map((t) => {
            const labels = { off: 'Mudo', rain: '🌧️ Chuva', fire: '🔥 Fogo', lofi: '🎵 Lo-Fi' };
            const active = ambientType === t;
            return (
              <button
                key={t}
                onClick={() => {
                  sfx.tap();
                  setAmbientType(t);
                  if (t === 'off') ambientSound.stop();
                  else ambientSound.play(t);
                }}
                className={`rounded-xl px-2 py-0.5 text-[10px] font-bold transition-all ${
                  active ? 'bg-white text-slate-900 shadow-xs' : 'text-white/80 hover:bg-white/10'
                }`}
              >
                {labels[t]}
              </button>
            );
          })}
        </div>

        {!activeRunning && mode.id === 'FREE_STOPWATCH' && (
          <div className="flex items-center gap-2 rounded-2xl border border-white/30 bg-white/20 px-3.5 py-2 text-center text-xs font-bold text-white shadow-sm backdrop-blur-xs">
            <span>⏱</span>
            <span>
              Modo Livre: Estude no seu próprio ritmo com cronômetro contínuo e pausas flexíveis.
            </span>
          </div>
        )}

        <CircularTimer
          progress={displayProgress}
          seconds={displaySeconds}
          partnerId={partnerId}
          partnerVariant={partnerVariant}
          distracted={isTour ? false : !vis.deepFocus}
          running={running}
          caption={caption}
        />

        {isPaused && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 5 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="flex items-center gap-2 rounded-full border border-sky-300/60 bg-sky-500/25 px-4 py-1.5 text-xs font-black text-white shadow-sm backdrop-blur-md"
          >
            <span className="inline-block h-2 w-2 rounded-full bg-sky-300 animate-ping" />
            <span>Pausado — Tome uma água 💧</span>
          </motion.div>
        )}

        {activeRunning && !isPaused && (
          <DeepFocusBadge deepFocus={isTour ? true : vis.deepFocus} isOut={isTour ? false : vis.isOut} graceLeft={isTour ? 10 : vis.graceLeft} />
        )}

        {!isTour && (
          <div className="mt-1 flex w-full flex-col gap-3">
            {!activeRunning ? (
              <button
                id="btn-start-pomodoro"
                className={mode.id === 'FREE_STOPWATCH' ? 'btn-timer-start-free w-full py-4 text-lg' : 'btn w-full py-4 text-lg'}
                disabled={busy || !subjectId}
                onClick={start}
              >
                {busy ? 'Preparando...' : mode.id === 'FREE_STOPWATCH' ? 'Iniciar Modo Livre ⏱' : 'Iniciar Sessão de Foco'}
              </button>
            ) : mode.id === 'FREE_STOPWATCH' ? (
              <div className="flex w-full gap-2.5">
                <button
                  id="btn-pause-resume"
                  className={`${isPaused ? 'btn-timer-resume' : 'btn-timer-pause'} flex-1 min-h-[52px] py-3.5 flex items-center justify-center gap-2`}
                  aria-pressed={isPaused}
                  onClick={() => {
                    sfx.tap();
                    if (isPaused) {
                      timer.resume();
                      ambientSound.resume();
                      try {
                        const raw = localStorage.getItem('pokemoro_active_session');
                        if (raw) {
                          const saved = JSON.parse(raw);
                          localStorage.setItem(
                            'pokemoro_active_session',
                            JSON.stringify({
                              ...saved,
                              isPaused: false,
                              lastResumeTimestamp: Date.now(),
                            })
                          );
                        }
                      } catch {}
                    } else {
                      timer.pause();
                      ambientSound.pause();
                      try {
                        const raw = localStorage.getItem('pokemoro_active_session');
                        if (raw) {
                          const saved = JSON.parse(raw);
                          localStorage.setItem(
                            'pokemoro_active_session',
                            JSON.stringify({
                              ...saved,
                              isPaused: true,
                              accumulatedSecs: timer.accumulatedSecs,
                            })
                          );
                        }
                      } catch {}
                    }
                  }}
                >
                  {isPaused ? (
                    <>
                      <Play size={18} fill="currentColor" />
                      <span>Retomar Foco</span>
                    </>
                  ) : (
                    <>
                      <Pause size={18} fill="currentColor" />
                      <span>Pausar</span>
                    </>
                  )}
                </button>
                <button
                  id="btn-end-session"
                  className="btn-timer-finish flex-1 min-h-[52px] py-3.5 flex items-center justify-center gap-1.5"
                  onClick={() => setConfirmQuit(true)}
                >
                  <span aria-hidden="true">⏹</span>
                  <span>Concluir Sessão</span>
                </button>
              </div>
            ) : (
              <button
                id="btn-end-session"
                className="btn-timer-finish w-full min-h-[50px] py-3.5 flex items-center justify-center gap-2"
                onClick={() => setConfirmQuit(true)}
              >
                <span>⏹ Encerrar Sessão</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Confirmação gentil de interrupção */}
      <AnimatePresence>
        {confirmQuit && (
          <motion.div className="absolute inset-0 z-30 flex items-center justify-center bg-black/55 p-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div initial={{ scale: 0.85 }} animate={{ scale: 1 }} className="w-full rounded-3xl bg-white p-5 text-center shadow-2xl">
              <div className="text-4xl">🌱</div>
              <h3 className="mt-1 text-lg font-black text-ink">Encerrar agora?</h3>
              <p className="mt-1.5 text-sm font-bold text-ink/70">
                {mode.id === 'FREE_STOPWATCH'
                  ? 'Atenção: É necessário pelo menos 25 minutos completos para ganhar Moedas de Foco e atrair Pokémon no descanso.'
                  : 'Lembre-se: Para receber Moedas de Foco e desbloquear o Coffee Break, complete o tempo mínimo de 25 minutos sem interrupção.'}
              </p>
              <div className="mt-4 flex gap-3">
                <button id="btn-keep-going" className="btn btn-green flex-1 !px-3 !py-2.5 text-sm" onClick={() => setConfirmQuit(false)}>Continuar Focado</button>
                <button id="btn-confirm-quit" className="btn-timer-finish flex-1 !px-3 !py-2.5 text-sm" onClick={quit}>Encerrar</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Resumo da sessão */}
      <AnimatePresence>
        {summary && (
          <motion.div className="absolute inset-0 z-30 flex items-center justify-center bg-black/60 p-5" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div initial={{ scale: 0.8, y: 40 }} animate={{ scale: 1, y: 0 }} transition={{ type: 'spring', stiffness: 220, damping: 16 }} className="w-full rounded-[2rem] bg-cream p-5 text-ink shadow-2xl">
              <div className="text-center">
                <div className="text-4xl">{summary.isCoffeeBreakUnlocked ? '🎉' : '🌱'}</div>
                <h2 className="text-2xl font-black text-leaf-dark">
                  {summary.isCoffeeBreakUnlocked ? 'Sessão concluída!' : 'Sessão Registrada!'}
                </h2>
              </div>
              <ul className="mt-3 flex flex-col gap-2 text-sm font-extrabold">
                <Row icon={<Clock size={16} />} label="Minutos registrados" value={`${summary.minutesLogged} min`} />
                <Row icon={<Zap size={16} />} label="Deep Focus" value={summary.isDeepFocusEarned ? `${summary.deepFocusMultiplier.toFixed(1)}x ✓` : '1.0x'} />
                <Row icon={<Flame size={16} />} label="Ofensiva" value={`${summary.newStreakDays} dia(s) · ${summary.streakMultiplier.toFixed(1)}x`} />
                <Row icon={<Zap size={16} className="text-sleep-yellow-dark" />} label="Focus Power" value={`${summary.focusPowerEarned}`} strong />
                <Row icon={<PokeCoinIcon size={18} />} label="Moedas de Foco" value={summary.focusCoinsEarned > 0 ? `+${summary.focusCoinsEarned}` : '0 (mínimo 25m)'} />
              </ul>
              <p className="mt-3 rounded-2xl bg-white p-3 text-center text-xs font-bold text-ink/70">
                {summary.isCoffeeBreakUnlocked
                  ? <><Cat size={14} className="mr-1 inline" />{summary.spawnsCount} Pokémon vieram descansar com você!</>
                  : summary.focusCoinsEarned > 0
                    ? 'Parabéns pelo foco! Seus minutos foram registrados e você acumulou Moedas de Foco 🪙.'
                    : 'Estude no mínimo 25 minutos completos para receber Moedas de Foco e atrair novos Pokémon no descanso! 🍃'}
              </p>
              <div className="mt-3 flex gap-2">
                <button
                  id="btn-share-story"
                  className="btn flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-black text-xs py-2.5 shadow-md flex items-center justify-center gap-1.5 active:scale-95"
                  onClick={async () => {
                    try {
                      sfx.tap();
                      const activeSubject = subjects.find((s) => s.id === subjectId);
                      const partnerPokemon = team?.activeTeam[0];
                      const dataUrl = await generateStudyStoryCard({
                        pokemonId: partnerPokemon?.pokemonId ?? 10,
                        nickname: partnerPokemon?.nickname ?? 'Caterpie',
                        variant: partnerPokemon?.variant ?? 'regular',
                        minutesToday: summary.minutesLogged,
                        streakDays: summary.newStreakDays,
                        subjectName: activeSubject?.name ?? 'Estudos Gerais',
                      });
                      await shareOrDownloadStory(dataUrl);
                      toast('Card de Stories gerado com sucesso!', 'ok');
                    } catch {
                      toast('Não foi possível gerar a imagem de compartilhamento.', 'error');
                    }
                  }}
                >
                  <Share2 size={14} />
                  <span>Compartilhar Card</span>
                </button>
                <button id="btn-summary-continue" className="btn flex-1 py-2.5 text-xs font-black" onClick={closeSummary}>
                  {summary.isCoffeeBreakUnlocked ? 'Ver o Descanso' : 'Voltar'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <span className="sr-only">{profile?.name}</span>
    </section>
  );
}

function Row({ icon, label, value, strong }: { icon: React.ReactNode; label: string; value: string; strong?: boolean }) {
  return (
    <li className="flex items-center justify-between rounded-xl bg-white px-3 py-2">
      <span className="flex items-center gap-2 text-ink/70">{icon}{label}</span>
      <span className={strong ? 'text-lg text-leaf-dark' : ''}>{value}</span>
    </li>
  );
}

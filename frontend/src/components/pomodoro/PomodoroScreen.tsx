import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Flame, Gauge, Coins, Zap, Clock, Cat } from 'lucide-react';
import confetti from 'canvas-confetti';
import { api } from '../../api/endpoints';
import { useGame } from '../../hooks/useGameState';
import { usePageVisibility } from '../../hooks/usePageVisibility';
import { usePomodoroTimer } from '../../hooks/usePomodoroTimer';
import { sfx } from '../../lib/sfx';
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

interface Props { onRunningChange: (running: boolean) => void }

export function PomodoroScreen({ onRunningChange }: Props) {
  const { subjects, team, profile, setTab, toast, refreshAll } = useGame();
  const [modeId, setModeId] = useState<PomodoroMode>('CLASSIC_25');
  const [subjectId, setSubjectId] = useState<string | null>(null);
  const [demo, setDemo] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [summary, setSummary] = useState<SessionSummary | null>(null);
  const [confirmQuit, setConfirmQuit] = useState(false);
  const [busy, setBusy] = useState(false);
  const submitting = useRef(false);

  const mode = useMemo(() => MODES.find((m) => m.id === modeId)!, [modeId]);
  const partnerId = team?.activeTeam[0]?.pokemonId ?? 10;

  useEffect(() => {
    if (!subjectId && subjects.length) setSubjectId(subjects[0].id);
  }, [subjects, subjectId]);

  const timer = usePomodoroTimer({
    targetMinutes: mode.minutes,
    speed: demo ? 60 : 1,
    onFinish: () => { void submit(false, mode.minutes * 60); },
  });
  const running = timer.status === 'running';
  const vis = usePageVisibility(running);

  useEffect(() => { onRunningChange(running); }, [running, onRunningChange]);

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
      sfx.start();
      timer.start();
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
    const minutes = interrupted
      ? Math.floor(elapsedSeconds / 60)
      : mode.minutes > 0 ? mode.minutes : Math.max(1, Math.round(elapsedSeconds / 60));
    try {
      const res = await api.endSession({
        sessionId,
        actualDurationMinutes: minutes,
        interruptedEarly: interrupted,
        timeSpentOutOfAppSeconds: vis.getOutSeconds(),
      });
      if (!interrupted) {
        sfx.bell();
        confetti({ particleCount: 160, spread: 90, origin: { y: 0.4 } });
      }
      timer.reset();
      setSummary(res);
    } catch (e) {
      submitting.current = false;
      toast((e as Error).message, 'error');
    }
  }

  const quit = () => {
    const secs = timer.stop();
    void submit(mode.minutes === 0 ? false : secs < mode.minutes * 60, secs);
  };

  const closeSummary = async () => {
    sfx.tap();
    const unlocked = summary?.isCoffeeBreakUnlocked;
    setSummary(null);
    setSessionId(null);
    await refreshAll();
    if (unlocked) setTab('rest');
  };

  const caption = running ? '• • •  Focando  • • •' : 'Pronto para focar';
  const displaySeconds = running || timer.status === 'finished' ? timer.remaining : mode.minutes * 60;

  return (
    <section
      className="absolute inset-0 z-20 overflow-y-auto bg-gradient-to-b from-[#3b6bff] via-[#2a4fd6] to-night no-scrollbar"
      aria-label="Modo Pomodoro"
    >
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        {BUBBLES.map((b, i) => (
          <span key={i} className="bubble" style={{ left: `${b.left}%`, width: b.size, height: b.size, animationDuration: `${b.dur}s`, animationDelay: `${b.delay}s` }} />
        ))}
      </div>

      <div className={`relative flex min-h-full flex-col items-center gap-4 px-5 pt-[104px] ${running ? 'pb-8' : 'pb-28'}`}>
        {!running && (
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

        {!running && <SubjectSelector value={subjectId} onChange={setSubjectId} />}

        <CircularTimer
          progress={timer.progress}
          seconds={mode.minutes === 0 && running ? timer.elapsed : displaySeconds}
          partnerId={partnerId}
          distracted={!vis.deepFocus}
          running={running}
          caption={mode.minutes === 0 && running ? '• • •  Tempo livre  • • •' : caption}
        />

        {running && <DeepFocusBadge deepFocus={vis.deepFocus} isOut={vis.isOut} graceLeft={vis.graceLeft} />}

        <div className="mt-1 flex w-full flex-col gap-3">
          {!running ? (
            <>
              <button id="btn-start-pomodoro" className="btn w-full py-4 text-lg" disabled={busy || !subjectId} onClick={start}>
                {busy ? 'Preparando...' : 'Iniciar Sessão de Foco'}
              </button>
              <button
                id="toggle-demo"
                onClick={() => { sfx.tap(); setDemo((d) => !d); }}
                className="mx-auto flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-black text-white/80 ring-1 ring-white/30 active:scale-95"
                style={{ background: demo ? 'rgba(255,203,5,0.35)' : 'transparent' }}
              >
                <Gauge size={12} /> Modo demo (1s = 1min): {demo ? 'LIGADO' : 'desligado'}
              </button>
            </>
          ) : (
            <button id="btn-end-session" className="btn btn-ghost w-full py-3.5" onClick={() => (mode.minutes === 0 ? quit() : setConfirmQuit(true))}>
              {mode.minutes === 0 ? 'Concluir Sessão' : 'Encerrar Sessão'}
            </button>
          )}
        </div>
      </div>

      {/* Confirmação gentil de interrupção */}
      <AnimatePresence>
        {confirmQuit && (
          <motion.div className="absolute inset-0 z-30 flex items-center justify-center bg-black/55 p-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div initial={{ scale: 0.85 }} animate={{ scale: 1 }} className="w-full rounded-3xl bg-white p-5 text-center">
              <div className="text-4xl">🌱</div>
              <h3 className="mt-1 text-lg font-black">Parar agora?</h3>
              <p className="mt-1 text-sm font-bold text-ink/60">
                Sem problemas! O tempo estudado será salvo e convertido em moedas. Só o Coffee Break (aparição dos Pokémon) exige o ciclo completo.
              </p>
              <div className="mt-4 flex gap-3">
                <button id="btn-keep-going" className="btn btn-green flex-1 !px-3 !py-2.5 text-sm" onClick={() => setConfirmQuit(false)}>Continuar</button>
                <button id="btn-confirm-quit" className="btn btn-orange flex-1 !px-3 !py-2.5 text-sm" onClick={quit}>Encerrar</button>
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
                  {summary.isCoffeeBreakUnlocked ? 'Sessão concluída!' : 'Boa tentativa!'}
                </h2>
              </div>
              <ul className="mt-3 flex flex-col gap-2 text-sm font-extrabold">
                <Row icon={<Clock size={16} />} label="Minutos registrados" value={`${summary.minutesLogged} min`} />
                <Row icon={<Zap size={16} />} label="Deep Focus" value={summary.isDeepFocusEarned ? `${summary.deepFocusMultiplier.toFixed(1)}x ✓` : '1.0x'} />
                <Row icon={<Flame size={16} />} label="Ofensiva" value={`${summary.newStreakDays} dia(s) · ${summary.streakMultiplier.toFixed(1)}x`} />
                <Row icon={<Zap size={16} className="text-sleep-yellow-dark" />} label="Focus Power" value={`${summary.focusPowerEarned}`} strong />
                <Row icon={<Coins size={16} className="text-sleep-yellow-dark" />} label="Moedas de Foco" value={`+${summary.focusCoinsEarned}`} />
              </ul>
              <p className="mt-3 rounded-2xl bg-white p-3 text-center text-xs font-bold text-ink/70">
                {summary.isCoffeeBreakUnlocked
                  ? <><Cat size={14} className="mr-1 inline" />{summary.spawnsCount} Pokémon vieram descansar com você!</>
                  : 'Seus minutos foram salvos ❤. Complete o ciclo inteiro para atrair Pokémon no Coffee Break.'}
              </p>
              <button id="btn-summary-continue" className="btn mt-4 w-full" onClick={closeSummary}>
                {summary.isCoffeeBreakUnlocked ? 'Ver o Descanso' : 'Voltar'}
              </button>
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

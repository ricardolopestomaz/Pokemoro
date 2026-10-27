import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface SplashScreenProps {
  dataLoaded: boolean;
  offline: boolean;
  onRetry: () => void;
  onFinished: () => void;
}

export function SplashScreen({ dataLoaded, offline, onRetry, onFinished }: SplashScreenProps) {
  const [progress, setProgress] = useState(6);

  useEffect(() => {
    if (offline) return;

    let start = performance.now();
    let animId: number;
    let finishTimer: ReturnType<typeof setTimeout> | null = null;
    let completed = false;

    // Simulação deliberada, rica e multi-estágio da barra de carregamento estilo Pokémon GO (~3.2s)
    const updateProgress = (now: number) => {
      const elapsed = now - start;

      let targetProgress = 6;
      if (elapsed < 600) {
        // Fase 1: Início rápido até ~30%
        targetProgress = 6 + (elapsed / 600) * 24;
      } else if (elapsed < 1800) {
        // Fase 2: Carregamento contínuo até ~68%
        targetProgress = 30 + ((elapsed - 600) / 1200) * 38;
      } else if (elapsed < 2400) {
        // Fase 3: Pausa sutil característica de autenticação (~68% a 80%)
        targetProgress = 68 + ((elapsed - 1800) / 600) * 12;
      } else if (elapsed < 3200) {
        // Fase 4: Avanço final até 98%
        targetProgress = 80 + ((elapsed - 2400) / 800) * 18;
      } else {
        // Se os dados do jogo já foram carregados, fecha os 100%
        targetProgress = dataLoaded ? 100 : 98;
      }

      setProgress(Math.min(100, targetProgress));

      if (targetProgress >= 100 && dataLoaded && !completed) {
        completed = true;
        // Breve intervalo de 280ms para o usuário ver a barra completa antes do fade out
        finishTimer = setTimeout(() => {
          onFinished();
        }, 280);
        return;
      }

      animId = requestAnimationFrame(updateProgress);
    };

    animId = requestAnimationFrame(updateProgress);

    return () => {
      cancelAnimationFrame(animId);
      if (finishTimer) clearTimeout(finishTimer);
    };
  }, [dataLoaded, offline, onFinished]);

  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.55, ease: 'easeInOut' }}
      className="absolute inset-0 z-[100] flex flex-col justify-between overflow-hidden select-none bg-slate-950 text-white"
    >
      {/* Arte em tela cheia com leve zoom cinemático */}
      <motion.img
        src="/assets/magikarp_festival_loading.jpg"
        alt="Festival de Magikarp"
        initial={{ scale: 1.04 }}
        animate={{ scale: 1 }}
        transition={{ duration: 4.5, ease: 'easeOut' }}
        className="absolute inset-0 h-full w-full object-cover object-center pointer-events-none"
        draggable={false}
      />

      {/* Vinheta escura superior suave para status bar */}
      <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-black/60 via-black/20 to-transparent pointer-events-none" />

      {/* Conteúdo do topo: espaço seguro */}
      <div className="relative z-10 pt-4 px-6 flex justify-between items-center opacity-80 text-xs font-semibold">
        <span />
      </div>

      {/* Vinheta inferior profunda e autêntica de carregamento (estilo Pokémon GO) */}
      <div className="relative z-10 w-full bg-gradient-to-t from-black/95 via-black/70 to-transparent pt-24 pb-6 px-6 flex flex-col items-center">
        {/* Aviso de evento solicitado pelo usuário */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="w-full max-w-[340px] text-center"
        >
          <p className="text-[13px] sm:text-sm font-semibold tracking-wide text-white leading-snug drop-shadow-[0_2px_4px_rgba(0,0,0,0.95)]">
            Fique atento: no dia 06/11 vai ter o Festival de Magikarp! Prepare seus biscoitos e venha celebrar.
          </p>
        </motion.div>

        {/* Barra de progresso com trilha escura e preenchimento dourado/âmbar de Magikarp */}
        <div className="w-full max-w-[280px] h-2.5 rounded-full bg-black/75 border border-white/25 p-[1.5px] shadow-2xl backdrop-blur-xs overflow-hidden mt-3.5 relative">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-amber-500 via-orange-400 to-amber-300 relative"
            style={{ width: `${progress}%` }}
            transition={{ ease: 'linear' }}
          >
            {/* Brilho animado na ponta da barra de progresso */}
            <div className="absolute right-0 top-0 bottom-0 w-3 bg-white/80 rounded-full blur-[0.5px]" />
          </motion.div>
        </div>

        {/* Feedback visual se houver falha de rede */}
        {offline && (
          <div className="mt-3 flex flex-col items-center gap-2 text-center">
            <span className="text-xs text-rose-300 font-bold drop-shadow">Falha ao carregar dados locais.</span>
            <button
              id="btn-retry"
              onClick={onRetry}
              className="btn bg-white/90 text-slate-900 text-xs font-black px-4 py-1.5 rounded-full shadow-lg border border-white hover:bg-white"
            >
              Tentar novamente
            </button>
          </div>
        )}

        {/* Indicador Home Bar clássico da base */}
        <div className="w-32 h-1 rounded-full bg-white/60 mx-auto mt-4 pointer-events-none" />
      </div>
    </motion.div>
  );
}

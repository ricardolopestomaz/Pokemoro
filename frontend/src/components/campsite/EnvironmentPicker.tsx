import { useState, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, MapPin, GripVertical, X } from 'lucide-react';
import { api } from '../../api/endpoints';
import { useGame } from '../../hooks/useGameState';
import { ENVIRONMENTS, envUrl } from '../../lib/assets';
import { sfx } from '../../lib/sfx';

interface Props {
  containerRef?: React.RefObject<HTMLDivElement | null>;
}

export function EnvironmentPicker({ containerRef }: Props) {
  const { profile, refreshProfile, toast } = useGame();
  const [open, setOpen] = useState(false);
  const isDragging = useRef(false);

  const choose = async (env: string) => {
    sfx.tap();
    try {
      await api.setEnvironment(env);
      await refreshProfile();
      toast(`Cenário: ${ENVIRONMENTS[env].label}`, 'ok');
      setOpen(false);
    } catch (e) {
      toast((e as Error).message, 'error');
    }
  };

  const activeEnv = profile?.activeEnvironment ? ENVIRONMENTS[profile.activeEnvironment] : ENVIRONMENTS.greengrass;

  return (
    <motion.div
      drag
      dragConstraints={containerRef}
      dragMomentum={false}
      dragElastic={0.08}
      whileDrag={{ scale: 1.05, zIndex: 60 }}
      onDragStart={() => { isDragging.current = true; }}
      onDragEnd={() => { setTimeout(() => { isDragging.current = false; }, 80); }}
      className="absolute right-2.5 sm:right-3.5 top-[80px] sm:top-[88px] z-30 pointer-events-auto select-none"
    >
      <button
        id="btn-environment"
        type="button"
        onClick={() => {
          if (!isDragging.current) {
            sfx.tap();
            setOpen((o) => !o);
          }
        }}
        className="glass group flex items-center gap-1.5 rounded-full px-2.5 py-1.5 shadow-md border border-white/80 active:scale-95 transition-all cursor-grab active:cursor-grabbing backdrop-blur-md"
        aria-label="Trocar cenário"
        title="Mudar Ilha / Cenário (Arraste para reposicionar)"
      >
        <span className="opacity-40 hover:opacity-100 flex items-center" title="Arraste para mover">
          <GripVertical size={12} className="text-ink/60" />
        </span>
        <MapPin size={14} className="text-leaf-dark" />
        <span className="text-[10px] font-black text-ink">
          Ilha
        </span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.95 }}
            animate={{ opacity: 1, y: 6, scale: 1 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ type: 'spring', damping: 22, stiffness: 280 }}
            className="glass absolute right-0 mt-1 flex w-48 flex-col gap-1.5 rounded-2xl p-2.5 shadow-xl border border-white/90 backdrop-blur-md z-50 pointer-events-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-1.5 border-b border-ink/10 px-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-ink/60">
                Escolha a Ilha
              </span>
              <button
                onClick={() => { sfx.tap(); setOpen(false); }}
                className="flex h-5 w-5 items-center justify-center rounded-full bg-ink/5 text-ink/60 hover:bg-ink/10"
              >
                <X size={11} />
              </button>
            </div>

            {Object.entries(ENVIRONMENTS).map(([id, env]) => {
              const active = profile?.activeEnvironment === id;
              return (
                <button
                  key={id}
                  onClick={() => choose(id)}
                  className="flex w-full items-center gap-2 rounded-xl p-1.5 text-left transition-all active:scale-95 hover:bg-white/60"
                  style={{ background: active ? '#48d0b022' : 'transparent' }}
                >
                  <img
                    src={envUrl(id)}
                    alt=""
                    onError={(e) => { e.currentTarget.style.visibility = 'hidden'; }}
                    className="h-9 w-9 rounded-lg object-cover bg-slate-100 border border-white shadow-2xs shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <span className="block text-xs font-black text-ink truncate">
                      {env.emoji} {env.label}
                    </span>
                    <span className="block text-[8px] font-bold text-ink/50 truncate">
                      {id === 'greengrass' ? 'Campina verdejante' : id === 'beach' ? 'Brisa do oceano' : id === 'cave' ? 'Mistério mineral' : 'Gelo sereno'}
                    </span>
                  </div>
                  {active && <Check size={14} className="text-leaf-dark shrink-0" />}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

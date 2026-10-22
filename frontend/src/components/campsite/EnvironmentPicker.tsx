import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, MapPin } from 'lucide-react';
import { api } from '../../api/endpoints';
import { useGame } from '../../hooks/useGameState';
import { ENVIRONMENTS, envUrl } from '../../lib/assets';
import { sfx } from '../../lib/sfx';

export function EnvironmentPicker() {
  const { profile, refreshProfile, toast } = useGame();
  const [open, setOpen] = useState(false);

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

  return (
    <div className="absolute right-3 top-[92px] z-30 flex flex-col items-end gap-2">
      <button
        id="btn-environment"
        onClick={() => { sfx.tap(); setOpen((o) => !o); }}
        className="glass flex h-11 w-11 items-center justify-center rounded-full transition-transform active:scale-90"
        aria-label="Trocar cenário"
      >
        <MapPin size={20} className="text-leaf-dark" />
      </button>
      <AnimatePresence>
        {open && (
          <motion.ul
            initial={{ opacity: 0, y: -8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8 }}
            className="glass flex flex-col gap-2 rounded-2xl p-2"
          >
            {Object.entries(ENVIRONMENTS).map(([id, env]) => {
              const active = profile?.activeEnvironment === id;
              return (
                <li key={id}>
                  <button
                    onClick={() => choose(id)}
                    className="flex w-40 items-center gap-2 rounded-xl p-1 text-left transition-transform active:scale-95"
                    style={{ background: active ? '#48d0b022' : 'transparent' }}
                  >
                    <img src={envUrl(id)} alt="" className="h-10 w-10 rounded-lg object-cover" />
                    <span className="flex-1 text-xs font-extrabold">{env.emoji} {env.label}</span>
                    {active && <Check size={14} className="text-leaf-dark" />}
                  </button>
                </li>
              );
            })}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}

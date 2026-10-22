import { AnimatePresence, motion } from 'framer-motion';
import { useGame } from '../../hooks/useGameState';

const TONES = { ok: 'bg-leaf', error: 'bg-love', info: 'bg-ocean' } as const;

export function Toasts() {
  const { toasts } = useGame();
  return (
    <div className="pointer-events-none absolute inset-x-0 top-24 z-[70] flex flex-col items-center gap-2 px-4">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            initial={{ y: -20, opacity: 0, scale: 0.9 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ opacity: 0, y: -10 }}
            className={`${TONES[t.tone]} rounded-full px-4 py-2 text-sm font-extrabold text-white shadow-lg`}
          >
            {t.text}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

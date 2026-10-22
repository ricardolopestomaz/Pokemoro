import { motion } from 'framer-motion';
import { PokemonImage } from '../campsite/PokemonImage';
import { formatTime } from '../../lib/assets';

interface Props {
  progress: number;
  seconds: number;
  partnerId: number;
  distracted: boolean;
  running: boolean;
  caption: string;
}

const R = 118;
const C = 2 * Math.PI * R;

/** Relógio circular SVG com disco de Poké Bola e o parceiro estudando. */
export function CircularTimer({ progress, seconds, partnerId, distracted, running, caption }: Props) {
  return (
    <div className="flex flex-col items-center">
      <div className="text-6xl font-black tracking-wider text-white drop-shadow-[0_3px_0_rgba(0,0,0,0.25)]" role="timer" aria-live="off" id="timer-display">
        {formatTime(seconds).split(':').map((p, i) => (
          <span key={i}>{i > 0 && <span className="mx-0.5 opacity-70">:</span>}{p}</span>
        ))}
      </div>
      <div className="mt-1 text-[11px] font-black uppercase tracking-[0.25em] text-white/80">{caption}</div>

      <div className="relative mt-4 h-[270px] w-[270px]">
        <svg viewBox="0 0 270 270" className="absolute inset-0 -rotate-90">
          <circle cx="135" cy="135" r={R} fill="none" stroke="rgba(255,255,255,0.22)" strokeWidth="12" />
          <circle
            cx="135" cy="135" r={R} fill="none" stroke="#ffcb05" strokeWidth="12" strokeLinecap="round"
            strokeDasharray={C} strokeDashoffset={C * (1 - progress)}
            style={{ transition: 'stroke-dashoffset 0.3s linear', filter: 'drop-shadow(0 0 6px rgba(255,203,5,0.7))' }}
          />
        </svg>

        <div className="absolute inset-[26px] overflow-hidden rounded-full shadow-[0_10px_24px_rgba(0,0,0,0.35)]"
          style={{ background: 'linear-gradient(to bottom, #e5486b 0 50%, #dfe8ff 50% 100%)' }}>
          <div className="absolute left-0 right-0 top-1/2 h-3 -translate-y-1/2 bg-[#2b3a67]/80" />
          <div className="absolute left-1/2 top-1/2 h-12 w-12 -translate-x-1/2 -translate-y-1/2 rounded-full border-[5px] border-[#2b3a67]/80 bg-white/90" />
        </div>

        <motion.div
          className="absolute inset-0 flex items-center justify-center"
          animate={running && !distracted ? { y: [0, -5, 0] } : { y: 0 }}
          transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
        >
          <PokemonImage
            pokemonId={partnerId}
            alt="Parceiro de estudo"
            className="w-[62%] drop-shadow-xl"
          />
        </motion.div>
        {running && distracted && <div className="absolute right-8 top-8 text-3xl" aria-hidden>💤</div>}
      </div>
    </div>
  );
}

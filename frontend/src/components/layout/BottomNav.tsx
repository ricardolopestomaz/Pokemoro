import { BookOpen, Coffee, Timer, Users } from 'lucide-react';
import { motion } from 'framer-motion';
import { useGame } from '../../hooks/useGameState';
import { sfx } from '../../lib/sfx';
import type { TabId } from '../../types';

const ITEMS: { id: TabId; label: string; Icon: typeof Timer; color: string }[] = [
  { id: 'focus', label: 'Foco', Icon: Timer, color: '#4fc3f7' },
  { id: 'rest', label: 'Descanso', Icon: Coffee, color: '#ff8c42' },
  { id: 'team', label: 'Equipe', Icon: Users, color: '#48d0b0' },
  { id: 'dex', label: 'Focus Dex', Icon: BookOpen, color: '#ff5b84' },
];

export function BottomNav() {
  const { tab, setTab } = useGame();
  return (
    <nav className="absolute inset-x-3 bottom-3 z-40" aria-label="Navegação principal">
      <div className="glass flex items-center justify-around rounded-full px-2 py-1.5">
        {ITEMS.map(({ id, label, Icon, color }) => {
          const active = tab === id;
          return (
            <button
              key={id}
              id={`nav-${id}`}
              onClick={() => { sfx.tap(); setTab(id); }}
              className="relative flex w-[23%] flex-col items-center gap-0.5 rounded-full py-1.5 transition-transform active:scale-90"
            >
              {active && (
                <motion.span
                  layoutId="nav-pill"
                  className="absolute inset-0 rounded-full"
                  style={{ background: `${color}22`, boxShadow: `inset 0 0 0 2px ${color}` }}
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
              <Icon size={22} color={active ? color : '#9aa3b5'} strokeWidth={2.6} className="relative" />
              <span className="relative text-[10px] font-black" style={{ color: active ? color : '#9aa3b5' }}>{label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

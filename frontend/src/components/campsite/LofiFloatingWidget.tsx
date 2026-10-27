import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Volume2, VolumeX, Music, CloudRain, Flame, Disc, GripVertical, X } from 'lucide-react';
import { ambientSound, type AmbientSoundType } from '../../lib/ambientSound';
import { sfx } from '../../lib/sfx';

interface Props {
  containerRef?: React.RefObject<HTMLDivElement | null>;
}

const SOUND_PRESETS: { id: AmbientSoundType; label: string; desc: string; icon: typeof Music; color: string }[] = [
  { id: 'lofi', label: 'Lo-Fi Beats', desc: 'Batidas relaxantes de estudo estilo Poké-Rádio', icon: Disc, color: 'text-purple-600 bg-purple-100' },
  { id: 'rain', label: 'Chuva Serena', desc: 'Gotas suaves caindo no acampamento', icon: CloudRain, color: 'text-sky-600 bg-sky-100' },
  { id: 'fire', label: 'Fogueira', desc: 'Estalos acolhedores de lenha queimando', icon: Flame, color: 'text-orange-600 bg-orange-100' },
  { id: 'off', label: 'Silêncio', desc: 'Desligar sons ambientes', icon: VolumeX, color: 'text-slate-500 bg-slate-100' },
];

export function LofiFloatingWidget({ containerRef }: Props) {
  const [open, setOpen] = useState(false);
  const [sound, setSound] = useState<AmbientSoundType>(() => ambientSound.getCurrentType());
  const [volume, setVolumeState] = useState<number>(() => Math.round(ambientSound.getVolume() * 100));
  const isDragging = useRef(false);

  useEffect(() => {
    // Sincroniza estado com o motor de áudio
    setSound(ambientSound.getCurrentType());
    setVolumeState(Math.round(ambientSound.getVolume() * 100));
  }, [open]);

  const handleSelectSound = (type: AmbientSoundType) => {
    sfx.tap();
    if (type === 'off') {
      ambientSound.stop();
      setSound('off');
    } else {
      ambientSound.play(type);
      setSound(type);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = Number(e.target.value);
    setVolumeState(v);
    ambientSound.setVolume(v / 100);
  };

  const isPlaying = sound !== 'off';

  return (
    <motion.div
      drag
      dragConstraints={containerRef}
      dragMomentum={false}
      dragElastic={0.08}
      whileDrag={{ scale: 1.05, zIndex: 60 }}
      onDragStart={() => { isDragging.current = true; }}
      onDragEnd={() => { setTimeout(() => { isDragging.current = false; }, 80); }}
      className="absolute top-[80px] sm:top-[88px] left-1/2 -translate-x-1/2 z-30 pointer-events-auto select-none"
    >
      {/* Botão Pílula Modular Flutuante */}
      <button
        type="button"
        onClick={() => {
          if (!isDragging.current) {
            sfx.tap();
            setOpen((prev) => !prev);
          }
        }}
        className={`group flex items-center gap-1.5 rounded-full px-2.5 py-1.5 shadow-md border backdrop-blur-md transition-all active:scale-95 cursor-grab active:cursor-grabbing ${
          isPlaying
            ? 'bg-purple-600/90 text-white border-purple-300 shadow-purple-500/30'
            : 'bg-white/85 text-slate-800 border-white/80 hover:bg-white'
        }`}
        title="Poké-Rádio Lo-Fi & Ambiente (Arraste para reposicionar)"
        aria-label="Controle de Áudio Lo-Fi"
      >
        <span className="opacity-40 hover:opacity-100 flex items-center" title="Arraste para mover">
          <GripVertical size={12} />
        </span>

        {isPlaying ? (
          <div className="flex items-end gap-0.5 h-3.5 w-3.5 pb-0.5">
            <motion.span
              animate={{ height: ['25%', '95%', '35%'] }}
              transition={{ duration: 0.8, repeat: Infinity, ease: 'easeInOut' }}
              className="w-0.5 bg-white rounded-full"
            />
            <motion.span
              animate={{ height: ['75%', '30%', '100%'] }}
              transition={{ duration: 0.6, repeat: Infinity, ease: 'easeInOut', delay: 0.15 }}
              className="w-0.5 bg-white rounded-full"
            />
            <motion.span
              animate={{ height: ['40%', '85%', '25%'] }}
              transition={{ duration: 0.7, repeat: Infinity, ease: 'easeInOut', delay: 0.3 }}
              className="w-0.5 bg-white rounded-full"
            />
          </div>
        ) : (
          <Music size={14} className="text-slate-600" />
        )}

        <span className="text-[10px] font-black tracking-tight">
          {sound === 'lofi' ? 'Lo-Fi' : sound === 'rain' ? 'Chuva' : sound === 'fire' ? 'Fogo' : 'Lo-Fi'}
        </span>
      </button>

      {/* Mini-Dock Flutuante de Seleção de Som e Volume */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 12 }}
            exit={{ opacity: 0, scale: 0.9, y: 8 }}
            transition={{ type: 'spring', damping: 22, stiffness: 280 }}
            className="absolute left-1/2 -translate-x-1/2 w-64 rounded-3xl bg-white/95 p-3.5 shadow-2xl border border-slate-200/80 backdrop-blur-md text-slate-800 z-50 pointer-events-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Cabeçalho do Player */}
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-1.5">
                <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-purple-100 text-purple-700">
                  <Disc size={14} className={isPlaying ? 'animate-spin' : ''} style={{ animationDuration: '4s' }} />
                </div>
                <div>
                  <h4 className="text-xs font-black text-slate-900 leading-tight">Poké-Rádio Lo-Fi</h4>
                  <p className="text-[9px] font-bold text-slate-400">Áudio Ambiente de Descanso</p>
                </div>
              </div>
              <button
                onClick={() => { sfx.tap(); setOpen(false); }}
                className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200"
              >
                <X size={13} />
              </button>
            </div>

            {/* Presets de Sons */}
            <div className="mt-2.5 flex flex-col gap-1.5">
              {SOUND_PRESETS.map((preset) => {
                const active = sound === preset.id;
                const Icon = preset.icon;
                return (
                  <button
                    key={preset.id}
                    onClick={() => handleSelectSound(preset.id)}
                    className={`flex items-center gap-2.5 rounded-2xl p-2 text-left transition-all active:scale-98 border ${
                      active
                        ? 'border-purple-300 bg-purple-50/80 shadow-xs'
                        : 'border-transparent hover:bg-slate-50'
                    }`}
                  >
                    <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${preset.color}`}>
                      <Icon size={16} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-slate-900">{preset.label}</span>
                        {active && (
                          <span className="rounded-full bg-purple-600 px-1.5 py-0.2 text-[8px] font-black uppercase text-white">
                            Ativo
                          </span>
                        )}
                      </div>
                      <p className="text-[9px] font-semibold text-slate-400 truncate">{preset.desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Controle de Volume */}
            {isPlaying && (
              <div className="mt-3 pt-2.5 border-t border-slate-100">
                <div className="flex items-center justify-between text-[10px] font-bold text-slate-600 mb-1">
                  <span className="flex items-center gap-1">
                    <Volume2 size={12} /> Volume
                  </span>
                  <span>{volume}%</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="150"
                  value={volume}
                  onChange={handleVolumeChange}
                  className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-slate-200 accent-purple-600"
                />
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

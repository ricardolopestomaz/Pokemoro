import { useState } from 'react';
import { motion } from 'framer-motion';
import { Camera, Sparkles, BookOpen } from 'lucide-react';
import { useGame } from '../../hooks/useGameState';
import { PokemonSpawn } from './PokemonSpawn';
import { PokemonImage } from './PokemonImage';
import { EnvironmentPicker } from './EnvironmentPicker';
import { sfx } from '../../lib/sfx';
import type { SpawnedPokemon } from '../../types';

interface Props {
  onOpenSpawn: (s: SpawnedPokemon) => void;
}

/** Hub principal: cenário com Pokémon dormindo nas coordenadas normalizadas do backend. */
export function Campsite({ onOpenSpawn }: Props) {
  const { coffeeBreak, team, setTab } = useGame();
  const spawns = coffeeBreak?.spawns ?? [];
  const partnerId = team?.activeTeam[0]?.pokemonId ?? 10;
  const partnerVariant = team?.activeTeam[0]?.variant ?? 'regular';
  const recruited = spawns.filter((s) => s.isAlreadyRecruited).length;

  return (
    <section className="absolute inset-0 z-10" aria-label="Cenário de descanso">
      {/* Camada dos Pokémon dormindo */}
      <div className="absolute inset-0">
        {spawns.map((s, i) => (
          <PokemonSpawn key={s.spawnId} spawn={s} index={i} onClick={onOpenSpawn} />
        ))}

        {/* Estado vazio: parceiro descansando no tapete central */}
        {spawns.length === 0 && (
          <div className="absolute left-1/2 top-1/2 flex w-[82%] -translate-x-1/2 -translate-y-1/2 flex-col items-center">
            {/* Balão acolhedor */}
            <motion.div
              initial={{ y: -10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="glass relative mb-3 rounded-2xl px-4 py-2.5 text-center text-xs font-extrabold text-ink shadow-md"
            >
              <span>Seu cantinho de descanso está pronto! Complete um Pomodoro para atrair novos amigos Pokémon. 🍃</span>
              <span className="absolute -bottom-2 left-1/2 h-3 w-3 -translate-x-1/2 rotate-45 bg-white/90" />
            </motion.div>

            {/* Animação do parceiro dormindo com respiração suave */}
            <motion.div
              animate={{ scaleY: [1, 1.05, 1], scaleX: [1, 0.99, 1] }}
              transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
              style={{ transformOrigin: '50% 90%' }}
              className="relative w-[65%]"
            >
              <PokemonImage
                pokemonId={partnerId}
                variant={partnerVariant}
                alt="Pokémon parceiro"
                className="w-full"
              />
              {/* Partículas de Zzz flutuantes */}
              <motion.span
                animate={{ y: [-10, -40], x: [0, 15], opacity: [0, 1, 0] }}
                transition={{ duration: 2.6, repeat: Infinity, ease: 'easeOut' }}
                className="pointer-events-none absolute -right-2 top-0 text-xl font-black text-leaf-dark select-none"
              >
                💤
              </motion.span>
            </motion.div>

            {/* Botão de ação rápida para iniciar o foco */}
            <button
              id="btn-go-focus"
              className="btn btn-green mt-4 flex items-center gap-2 px-6 py-3 text-sm shadow-lg"
              onClick={() => {
                sfx.tap();
                setTab('focus');
              }}
            >
              <Sparkles size={16} /> Começar a estudar
            </button>
          </div>
        )}
      </div>

      {/* Seletor de cenário */}
      <EnvironmentPicker />

      {/* Barra de Status Inferior estilo exemplo-main-2.jpg */}
      {spawns.length > 0 && (
        <div className="absolute bottom-20 inset-x-3 z-30 flex items-center justify-between pointer-events-none">
          {/* Card: Pokémon Pesquisados */}
          <div className="glass pointer-events-auto flex items-center gap-2.5 rounded-full px-4 py-2 shadow-md">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-leaf text-white shadow-xs">
              <BookOpen size={14} />
            </span>
            <div className="flex flex-col">
              <span className="text-[9px] font-black uppercase tracking-wider text-ink/60">Amizades de Hoje</span>
              <span className="text-xs font-black text-ink">{recruited} de {spawns.length} recrutados</span>
            </div>
          </div>

          {/* Botão da Câmera (abrir primeira descoberta não registrada) */}
          <button
            onClick={() => {
              sfx.tap();
              const unrecruited = spawns.find((s) => !s.isAlreadyRecruited) || spawns[0];
              if (unrecruited) onOpenSpawn(unrecruited);
            }}
            className="pointer-events-auto flex h-14 w-14 items-center justify-center rounded-full border-4 border-white bg-gradient-to-tr from-leaf to-[#5be3c0] text-white shadow-xl transition-transform active:scale-90"
            aria-label="Fotografar Pokémon no acampamento"
            title="Fotografar e registrar"
          >
            <Camera size={26} strokeWidth={2.5} />
          </button>
        </div>
      )}
    </section>
  );
}

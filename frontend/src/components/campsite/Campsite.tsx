import { motion } from 'framer-motion';
import { Camera, Sparkles, BookOpen } from 'lucide-react';
import { useGame } from '../../hooks/useGameState';
import { PokemonSpawn } from './PokemonSpawn';
import { PokemonImage } from './PokemonImage';
import { EnvironmentPicker } from './EnvironmentPicker';
import { captureScenePhoto } from '../../lib/photoCapture';
import { sleepSprite } from '../../lib/assets';
import { sfx } from '../../lib/sfx';
import type { SpawnedPokemon, UserPokemon } from '../../types';

interface Props {
  onOpenSpawn: (s: SpawnedPokemon, photoDataUrl?: string) => void;
  isTour?: boolean;
}

/** Hub principal: cenário com o Pokémon Líder dormindo no centro e os visitantes do Coffee Break. */
export function Campsite({ onOpenSpawn, isTour = false }: Props) {
  const { coffeeBreak, team, collection, profile, setTab, toast } = useGame();
  const spawns = isTour ? [] : (coffeeBreak?.spawns ?? []);
  const activeTeam = team?.activeTeam ?? [];
  const leader: UserPokemon = activeTeam[0] || collection?.[0] || {
    id: 'caterpie-starter-01',
    pokemonId: 10,
    nickname: 'Caterpie',
    variant: 'regular',
    friendshipLevel: 1,
    discoveredStyles: [1],
    role: 'ITEMS',
    passiveBonusDescription: '+20% de Moedas de Foco e biscoitos adicionais nas pausas',
    recruitedAt: '',
  };
  const recruited = spawns.filter((s) => s.isAlreadyRecruited).length;
  const leaderSprite = leader ? sleepSprite(leader.pokemonId, 1, leader.variant) : '';

  const handleSpawnClick = async (s: SpawnedPokemon) => {
    sfx.tap();
    const photoUrl = await captureScenePhoto({
      targetSpawn: s,
      allSpawns: spawns,
      leader: leader,
      environment: profile?.activeEnvironment ?? 'greengrass',
    });
    onOpenSpawn(s, photoUrl);
  };

  const handleCameraClick = async () => {
    sfx.tap();
    const target = spawns.find((s) => !s.isAlreadyRecruited) || spawns[0];
    if (target) {
      const photoUrl = await captureScenePhoto({
        targetSpawn: target,
        allSpawns: spawns,
        leader: leader,
        environment: profile?.activeEnvironment ?? 'greengrass',
      });
      onOpenSpawn(target, photoUrl);
    }
  };

  return (
    <section className="absolute inset-0 z-10" aria-label="Cenário de descanso">
      {/* 1. Camada dos Pokémon dormindo no cenário */}
      <div className="absolute inset-0">

        {/* Pokémon Líder dormindo no centro — com acabamento Balatro Foil holográfico (sempre presente fora do tour) */}
        {!isTour && leader && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ zIndex: 10 }}>
            <motion.div
              animate={{ scaleY: [1, 1.03, 1], y: [0, -3, 0] }}
              transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
              className="relative flex flex-col items-center pointer-events-auto mt-20 cursor-pointer"
              style={{ opacity: 1 }}
              onClick={() => {
                sfx.tap();
                toast?.(`${leader.nickname} é o Líder da sua Equipe de Estudos! 💤`, 'ok');
              }}
            >
              <div className="balatro-foil-sprite relative w-36" style={{ opacity: 1 }}>
                <PokemonImage
                  pokemonId={leader.pokemonId}
                  style={1}
                  variant={leader.variant}
                  alt={leader.nickname}
                  className="w-full drop-shadow-xl"
                />
                {/* Camada Holográfica Balatro Foil com máscara no formato do sprite (sem quadrado e sem piscar) */}
                <div
                  className="balatro-foil-overlay"
                  style={{
                    WebkitMaskImage: `url('${leaderSprite}')`,
                    maskImage: `url('${leaderSprite}')`,
                  }}
                  aria-hidden="true"
                />
              </div>
              <div className="mt-2 flex items-center gap-1.5 rounded-full bg-white/95 px-3.5 py-0.5 text-[11px] font-black text-slate-700 shadow-md backdrop-blur-xs border border-white/60">
                <Sparkles size={11} className="text-amber-500" />
                <span>{leader.nickname} (Líder)</span>
                <span className="text-[10px] text-amber-500 font-black">★</span>
              </div>
            </motion.div>
          </div>
        )}

        {/* Spawns descansando do Coffee Break */}
        {spawns.map((s, i) => (
          <PokemonSpawn key={s.spawnId} spawn={s} index={i} onClick={handleSpawnClick} />
        ))}

        {/* Estado inicial / vazio: convite amigável para estudar posicionado perfeitamente abaixo do TopHUD */}
        {spawns.length === 0 && !isTour && (
          <div className="absolute left-1/2 top-24 z-25 flex w-[86%] -translate-x-1/2 flex-col items-center">
            <motion.div
              initial={{ y: -10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="glass relative mb-2.5 rounded-2xl px-4 py-2.5 text-center text-xs font-extrabold text-ink shadow-md backdrop-blur-xs"
            >
              <span>Seu cantinho de descanso está pronto! Complete um Pomodoro para atrair novos amigos Pokémon. 🍃</span>
            </motion.div>

            <button
              id="btn-go-focus"
              className="btn btn-green flex items-center gap-2 px-5 py-2.5 text-xs shadow-lg active:scale-95"
              onClick={() => {
                sfx.tap();
                setTab('focus');
              }}
            >
              <Sparkles size={15} /> Começar a estudar
            </button>
          </div>
        )}
      </div>

      {/* Seletor de cenário */}
      {!isTour && <EnvironmentPicker />}

      {/* Barra de Status Inferior */}
      {!isTour && spawns.length > 0 && (
        <div className="absolute bottom-20 inset-x-3 z-30 flex items-center justify-between pointer-events-none">
          <div className="glass pointer-events-auto flex items-center gap-2.5 rounded-full px-4 py-2 shadow-md">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-leaf text-white shadow-xs">
              <BookOpen size={14} />
            </span>
            <div className="flex flex-col">
              <span className="text-[9px] font-black uppercase tracking-wider text-ink/60">Amizades de Hoje</span>
              <span className="text-xs font-black text-ink">{recruited} de {spawns.length} recrutados</span>
            </div>
          </div>

          <button
            onClick={handleCameraClick}
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

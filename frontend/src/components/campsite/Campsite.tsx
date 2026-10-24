import { useState, useRef, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Camera, Sparkles, BookOpen } from 'lucide-react';
import { useGame } from '../../hooks/useGameState';
import { PokemonSpawn } from './PokemonSpawn';
import { PokemonImage } from './PokemonImage';
import { EnvironmentPicker } from './EnvironmentPicker';
import { captureScenePhoto } from '../../lib/photoCapture';
import { menuSprite, sleepSprite } from '../../lib/assets';
import { sfx } from '../../lib/sfx';
import { getPokemonReaction, type PokemonEmotion } from '../../lib/pokemonEmotions';
import type { SpawnedPokemon, UserPokemon } from '../../types';

interface Props {
  onOpenSpawn: (s: SpawnedPokemon, photoDataUrl?: string) => void;
  isTour?: boolean;
}

/** Hub principal: cenário com o Pokémon Líder dormindo no centro e os visitantes do Coffee Break. */
export function Campsite({ onOpenSpawn, isTour = false }: Props) {
  const { coffeeBreak, team, collection, profile, settings, setTab } = useGame();
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

  const fullTeam: UserPokemon[] = (activeTeam.length > 0 ? activeTeam : (leader ? [leader] : [])).slice(0, 5);

  const [bubble, setBubble] = useState<{
    memberId: string;
    emotion: PokemonEmotion;
    emoji: string;
    emoteSprite: string;
  } | null>(null);
  const [awakeMembers, setAwakeMembers] = useState<Record<string, boolean>>({});
  const clickCounts = useRef<Record<string, number>>({});
  const awakeReactionCount = useRef<Record<string, number>>({});
  const bubbleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sleepTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  // Limpar timers ao desmontar componente
  useEffect(() => {
    return () => {
      Object.values(sleepTimers.current).forEach(clearTimeout);
      if (bubbleTimer.current) clearTimeout(bubbleTimer.current);
    };
  }, []);

  const handleMemberClick = (member: UserPokemon) => {
    const isAwake = Boolean(awakeMembers[member.id]);

    // Se já está acordado, só reage com emoji MAIS UMA VEZ ("ao acordar ele só faz o emoji mais uma vez")
    if (isAwake) {
      const reactionsDone = awakeReactionCount.current[member.id] || 0;
      if (reactionsDone >= 1) {
        return; // Não permite spammar mais de uma vez enquanto acordado
      }
      awakeReactionCount.current[member.id] = reactionsDone + 1;
    }

    const currentCount = isAwake ? 1 : (clickCounts.current[member.id] || 0) + 1;
    if (!isAwake) {
      clickCounts.current[member.id] = currentCount;
    }

    const reaction = getPokemonReaction(
      member.friendshipLevel,
      profile?.streakDays || 0,
      currentCount,
      isAwake
    );

    // Efeitos sonoros contextualizados
    if (reaction.emotion === 'angry') {
      sfx.warn();
    } else if (reaction.wakesUp) {
      sfx.bell();
    } else {
      sfx.tap();
    }

    // Ao 4º clique consecutivo: o Pokémon acorda e fica acordado por ~8.5s
    if (reaction.wakesUp) {
      setAwakeMembers((prev) => ({ ...prev, [member.id]: true }));
      awakeReactionCount.current[member.id] = 0; // zera contador para permitir exatamente mais 1 reação acordado

      if (sleepTimers.current[member.id]) {
        clearTimeout(sleepTimers.current[member.id]);
      }

      // Fica acordado por um tempo suave e considerável antes de voltar a dormir
      sleepTimers.current[member.id] = setTimeout(() => {
        setAwakeMembers((prev) => ({ ...prev, [member.id]: false }));
        clickCounts.current[member.id] = 0;
        awakeReactionCount.current[member.id] = 0;
      }, 8500);
    }

    setBubble({
      memberId: member.id,
      emotion: reaction.emotion,
      emoji: reaction.emoji,
      emoteSprite: reaction.emoteSprite,
    });

    if (bubbleTimer.current) clearTimeout(bubbleTimer.current);
    bubbleTimer.current = setTimeout(() => {
      setBubble(null);
    }, 2200);
  };

  const TEAM_LAYOUT = [
    { left: '50%', top: '55%', width: 'w-28 sm:w-34', zIndex: 12, isLeader: true },
    { left: '30%', top: '47%', width: 'w-20 sm:w-24', zIndex: 10, isLeader: false },
    { left: '70%', top: '47%', width: 'w-20 sm:w-24', zIndex: 10, isLeader: false },
    { left: '26%', top: '63%', width: 'w-20 sm:w-24', zIndex: 11, isLeader: false },
    { left: '74%', top: '63%', width: 'w-20 sm:w-24', zIndex: 11, isLeader: false },
  ];

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

        {/* Equipe Ativa dormindo no tapete com efeito Balatro Foil individual */}
        {!isTour && fullTeam.map((member, idx) => {
          const pos = TEAM_LAYOUT[idx] || TEAM_LAYOUT[0];
          const isAwake = Boolean(awakeMembers[member.id]);
          const memberStyle = (member.discoveredStyles?.[0] || 1) as 1 | 2 | 3;
          const memberSprite = isAwake
            ? menuSprite(member.pokemonId, member.variant)
            : sleepSprite(member.pokemonId, memberStyle, member.variant);

          return (
            <div
              key={member.id || `team-${idx}-${member.pokemonId}`}
              className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center pointer-events-auto cursor-pointer select-none"
              style={{ left: pos.left, top: pos.top, zIndex: bubble?.memberId === member.id ? 45 : pos.zIndex }}
              onClick={() => handleMemberClick(member)}
            >
              {/* Balão oficial de emoção pixelado estilo Pokémon Mystery Dungeon com os sprites de emojis.png */}
              <AnimatePresence>
                {bubble?.memberId === member.id && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.2, y: 8 }}
                    animate={
                      bubble.emotion === 'angry'
                        ? { opacity: 1, scale: [0.2, 1.4, 1.15, 1.3, 1.2], rotate: [0, -14, 14, -8, 8, 0], y: -10 }
                        : bubble.emotion === 'awake'
                        ? { opacity: 1, scale: [0.2, 1.5, 1.15, 1.35, 1.2], y: [0, -18, -12] }
                        : { opacity: 1, scale: [0.2, 1.35, 1.05, 1.25, 1.15], rotate: [0, -8, 8, 0], y: -10 }
                    }
                    exit={{ opacity: 0, scale: 0.4, y: -4 }}
                    transition={{ duration: 0.42, ease: 'easeOut' }}
                    className={`absolute bottom-full mb-1 z-50 flex flex-col items-center pointer-events-none pixel-emote-bubble ${
                      bubble.emotion === 'loving'
                        ? 'border-rose-400'
                        : bubble.emotion === 'happy'
                        ? 'border-amber-400'
                        : bubble.emotion === 'sad'
                        ? 'border-sky-400'
                        : 'border-emerald-400'
                    }`}
                  >
                    <img
                      src={bubble.emoteSprite}
                      alt={bubble.emotion}
                      draggable={false}
                      className="w-11 h-11 select-none drop-shadow-md pixelated"
                      style={{ imageRendering: 'pixelated' }}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
              <motion.div
                animate={
                  settings?.lowPowerMode
                    ? { scaleY: 1, y: 0 }
                    : isAwake
                    ? { scale: [1, 1.05, 1], y: [0, -5, 0] }
                    : { scaleY: [1, 1.035, 1], y: [0, -2.5, 0] }
                }
                transition={
                  settings?.lowPowerMode
                    ? undefined
                    : isAwake
                    ? { duration: 1.8, repeat: Infinity, ease: 'easeInOut' }
                    : { duration: 3.2 + idx * 0.35, repeat: Infinity, ease: 'easeInOut' }
                }
                className="flex flex-col items-center"
              >
                <div className={`balatro-foil-sprite relative ${pos.width}`} style={{ opacity: 1 }}>
                  <PokemonImage
                    key={`${member.pokemonId}-${isAwake ? 'awake' : 'sleep'}`}
                    pokemonId={member.pokemonId}
                    style={memberStyle}
                    variant={member.variant}
                    menu={isAwake}
                    alt={member.nickname}
                    className="w-full drop-shadow-xl"
                  />
                  {/* Camada Holográfica Balatro Foil com máscara no formato do sprite */}
                  {settings?.enableFoilEffect && !settings?.lowPowerMode && (
                    <div
                      className="balatro-foil-overlay"
                      style={{
                        WebkitMaskImage: `url('${memberSprite}')`,
                        maskImage: `url('${memberSprite}')`,
                      }}
                      aria-hidden="true"
                    />
                  )}
                </div>

                {/* UX/UI Clean: Nomes contextuais elegantes sem poluição visual no cenário */}
                <AnimatePresence>
                  {bubble?.memberId === member.id || isAwake ? (
                    <motion.div
                      key={`active-${member.id}`}
                      initial={{ opacity: 0, scale: 0.85, y: -3 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9, y: 1 }}
                      transition={{ duration: 0.18 }}
                      className={`mt-1 flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-black shadow-md border ${
                        isAwake
                          ? 'bg-amber-500 text-amber-950 border-amber-300 shadow-amber-500/20 animate-pulse'
                          : 'bg-slate-900/75 backdrop-blur-md text-white border-white/20 shadow-black/20'
                      }`}
                    >
                      {isAwake ? (
                        <>
                          <span className="text-[10px]">👀</span>
                          <span className="truncate max-w-[85px]">{member.nickname} (Acordou!)</span>
                        </>
                      ) : pos.isLeader ? (
                        <>
                          <Sparkles size={9} className="text-amber-300 fill-amber-300" />
                          <span className="truncate max-w-[85px]">{member.nickname} (Líder)</span>
                          <span className="text-[8px] text-amber-300">★</span>
                        </>
                      ) : (
                        <span className="truncate max-w-[75px]">{member.nickname}</span>
                      )}
                    </motion.div>
                  ) : pos.isLeader ? (
                    <motion.div
                      key={`leader-idle-${member.id}`}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="mt-1 flex items-center gap-1 rounded-full bg-slate-900/40 backdrop-blur-xs px-2 py-0.5 text-[9px] font-bold text-white/85 shadow-xs border border-white/15"
                    >
                      <Sparkles size={8} className="text-amber-400 fill-amber-400" />
                      <span className="truncate max-w-[80px]">{member.nickname} (Líder)</span>
                      <span className="text-[8px] text-amber-400 font-black">★</span>
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              </motion.div>
            </div>
          );
        })}

        {/* Spawns descansando do Coffee Break */}
        {spawns.map((s, i) => (
          <PokemonSpawn key={s.spawnId} spawn={s} index={i} onClick={handleSpawnClick} />
        ))}

        {/* Estado inicial / vazio: convite amigável para estudar posicionado perfeitamente abaixo do TopHUD sem sobreposição */}
        {spawns.length === 0 && !isTour && (
          <div className="absolute left-1/2 top-[82px] sm:top-[92px] z-25 flex w-[86%] max-w-sm -translate-x-1/2 flex-col items-center pointer-events-none">
            <motion.div
              initial={{ y: -10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="glass pointer-events-auto relative mb-2.5 rounded-2xl px-4 py-2.5 text-center text-xs font-extrabold text-ink shadow-md backdrop-blur-xs border border-white/80"
            >
              <span>Seu cantinho de descanso está pronto! Complete um Pomodoro para atrair novos amigos Pokémon. 🍃</span>
            </motion.div>

            <button
              id="btn-go-focus"
              className="btn btn-green pointer-events-auto flex items-center gap-2 px-5 py-2.5 text-xs shadow-lg active:scale-95"
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

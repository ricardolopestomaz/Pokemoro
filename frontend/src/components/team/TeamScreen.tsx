import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, ClipboardList, Edit3, Heart, Plus, Sparkles, Star, Users, X, Zap } from 'lucide-react';
import confetti from 'canvas-confetti';
import { api } from '../../api/endpoints';
import { useGame } from '../../hooks/useGameState';
import { PokemonImage } from '../campsite/PokemonImage';
import { ROLE_INFO, envUrl } from '../../lib/assets';
import { sfx } from '../../lib/sfx';
import { getEvolutionOption } from '../../data/evolution-tree';
import type { StudyRole, UserPokemon } from '../../types';

const MAX_TEAM = 5;

export function TeamScreen() {
  const { team, collection, refreshTeam, toast, renamePokemon, evolvePokemon } = useGame();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [teamName, setTeamName] = useState(() => localStorage.getItem('pokemoro_team_name') || 'Dream Team');
  const [editingName, setEditingName] = useState(false);
  const [newNameInput, setNewNameInput] = useState(teamName);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [boxFilter, setBoxFilter] = useState<'ALL' | StudyRole>('ALL');
  const [saving, setSaving] = useState(false);
  const [editingNickname, setEditingNickname] = useState(false);
  const [nicknameInput, setNicknameInput] = useState('');
  const [evolving, setEvolving] = useState(false);

  // Sincroniza com a equipe salva no backend
  useEffect(() => {
    setSelectedIds((team?.activeTeam ?? []).map((p) => p.id));
  }, [team]);

  const byId = useMemo(() => new Map(collection.map((p) => [p.id, p])), [collection]);
  const activeMembers = selectedIds.map((id) => byId.get(id)).filter(Boolean) as UserPokemon[];
  const dirty = JSON.stringify(selectedIds) !== JSON.stringify((team?.activeTeam ?? []).map((p) => p.id));

  // Cálculo de Poder de Equipe (Team RP)
  const teamPower = useMemo(() => {
    if (activeMembers.length === 0) return 1200;
    return activeMembers.reduce((sum, p) => sum + 1500 + p.friendshipLevel * 240, 0);
  }, [activeMembers]);

  // Pokémon em destaque na grama superior
  const showcased = activeMembers[highlightedIndex] || activeMembers[0] || collection[0];

  const handleToggle = (id: string) => {
    sfx.tap();
    setSelectedIds((prev) => {
      if (prev.includes(id)) {
        const next = prev.filter((x) => x !== id);
        return next;
      }
      if (prev.length >= MAX_TEAM) {
        toast(`A equipe comporta no máximo ${MAX_TEAM} Study Buddies!`, 'info');
        return prev;
      }
      return [...prev, id];
    });
  };

  const handleAutoPick = () => {
    sfx.fanfare();
    if (collection.length === 0) {
      toast('Você ainda não tem Pokémon na Box para auto-organizar!', 'info');
      return;
    }
    // Prioriza maior amizade e diversidade de papéis
    const sorted = [...collection].sort((a, b) => b.friendshipLevel - a.friendshipLevel);
    const chosen: UserPokemon[] = [];
    const usedRoles = new Set<string>();

    for (const p of sorted) {
      if (chosen.length >= MAX_TEAM) break;
      if (!usedRoles.has(p.role) || chosen.length + (sorted.length - chosen.length) <= MAX_TEAM) {
        chosen.push(p);
        usedRoles.add(p.role);
      }
    }
    // Se faltou preencher 5
    for (const p of sorted) {
      if (chosen.length >= MAX_TEAM) break;
      if (!chosen.find((c) => c.id === p.id)) {
        chosen.push(p);
      }
    }

    setSelectedIds(chosen.map((c) => c.id));
    toast('Equipe ideal selecionada!', 'ok');
  };

  const handleSaveTeam = async () => {
    setSaving(true);
    try {
      await api.setTeam(selectedIds);
      await refreshTeam();
      sfx.fanfare();
      toast('Equipe de estudos salva com sucesso!', 'ok');
    } catch (e) {
      toast((e as Error).message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveName = () => {
    const trimmed = newNameInput.trim() || 'Dream Team';
    setTeamName(trimmed);
    localStorage.setItem('pokemoro_team_name', trimmed);
    setEditingName(false);
    sfx.tap();
  };

  const filteredBox = useMemo(() => {
    if (boxFilter === 'ALL') return collection;
    return collection.filter((p) => p.role === boxFilter);
  }, [collection, boxFilter]);

  return (
    <section
      className="absolute inset-0 z-20 overflow-y-auto bg-cream pb-28 pt-[84px] no-scrollbar"
      aria-label="Equipe de Study Buddies"
    >
      {/* 1. Header estilo exemplo-teme-pokemon.jpg */}
      <div className="flex items-center justify-between px-4 py-2">
        <div className="flex items-center gap-1.5 rounded-full bg-warm-orange px-3 py-1 text-xs font-black uppercase text-white shadow-sm">
          <Users size={14} />
          <span>Equipe</span>
        </div>

        <div className="text-right">
          <div className="text-[10px] font-black uppercase tracking-wider text-warm-orange">Poder da Equipe (RP)</div>
          <div className="text-2xl font-black tracking-tight text-ink">
            {teamPower.toLocaleString('pt-BR')}
          </div>
        </div>
      </div>

      {/* 2. Meadow Showcase do Líder com Fundo de Mato Greengrass e Pokémon Dormindo Ampliado */}
      <div className="relative mx-4 mt-2 overflow-hidden rounded-[2.2rem] border-2 border-white/90 shadow-lg">
        {/* Fundo de Mato (Greengrass Isle) com enquadramento vibrante */}
        <img
          src={envUrl('greengrass')}
          alt="Mato Greengrass"
          className="absolute inset-0 h-full w-full object-cover brightness-105 saturate-125"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/25 via-leaf-dark/20 to-black/50" />

        {/* Partículas decorativas no fundo */}
        <div className="pointer-events-none absolute inset-0">
          <motion.span
            animate={{ y: [-4, 6, -4], opacity: [0.4, 0.9, 0.4] }}
            transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute left-6 top-5 text-sm select-none"
          >
            ✨
          </motion.span>
          <motion.span
            animate={{ y: [6, -6, 6], opacity: [0.3, 0.8, 0.3] }}
            transition={{ duration: 4.2, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
            className="absolute right-7 top-12 text-sm select-none"
          >
            🍃
          </motion.span>
        </div>

        {/* Botão de Stats */}
        <button
          onClick={() => { sfx.tap(); setShowStatsModal(true); }}
          disabled={!showcased}
          className="absolute right-3 top-3 z-20 flex flex-col items-center rounded-2xl border border-white/80 bg-white/95 px-2.5 py-1.5 shadow-sm backdrop-blur-xs transition-transform active:scale-95 disabled:opacity-40"
          title="Ver estatísticas detalhadas"
        >
          <ClipboardList size={18} className="text-warm-orange-dark" />
          <span className="text-[9px] font-black uppercase text-ink/70">Stats</span>
        </button>

        {/* Todos os Pokémon Ativos no Cenário Greengrass (sem pedestal ou círculo embaixo) */}
        <div className="relative z-10 flex min-h-[175px] flex-col items-center justify-end px-2 pb-3 pt-8">
          {activeMembers.some(Boolean) ? (
            <div className="flex w-full items-end justify-center gap-1 sm:gap-2">
              {activeMembers.map((member, idx) => {
                if (!member) return null;
                const isLeader = idx === 0;
                const isSelected = highlightedIndex === idx;

                return (
                  <motion.div
                    key={member.id}
                    initial={{ scale: 0.85, opacity: 0, y: 12 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    transition={{ type: 'spring', stiffness: 260, damping: 20, delay: idx * 0.05 }}
                    onClick={() => {
                      sfx.tap();
                      setHighlightedIndex(idx);
                    }}
                    className={`relative flex flex-1 max-w-[76px] cursor-pointer flex-col items-center transition-all ${
                      isSelected ? 'scale-105 z-20' : 'z-10 opacity-90 hover:opacity-100'
                    }`}
                  >
                    {/* Tag flutuante individual do membro */}
                    <div
                      className={`mb-1 flex items-center gap-0.5 rounded-full border px-1.5 py-0.5 shadow-sm backdrop-blur-xs transition-colors ${
                        isSelected
                          ? 'border-leaf bg-white text-leaf-dark ring-2 ring-leaf/40 font-black'
                          : 'border-white/80 bg-white/95 text-ink'
                      }`}
                    >
                      {isLeader && (
                        <span className="rounded-full bg-sleep-yellow px-1 text-[7px] font-black text-ink">
                          👑
                        </span>
                      )}
                      <span className="max-w-[42px] truncate text-[8px] font-black">{member.nickname}</span>
                      <span className="text-[7px] font-bold text-leaf-dark">L{member.friendshipLevel}</span>
                    </div>

                    {/* Sprite Dormindo do Pokémon (SEM NENHUM CÍRCULO/PEDESTAL EMBAIXO) */}
                    <motion.div
                      animate={{
                        scaleY: [1, 1.035, 1],
                        scaleX: [1, 0.995, 1],
                        y: [0, -2, 0],
                      }}
                      transition={{
                        duration: 2.8 + idx * 0.25,
                        repeat: Infinity,
                        ease: 'easeInOut',
                      }}
                      style={{ transformOrigin: '50% 90%' }}
                      className={`relative flex items-end justify-center ${
                        isLeader ? 'h-24 w-24 scale-110' : 'h-20 w-20'
                      }`}
                    >
                      <PokemonImage
                        pokemonId={member.pokemonId}
                        style={1}
                        variant={member.variant}
                        alt={member.nickname}
                        className="h-full w-full object-contain drop-shadow-md"
                      />
                    </motion.div>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <div className="flex h-36 flex-col items-center justify-center text-white/90">
              <Sparkles size={32} className="animate-pulse" />
              <p className="mt-2 text-xs font-black">Nenhum parceiro escalado</p>
            </div>
          )}
        </div>
      </div>

      {/* 3. Team Name Banner com botão de edição */}
      <div className="mx-4 mt-3 flex items-center justify-center">
        {editingName ? (
          <div className="flex items-center gap-2 rounded-full border-2 border-leaf bg-white px-3 py-1 shadow-sm">
            <input
              value={newNameInput}
              maxLength={20}
              onChange={(e) => setNewNameInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
              className="w-36 text-center text-xs font-black text-ink outline-none"
              autoFocus
            />
            <button onClick={handleSaveName} className="text-xs font-black text-leaf-dark">Salvar</button>
          </div>
        ) : (
          <button
            onClick={() => { setEditingName(true); setNewNameInput(teamName); }}
            className="flex items-center gap-2 rounded-full border-2 border-leaf bg-gradient-to-r from-leaf to-leaf-dark px-4 py-1 text-xs font-black text-white shadow-sm transition-transform active:scale-95"
          >
            <span>{teamName}</span>
            <Edit3 size={12} className="text-white/80" />
          </button>
        )}
      </div>

      {/* 4. Os 5 Cards Verticais de Slots (com overflow-visible para o botão X não ser cortado) */}
      <div className="mx-4 mt-3 grid grid-cols-5 gap-1.5">
        {Array.from({ length: MAX_TEAM }).map((_, i) => {
          const p = activeMembers[i];
          const isLeader = i === 0 && !!p;
          const isHighlighted = highlightedIndex === i && !!p;

          return (
            <motion.div
              key={i}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                if (p) {
                  sfx.tap();
                  setHighlightedIndex(i);
                }
              }}
              className={`relative flex flex-col items-center justify-between rounded-2xl border-2 bg-white p-1 pb-2 shadow-sm transition-all ${
                isHighlighted
                  ? 'border-leaf ring-2 ring-leaf/40 shadow-md'
                  : 'border-ink/10'
              } ${p ? 'cursor-pointer' : 'border-dashed !bg-white/40'}`}
              style={{ minHeight: '130px', overflow: 'visible' }}
            >
              {/* Leader Ribbon Badge com overflow restrito apenas ao badge */}
              {isLeader && (
                <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl">
                  <div className="absolute -left-5 top-1.5 w-20 -rotate-45 bg-warm-orange py-0.5 text-center text-[7px] font-black uppercase tracking-wider text-white shadow">
                    Leader
                  </div>
                </div>
              )}

              {p ? (
                <>
                  <div className="mt-1 flex w-full justify-end pr-1">
                    <span className="text-[9px] font-black text-leaf-dark">Lv. {p.friendshipLevel}</span>
                  </div>

                  <div className="my-1 h-14 w-14">
                    <PokemonImage
                      pokemonId={p.pokemonId}
                      menu
                      variant={p.variant}
                      className="h-full w-full object-contain"
                    />
                  </div>

                  <div className="w-full text-center">
                    <div className="truncate text-[10px] font-black text-ink">{p.nickname}</div>
                    {/* Role Pill & Mini Barra de Energia */}
                    <div className="mt-1 flex items-center justify-center gap-1">
                      <span className="text-[10px]">{ROLE_INFO[p.role]?.emoji}</span>
                      <div className="h-1.5 w-7 overflow-hidden rounded-full bg-ink/10">
                        <div
                          className="h-full rounded-full"
                          style={{
                            background: ROLE_INFO[p.role]?.color || '#48d0b0',
                            width: `${Math.min(100, p.friendshipLevel * 20)}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Botão de remover do slot: 100% visível, nunca cortado, com clique tátil */}
                  <button
                    id={`btn-remove-slot-${i}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggle(p.id);
                    }}
                    className="absolute -top-1.5 -right-1.5 z-30 flex h-5 w-5 items-center justify-center rounded-full bg-love text-white shadow-md ring-2 ring-white transition-transform active:scale-90 hover:scale-110"
                    title={`Remover ${p.nickname}`}
                    aria-label={`Remover ${p.nickname} da equipe`}
                  >
                    <X size={11} strokeWidth={3} />
                  </button>
                </>
              ) : (
                <div className="flex h-full flex-col items-center justify-center gap-1 text-ink/30">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full border border-dashed border-ink/20 bg-ink/5">
                    <Plus size={18} />
                  </div>
                  <span className="text-[9px] font-extrabold">Slot {i + 1}</span>
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* 5. Ações da Equipe: Help Me Pick & Usar Esta Equipe */}
      <div className="mx-4 mt-3 flex items-center gap-2">
        <button
          id="btn-auto-pick"
          onClick={handleAutoPick}
          className="btn btn-ghost flex-1 py-2.5 text-xs font-bold !text-slate-800 border-2 border-slate-300 shadow-sm active:scale-95"
        >
          ✨ Auto-organizar
        </button>
        <button
          id="btn-use-team"
          onClick={handleSaveTeam}
          disabled={saving || !dirty}
          className={`btn flex-1 py-2.5 text-xs ${
            dirty ? 'btn-green animate-pulse' : 'btn-ghost opacity-60'
          }`}
        >
          {saving ? 'Salvando...' : 'Usar Esta Equipe'}
        </button>
      </div>

      {/* 6. Resumo dos Bônus Passivos Ativos */}
      <div className="mx-4 mt-3 rounded-2xl border border-sleep-yellow/50 bg-[#fff9e6] p-3 shadow-inner">
        <div className="flex items-center gap-1.5 text-xs font-black uppercase text-warm-orange-dark">
          <Zap size={14} /> Bônus Combinados da Equipe
        </div>
        {activeMembers.length === 0 ? (
          <p className="mt-1 text-[11px] font-bold text-ink/50">
            Escalar Pokémon na equipe concede bônus passivos para a próxima sessão de foco!
          </p>
        ) : (
          <div className="mt-2 grid grid-cols-1 gap-1.5">
            {activeMembers.map((p) => {
              const r = ROLE_INFO[p.role];
              return (
                <div key={p.id} className="flex items-center gap-2 rounded-xl bg-white/90 px-2.5 py-1.5 shadow-xs">
                  <span className="text-sm">{r?.emoji}</span>
                  <div className="min-w-0 flex-1">
                    <span className="text-[11px] font-black text-ink">{p.nickname}</span>
                    <span className="ml-1 text-[10px] font-bold text-ink/60">· {p.passiveBonusDescription}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 7. Pokémon Box (estilo exemplo.jpg Screen 3) */}
      <div className="mx-4 mt-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 rounded-full bg-love px-3 py-1 text-xs font-black uppercase text-white shadow-sm">
            <span>Pokémon Box</span>
            <span className="rounded-full bg-white/20 px-1.5 text-[10px]">
              {collection.length}/50
            </span>
          </div>

          <span className="text-[11px] font-bold text-ink/50">
            Clique para adicionar/remover
          </span>
        </div>

        {/* Filtros por papel de estudo */}
        <div className="no-scrollbar mt-2.5 flex gap-1.5 overflow-x-auto pb-1">
          <button
            onClick={() => { sfx.tap(); setBoxFilter('ALL'); }}
            className={`rounded-full px-3 py-1 text-[11px] font-black transition-all ${
              boxFilter === 'ALL'
                ? 'bg-leaf text-white shadow-sm'
                : 'bg-white text-ink/60 hover:bg-cream'
            }`}
          >
            Todos ({collection.length})
          </button>
          {(['SUBJECT_EXACT', 'SUBJECT_HUMAN', 'STAMINA', 'ITEMS', 'ENERGY'] as StudyRole[]).map((r) => {
            const count = collection.filter((p) => p.role === r).length;
            const info = ROLE_INFO[r];
            const active = boxFilter === r;
            return (
              <button
                key={r}
                onClick={() => { sfx.tap(); setBoxFilter(r); }}
                className={`flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-black transition-all ${
                  active ? 'bg-leaf text-white shadow-sm' : 'bg-white text-ink/60 hover:bg-cream'
                }`}
              >
                <span>{info.emoji}</span>
                <span>{info.label.split('&')[0].trim()} ({count})</span>
              </button>
            );
          })}
        </div>

        {/* Grid de Pokémon na Box */}
        {filteredBox.length === 0 ? (
          <div className="mt-3 rounded-2xl bg-white p-6 text-center text-xs font-bold text-ink/60 shadow-sm">
            Nenhum parceiro encontrado nesta categoria. Estude e alimente os Pokémon no Descanso para recrutá-los! 🍪
          </div>
        ) : (
          <div className="mt-3 grid grid-cols-4 gap-2">
            {filteredBox.map((p) => {
              const inTeam = selectedIds.includes(p.id);
              const r = ROLE_INFO[p.role];

              return (
                <motion.button
                  key={p.id}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => handleToggle(p.id)}
                  className={`relative flex flex-col items-center rounded-2xl border-2 bg-white p-1.5 shadow-sm transition-all ${
                    inTeam
                      ? 'border-leaf ring-2 ring-leaf/40'
                      : 'border-transparent hover:border-ink/20'
                  }`}
                >
                  <div className="relative aspect-square w-full">
                    <PokemonImage
                      pokemonId={p.pokemonId}
                      menu
                      variant={p.variant}
                      className="h-full w-full object-contain"
                    />
                    <Star
                      size={12}
                      className="absolute right-0 top-0"
                      fill="#ffcb05"
                      color="#d9a800"
                    />
                  </div>

                  <span className="mt-1 truncate text-[10px] font-black text-ink">
                    {p.nickname}
                  </span>

                  <div className="flex items-center gap-1 text-[9px] font-extrabold text-ink/50">
                    <span>{r.emoji}</span>
                    <span>Lv. {p.friendshipLevel}</span>
                  </div>

                  {inTeam && (
                    <span className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-leaf text-[8px] font-black text-white shadow">
                      ✓
                    </span>
                  )}
                </motion.button>
              );
            })}
          </div>
        )}
      </div>

      {/* 8. Modal de Stats Detalhados */}
      <AnimatePresence>
        {showStatsModal && showcased && (
          <motion.div
            className="absolute inset-0 z-50 flex items-center justify-center bg-black/50 p-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowStatsModal(false)}
          >
            <motion.div
              onClick={(e) => e.stopPropagation()}
              initial={{ scale: 0.85, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.85, opacity: 0 }}
              className="w-full max-w-xs rounded-3xl bg-white p-5 text-center shadow-2xl"
            >
              <div className="mx-auto h-24 w-24">
                <PokemonImage
                  pokemonId={showcased.pokemonId}
                  variant={showcased.variant}
                  className="h-full w-full object-contain drop-shadow"
                />
              </div>

              {/* Nome & Edição de Nickname */}
              {editingNickname ? (
                <div className="mt-2 flex items-center justify-center gap-1.5">
                  <input
                    type="text"
                    maxLength={18}
                    value={nicknameInput}
                    onChange={(e) => setNicknameInput(e.target.value)}
                    className="w-36 rounded-xl border-2 border-emerald-400 bg-white px-2 py-1 text-center text-sm font-black text-ink shadow-xs focus:outline-none"
                    autoFocus
                  />
                  <button
                    onClick={async () => {
                      if (!nicknameInput.trim()) return;
                      try {
                        await renamePokemon(showcased.id, nicknameInput.trim());
                        setEditingNickname(false);
                      } catch (e) {
                        toast((e as Error).message, 'error');
                      }
                    }}
                    className="rounded-xl bg-emerald-500 p-1.5 text-white shadow-xs hover:bg-emerald-600 active:scale-95"
                  >
                    <Check size={16} />
                  </button>
                  <button
                    onClick={() => setEditingNickname(false)}
                    className="rounded-xl bg-slate-200 p-1.5 text-slate-700 shadow-xs hover:bg-slate-300 active:scale-95"
                  >
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <div className="mt-2 flex items-center justify-center gap-1.5">
                  <h3 className="text-xl font-black text-ink">{showcased.nickname}</h3>
                  <button
                    title="Mudar nome do Pokémon"
                    onClick={() => {
                      setNicknameInput(showcased.nickname);
                      setEditingNickname(true);
                    }}
                    className="rounded-lg p-1 text-ink/40 hover:bg-slate-100 hover:text-ink/80 transition-colors"
                  >
                    <Edit3 size={15} />
                  </button>
                </div>
              )}

              <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-ink/60">
                <span>{ROLE_INFO[showcased.role]?.emoji} {ROLE_INFO[showcased.role]?.label}</span>
                <span>·</span>
                <span className="text-leaf-dark font-black">Nível {showcased.friendshipLevel}</span>
              </div>

              <div className="mt-4 rounded-2xl bg-cream p-3 text-left">
                <div className="text-[10px] font-black uppercase text-ink/50">Habilidade Passiva</div>
                <div className="text-xs font-black text-warm-orange-dark">
                  {showcased.passiveBonusDescription}
                </div>
              </div>

              <div className="mt-3 flex items-center justify-between rounded-xl bg-leaf/10 px-3 py-2 text-xs font-black text-leaf-dark">
                <span className="flex items-center gap-1"><Heart size={14} fill="currentColor" /> Amizade</span>
                <span>{showcased.friendshipLevel} / 5</span>
              </div>

              {/* Card de Evolução */}
              {(() => {
                const evoOption = getEvolutionOption(showcased.pokemonId);
                if (!evoOption) return null;
                const canEvolve = showcased.friendshipLevel >= evoOption.requiredFriendshipLevel;
                return (
                  <div className="mt-3 rounded-2xl border-2 border-amber-300/80 bg-gradient-to-r from-amber-50 to-orange-50 p-3 text-center shadow-xs">
                    <div className="text-[10px] font-black uppercase text-amber-800 flex items-center justify-center gap-1">
                      <Sparkles size={12} className="text-amber-500 fill-amber-500" />
                      <span>Linha Evolutiva</span>
                    </div>
                    <div className="text-xs font-bold text-amber-950 mt-1">
                      Evolui para: <strong className="text-amber-600">{evoOption.evolvedName}</strong>
                    </div>
                    {canEvolve ? (
                      <button
                        disabled={evolving}
                        onClick={async () => {
                          setEvolving(true);
                          try {
                            sfx.bell();
                            confetti({ particleCount: 160, spread: 80, origin: { y: 0.5 } });
                            await evolvePokemon(showcased.id);
                          } catch (e) {
                            toast((e as Error).message, 'error');
                          } finally {
                            setEvolving(false);
                          }
                        }}
                        className="btn mt-2.5 w-full bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-white font-black text-xs py-2 shadow-md hover:brightness-105 active:scale-95 flex items-center justify-center gap-1.5 animate-pulse"
                      >
                        <Sparkles size={14} />
                        <span>{evolving ? 'Evoluindo...' : `Evoluir para ${evoOption.evolvedName}! ✨`}</span>
                      </button>
                    ) : (
                      <div className="mt-2 rounded-xl bg-white/70 px-2 py-1 text-[11px] font-bold text-amber-800">
                        Requer Amizade Nível {evoOption.requiredFriendshipLevel} para evoluir
                      </div>
                    )}
                  </div>
                );
              })()}

              <button
                onClick={() => { sfx.tap(); setEditingNickname(false); setShowStatsModal(false); }}
                className="btn btn-green mt-4 w-full py-2.5 text-xs"
              >
                Entendido
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

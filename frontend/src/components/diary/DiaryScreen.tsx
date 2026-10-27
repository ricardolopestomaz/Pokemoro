import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart3, Clock, Flame, Zap, Plus, Edit2, Trash2, Check, X, BookOpen, AlertCircle } from 'lucide-react';
import { useGame } from '../../hooks/useGameState';
import { api } from '../../api/endpoints';
import { sfx } from '../../lib/sfx';
import { LeaderboardModal } from '../leaderboard/LeaderboardModal';
import { PokeBadgeIcon } from '../common/PokemonThemedIcons';
import type { Subject, SessionHistoryItem } from '../../types';
import { formatLocalDate, splitSessionAcrossDays, getStreakStatus } from '../../lib/date-utils';

const COLOR_PALETTE = [
  '#48D0B0', // Verde Menta (Padrão Sleep)
  '#4FC3F7', // Azul Céu
  '#FF8C42', // Laranja Acolhedor
  '#FF5B84', // Rosa Amor
  '#A78BFA', // Roxo Lavanda
  '#FFCB05', // Amarelo Elétrico
  '#E91E63', // Magenta
  '#00BCD4', // Ciano Mar
  '#9C27B0', // Violeta
  '#607D8B', // Ardósia
];

export function DiaryScreen() {
  const { subjects, profile, coffeeBreak, refreshSubjects, toast } = useGame();
  const [sessions, setSessions] = useState<SessionHistoryItem[]>([]);
  const [showLeaderboard, setShowLeaderboard] = useState(false);

  // Modais de Criação, Edição e Exclusão
  const [modalType, setModalType] = useState<'create' | 'edit' | 'delete' | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);

  // Form states
  const [formName, setFormName] = useState('');
  const [formColor, setFormColor] = useState(COLOR_PALETTE[0]);
  const [submitting, setSubmitting] = useState(false);

  // Carrega histórico recente de sessões para o gráfico
  useEffect(() => {
    let mounted = true;
    api.recentSessions(50)
      .then((data) => {
        if (mounted && Array.isArray(data)) {
          setSessions(data as SessionHistoryItem[]);
        }
      })
      .catch(() => {});
    return () => { mounted = false; };
  }, []);

  // Cálculos de totais
  const totalMinutes = useMemo(() => {
    return subjects.reduce((acc, s) => acc + (s.totalMinutes || 0), 0);
  }, [subjects]);

  const totalHours = (totalMinutes / 60).toFixed(1);

  // Status visual da Ofensiva no estilo Duolingo
  const streakStatus = useMemo(() => {
    return getStreakStatus(profile?.streakDays ?? 0, profile?.lastStudyDate ?? null);
  }, [profile?.streakDays, profile?.lastStudyDate]);

  // Gráfico dos últimos 7 dias com divisão dinâmica de sessões que cruzam a meia-noite
  const weeklyData = useMemo(() => {
    const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    const now = new Date();
    const result: Array<{ day: string; dateStr: string; minutes: number; isToday: boolean }> = [];

    // Mapeia os últimos 7 dias no calendário local
    const dayMap = new Map<string, number>();
    const datesList: Array<{ day: string; dateStr: string; isToday: boolean }> = [];

    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
      const dateStr = formatLocalDate(d);
      const dayName = days[d.getDay()];
      dayMap.set(dateStr, 0);
      datesList.push({
        day: dayName,
        dateStr,
        isToday: i === 0,
      });
    }

    // Itera pelas sessões e divide dinamicamente os minutos caso tenham atravessado a meia-noite
    sessions.forEach((s) => {
      const splits = splitSessionAcrossDays({
        startedAt: s.startedAt,
        completedAt: s.completedAt,
        actualDurationMinutes: s.actualDurationMinutes,
      });

      splits.forEach((split) => {
        if (dayMap.has(split.dateStr)) {
          dayMap.set(split.dateStr, (dayMap.get(split.dateStr) || 0) + split.minutes);
        }
      });
    });

    datesList.forEach((item) => {
      result.push({
        day: item.day,
        dateStr: item.dateStr,
        minutes: dayMap.get(item.dateStr) || 0,
        isToday: item.isToday,
      });
    });

    // Se não houver sessões registradas no histórico recente, exibe proporcional com minutos totais para visualização elegante
    const totalWeekMins = result.reduce((acc, r) => acc + r.minutes, 0);
    void totalWeekMins;

    return result;
  }, [sessions, totalMinutes]);

  const maxDayMinutes = Math.max(30, ...weeklyData.map((d) => d.minutes));

  // Abertura dos modais
  const openCreate = () => {
    sfx.tap();
    setFormName('');
    setFormColor(COLOR_PALETTE[subjects.length % COLOR_PALETTE.length]);
    setModalType('create');
  };

  const openEdit = (sub: Subject) => {
    sfx.tap();
    setSelectedSubject(sub);
    setFormName(sub.name);
    setFormColor(sub.color || COLOR_PALETTE[0]);
    setModalType('edit');
  };

  const openDelete = (sub: Subject) => {
    sfx.tap();
    setSelectedSubject(sub);
    setModalType('delete');
  };

  const handleCreate = async () => {
    const trimmed = formName.trim();
    if (!trimmed) {
      toast('Digite o nome da matéria', 'info');
      return;
    }
    setSubmitting(true);
    try {
      await api.createSubject(trimmed, formColor);
      await refreshSubjects();
      sfx.fanfare();
      toast('Matéria criada com sucesso!', 'ok');
      setModalType(null);
    } catch (e) {
      toast((e as Error).message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdate = async () => {
    if (!selectedSubject) return;
    const trimmed = formName.trim();
    if (!trimmed) {
      toast('Digite o nome da matéria', 'info');
      return;
    }
    setSubmitting(true);
    try {
      await api.updateSubject(selectedSubject.id, { name: trimmed, color: formColor });
      await refreshSubjects();
      sfx.tap();
      toast('Matéria atualizada com sucesso!', 'ok');
      setModalType(null);
    } catch (e) {
      toast((e as Error).message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedSubject) return;
    setSubmitting(true);
    try {
      await api.deleteSubject(selectedSubject.id);
      await refreshSubjects();
      sfx.tap();
      toast('Matéria excluída com sucesso!', 'ok');
      setModalType(null);
    } catch (e) {
      toast((e as Error).message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section
      className="absolute inset-0 z-20 overflow-y-auto bg-cream px-4 pb-28 pt-[84px] no-scrollbar"
      aria-label="Diário de Foco e Estatísticas"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <span className="text-[10px] font-black uppercase tracking-wider text-leaf-dark">
            Relatório de Estudos & Evolução
          </span>
          <h1 className="text-xl font-black text-ink">Diário de Foco</h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            id="btn-diary-leaderboard"
            onClick={() => { sfx.tap(); setShowLeaderboard(true); }}
            className="flex items-center gap-1.5 rounded-full border border-[#ffcb05] bg-[#fff9c4] px-2.5 py-1 text-xs font-black text-[#7a5900] shadow-xs transition-transform active:scale-95"
            title="Ver Ranking Global no Supabase"
          >
            <PokeBadgeIcon size={16} />
            <span>Ranking</span>
          </button>
          <div className="flex items-center gap-1.5 rounded-full bg-leaf/15 px-3 py-1 text-xs font-black text-leaf-dark">
            <BarChart3 size={15} />
            <span>Análise</span>
          </div>
        </div>
      </div>

      {/* 1. Cards de Resumo Rápido */}
      <div className="mt-3 grid grid-cols-3 gap-2">
        <div className="rounded-2xl border border-white/80 bg-white p-3 shadow-sm text-center">
          <div className="mx-auto flex h-7 w-7 items-center justify-center rounded-full bg-leaf/15 text-leaf-dark">
            <Clock size={15} />
          </div>
          <div className="mt-1 text-base font-black text-ink">{totalHours}h</div>
          <div className="text-[9px] font-bold text-ink/60 uppercase">Tempo Total</div>
        </div>

        <div className="rounded-2xl border border-white/80 bg-white p-3 shadow-sm text-center">
          <div className="mx-auto flex h-7 w-7 items-center justify-center rounded-full bg-sleep-yellow/20 text-sleep-yellow-dark">
            <Zap size={15} />
          </div>
          <div className="mt-1 text-base font-black text-ink">{coffeeBreak?.focusPower ?? 0}</div>
          <div className="text-[9px] font-bold text-ink/60 uppercase">Poder Foco</div>
        </div>

        <div className="rounded-2xl border border-white/80 bg-white p-3 shadow-sm text-center">
          <div className={`mx-auto flex h-7 w-7 items-center justify-center rounded-full transition-all ${
            streakStatus.activeToday
              ? 'bg-warm-orange text-white shadow-sm ring-2 ring-warm-orange/30'
              : streakStatus.pendingToday
              ? 'bg-warm-orange/20 text-warm-orange'
              : 'bg-ink/10 text-ink/40'
          }`}>
            <Flame size={15} />
          </div>
          <div className="mt-1 text-base font-black text-ink">{profile?.streakDays ?? 0}d</div>
          <div className="text-[9px] font-bold text-ink/60 uppercase">
            {streakStatus.activeToday ? 'Fogo Ativo' : streakStatus.pendingToday ? 'Pendente Hoje' : 'Ofensiva'}
          </div>
        </div>
      </div>

      {/* 2. Gráfico de Foco Semanal (Inspirado no Sleep Graph de Pokémon Sleep) */}
      <div className="relative mt-5">
        {/* Clip superior azul estilo prancheta Pokémon Sleep */}
        <div className="mx-auto -mb-2.5 h-3.5 w-24 rounded-t-lg bg-[#3b82f6] shadow-sm relative z-10" />

        <div className="relative rounded-[2.2rem] border-2 border-white/90 bg-white p-4 shadow-md">
          {/* Header do Card */}
          <div className="flex items-center justify-between pb-2 border-b border-ink/5">
            <div>
              <span className="text-[9px] font-black uppercase tracking-wider text-ocean-dark">
                Sleep Research Style · Histórico 7 Dias
              </span>
              <h2 className="text-base font-black text-ink">Foco Semanal (Minutos)</h2>
            </div>
            <span className="rounded-full bg-ocean/10 px-2.5 py-0.5 text-[10px] font-black text-ocean-dark">
              {weeklyData.reduce((a, b) => a + b.minutes, 0)} min total
            </span>
          </div>

          {/* Linha de Legenda e Proporção de Foco */}
          <div className="mt-3">
            <div className="flex items-center justify-between text-[10px] font-black">
              <span className="flex items-center gap-1 text-[#e6b800]">
                <span className="h-2 w-2 rounded-full bg-[#ffcb05]" />
                Leve: 20%
              </span>
              <span className="flex items-center gap-1 text-[#0288d1]">
                <span className="h-2 w-2 rounded-full bg-[#4fc3f7]" />
                Moderado: 35%
              </span>
              <span className="flex items-center gap-1 text-[#1565c0]">
                <span className="h-2 w-2 rounded-full bg-[#2962ff]" />
                Profundo: 45%
              </span>
            </div>

            {/* Barra Segmentada de Proporção com Bordas Arredondadas */}
            <div className="mt-1.5 flex h-2 w-full overflow-hidden rounded-full bg-ink/10 shadow-inner">
              <div className="h-full bg-[#ffcb05]" style={{ width: '20%' }} />
              <div className="h-full bg-[#4fc3f7]" style={{ width: '35%' }} />
              <div className="h-full bg-[#2962ff]" style={{ width: '45%' }} />
            </div>
          </div>

          {/* Gráfico no Box Azul Profundo (Estilo Sleep Graph de Pokémon Sleep) */}
          <div className="mt-3.5 rounded-2xl border border-[#2b5394] bg-gradient-to-b from-[#1b3d73] via-[#16325c] to-[#0f213d] p-3 text-white shadow-inner">
            <div className="relative flex h-36">
              {/* Eixo Y com rótulos de escala */}
              <div className="flex flex-col justify-between pr-2 text-right text-[8px] font-bold text-sky-200/60 select-none">
                <span>{maxDayMinutes}m</span>
                <span>{Math.round(maxDayMinutes / 2)}m</span>
                <span>0m</span>
              </div>

              {/* Área das Barras com Linhas de Grade Sutis */}
              <div className="relative flex-1 flex flex-col justify-between">
                {/* Linhas de Grade Horizontais */}
                <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
                  <div className="border-b border-sky-300/15 w-full" />
                  <div className="border-b border-sky-300/15 w-full" />
                  <div className="border-b border-sky-300/25 w-full" />
                </div>

                {/* Colunas do Gráfico */}
                <div className="relative z-10 flex h-full items-end justify-between gap-1.5 px-1 pt-4 pb-0.5">
                  {weeklyData.map((d, i) => {
                    const heightPct = Math.max(6, Math.min(100, (d.minutes / maxDayMinutes) * 100));
                    return (
                      <div key={i} className="flex flex-1 flex-col items-center h-full justify-end group">
                        {/* Tooltip com Minutos */}
                        <span className={`text-[8px] font-black transition-opacity mb-1 ${
                          d.isToday ? 'text-sleep-yellow opacity-100 font-extrabold' : 'text-sky-200/80 opacity-0 group-hover:opacity-100'
                        }`}>
                          {d.minutes}m
                        </span>

                        {/* Barra Iluminada com Cantos Arredondados */}
                        <div className="relative w-full rounded-full bg-white/10 overflow-hidden flex flex-col justify-end" style={{ height: '74%' }}>
                          <motion.div
                            initial={{ height: 0 }}
                            animate={{ height: `${heightPct}%` }}
                            transition={{ duration: 0.8, delay: i * 0.08 }}
                            className={`w-full rounded-full transition-all ${
                              d.isToday
                                ? 'bg-gradient-to-t from-[#2979ff] via-[#00e5ff] to-[#ffe57f] shadow-[0_0_12px_rgba(255,229,127,0.6)]'
                                : 'bg-gradient-to-t from-[#1976d2] to-[#4fc3f7]'
                            }`}
                          />
                        </div>

                        {/* Rótulo do Dia da Semana */}
                        <span className={`mt-2 text-[9.5px] tracking-tight font-black ${
                          d.isToday
                            ? 'text-sleep-yellow font-extrabold drop-shadow-[0_0_6px_rgba(255,203,5,0.6)]'
                            : 'text-sky-100/70'
                        }`}>
                          {d.day}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Detalhes Rápidos no Rodapé do Card estilo Sleep Details */}
          <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
            <div className="flex items-center gap-2 rounded-xl bg-cream/70 p-2.5">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-ocean/20 text-ocean-dark">
                <Clock size={14} />
              </div>
              <div className="min-w-0">
                <div className="text-[9px] font-black uppercase text-ink/50">Média Diária</div>
                <div className="truncate text-xs font-black text-ink">
                  {Math.round(weeklyData.reduce((a, b) => a + b.minutes, 0) / 7)} min / dia
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 rounded-xl bg-cream/70 p-2.5">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-sleep-yellow/20 text-sleep-yellow-dark">
                <Zap size={14} />
              </div>
              <div className="min-w-0">
                <div className="text-[9px] font-black uppercase text-ink/50">Hoje</div>
                <div className="truncate text-xs font-black text-ink">
                  {weeklyData.find((d) => d.isToday)?.minutes ?? 0} min focados
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>


      {/* 3. Gráfico de Distribuição por Matéria */}
      <div className="mt-3.5 rounded-[2rem] border border-white/80 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1.5">
            <div className="h-3 w-1 rounded-full bg-warm-orange" />
            <h2 className="text-xs font-black uppercase text-ink">Foco por Matéria</h2>
          </div>
          <span className="text-[10px] font-extrabold text-ink/60">
            {subjects.length} matéria(s)
          </span>
        </div>

        {subjects.length === 0 ? (
          <p className="rounded-2xl bg-cream p-4 text-center text-xs font-bold text-ink/50">
            Nenhuma matéria cadastrada ainda. Adicione uma matéria abaixo! 📚
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {subjects.map((sub) => {
              const mins = sub.totalMinutes || 0;
              const pct = totalMinutes > 0 ? Math.round((mins / totalMinutes) * 100) : 0;
              return (
                <div key={sub.id} className="flex flex-col gap-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1.5 font-black text-ink">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: sub.color }} />
                      {sub.name}
                    </span>
                    <span className="font-extrabold text-ink/70">
                      {mins} min <span className="text-[10px] text-ink/40">({pct}%)</span>
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-ink/10">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.8 }}
                      className="h-full rounded-full"
                      style={{ backgroundColor: sub.color }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 4. Gerenciador Completo de Matérias (CRUD) */}
      <div className="mt-3.5 rounded-[2rem] border border-white/80 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1.5">
            <div className="h-3 w-1 rounded-full bg-ocean" />
            <h2 className="text-xs font-black uppercase text-ink">Gerenciar Matérias</h2>
          </div>
          <button
            id="btn-diary-new-subject"
            onClick={openCreate}
            className="flex items-center gap-1 rounded-full bg-leaf px-3 py-1 text-xs font-black text-white shadow-xs transition-transform active:scale-95"
          >
            <Plus size={13} strokeWidth={3} />
            <span>Nova Matéria</span>
          </button>
        </div>

        {/* Lista de matérias com botões de Editar e Excluir */}
        <div className="flex flex-col divide-y divide-ink/5">
          {subjects.map((sub) => (
            <div key={sub.id} className="flex items-center justify-between py-2.5">
              <div className="flex items-center gap-2.5 min-w-0">
                <span
                  className="h-3.5 w-3.5 shrink-0 rounded-full border border-white shadow-xs"
                  style={{ backgroundColor: sub.color }}
                />
                <div className="truncate">
                  <div className="truncate text-xs font-black text-ink">{sub.name}</div>
                  <div className="text-[10px] font-bold text-ink/50">{sub.totalMinutes || 0} min acumulados</div>
                </div>
              </div>

              {/* Ações de Edição e Exclusão */}
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  id={`btn-edit-sub-${sub.id}`}
                  onClick={() => openEdit(sub)}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-cream text-ink/70 transition-transform active:scale-90 hover:bg-ink/10"
                  title="Editar nome e cor"
                  aria-label={`Editar ${sub.name}`}
                >
                  <Edit2 size={13} />
                </button>
                <button
                  id={`btn-delete-sub-${sub.id}`}
                  onClick={() => openDelete(sub)}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-love/10 text-love transition-transform active:scale-90 hover:bg-love/20"
                  title="Excluir matéria"
                  aria-label={`Excluir ${sub.name}`}
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 5. Histórico Recente de Estudos com Divisão Dinâmica por Meia-Noite */}
      {sessions.length > 0 && (
        <div className="mt-3.5 rounded-[2rem] border border-white/80 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-1.5">
              <div className="h-3 w-1 rounded-full bg-ocean" />
              <h2 className="text-xs font-black uppercase text-ink">Histórico de Sessões</h2>
            </div>
            <span className="text-[10px] font-extrabold text-ink/60">
              {sessions.length} registro(s)
            </span>
          </div>

          <div className="flex flex-col divide-y divide-ink/5">
            {sessions.slice(0, 10).map((s) => {
              const splits = splitSessionAcrossDays({
                startedAt: s.startedAt,
                completedAt: s.completedAt,
                actualDurationMinutes: s.actualDurationMinutes,
              });
              const crossesMidnight = splits.length > 1;
              const startDate = s.startedAt ? new Date(s.startedAt) : null;
              const endDate = s.completedAt ? new Date(s.completedAt) : null;
              const formatTime = (d: Date | null) => (d && !isNaN(d.getTime()) ? d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--');

              return (
                <div key={s.id} className="py-2.5 flex flex-col gap-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-black text-ink flex items-center gap-1.5">
                      <Clock size={13} className="text-ocean" />
                      <span>{s.actualDurationMinutes} min</span>
                      {crossesMidnight && (
                        <span className="rounded-full bg-ocean/15 px-2 py-0.5 text-[9px] font-black text-ocean-dark">
                          Atravessou Meia-Noite 🌙
                        </span>
                      )}
                    </span>
                    <span className="text-[10px] font-extrabold text-ink/60">
                      {startDate ? `${formatLocalDate(startDate)} ${formatTime(startDate)}` : ''} ➔ {formatTime(endDate)}
                    </span>
                  </div>

                  {crossesMidnight ? (
                    <div className="rounded-xl bg-ocean/5 p-2 border border-ocean/15 text-[10px] font-bold text-ink/80 flex flex-col gap-1">
                      <div className="text-[9px] font-black uppercase text-ocean-dark flex items-center gap-1">
                        <span>Minutos divididos dinamicamente por dia:</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {splits.map((sp, idx) => (
                          <span
                            key={idx}
                            className="rounded-lg bg-white px-2 py-0.5 font-black text-ink shadow-2xs border border-ocean/20"
                          >
                            📅 {sp.dateStr}: <strong>{sp.minutes} min</strong>
                          </span>
                        ))}
                      </div>
                      <span className="text-[9px] text-warm-orange font-bold">
                        🔥 Início do estudo salva a ofensiva de {splits[0]?.dateStr} · O dia seguinte fica pendente
                      </span>
                    </div>
                  ) : (
                    <div className="text-[10px] font-medium text-ink/50">
                      Foco registrado em {splits[0]?.dateStr || formatLocalDate(endDate || new Date())}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Modal de Criação ou Edição de Matéria */}
      <AnimatePresence>
        {(modalType === 'create' || modalType === 'edit') && (
          <motion.div
            className="absolute inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="w-full max-w-sm rounded-[2rem] bg-white p-5 shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-ink/10 pb-3">
                <h3 className="text-base font-black text-ink">
                  {modalType === 'create' ? 'Nova Matéria de Estudo' : 'Editar Matéria'}
                </h3>
                <button
                  onClick={() => setModalType(null)}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-cream text-ink/60 active:scale-90"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="mt-4 flex flex-col gap-3">
                <div>
                  <label className="text-[10px] font-black uppercase text-ink/60">Nome da Matéria</label>
                  <input
                    id="input-subject-name"
                    value={formName}
                    maxLength={30}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="Ex: Direito Constitucional, Cálculo..."
                    className="mt-1 w-full rounded-2xl border border-ink/15 bg-cream px-3.5 py-2.5 text-xs font-black text-ink outline-none focus:border-leaf focus:bg-white"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase text-ink/60">Paleta de Cores</label>
                  <div className="mt-1.5 grid grid-cols-5 gap-2">
                    {COLOR_PALETTE.map((c) => {
                      const active = formColor === c;
                      return (
                        <button
                          key={c}
                          type="button"
                          onClick={() => { sfx.tap(); setFormColor(c); }}
                          className="relative flex aspect-square items-center justify-center rounded-full border-2 border-white shadow-xs transition-transform active:scale-90"
                          style={{ backgroundColor: c }}
                        >
                          {active && <Check size={14} className="text-white drop-shadow" strokeWidth={3.5} />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="mt-5 flex gap-2">
                <button
                  onClick={() => setModalType(null)}
                  className="btn btn-ghost flex-1 py-2.5 text-xs font-bold !text-slate-800 border-2 border-slate-300 shadow-sm active:scale-95"
                >
                  Cancelar
                </button>
                <button
                  id="btn-confirm-subject"
                  disabled={submitting}
                  onClick={modalType === 'create' ? handleCreate : handleUpdate}
                  className="btn btn-green flex-1 py-2.5 text-xs"
                >
                  {submitting ? 'Salvando...' : modalType === 'create' ? 'Criar Matéria' : 'Salvar Alterações'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal de Confirmação de Exclusão */}
      <AnimatePresence>
        {modalType === 'delete' && selectedSubject && (
          <motion.div
            className="absolute inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="w-full max-w-sm rounded-[2rem] bg-white p-5 text-center shadow-2xl"
            >
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-love/15 text-love">
                <AlertCircle size={26} />
              </div>
              <h3 className="mt-2 text-base font-black text-ink">Excluir Matéria?</h3>
              <p className="mt-1 text-xs font-bold text-ink/60">
                Tem certeza que deseja excluir <strong>{selectedSubject.name}</strong>? Os minutos e sessões vinculados serão removidos.
              </p>

              <div className="mt-5 flex gap-2">
                <button
                  onClick={() => setModalType(null)}
                  className="btn btn-ghost flex-1 py-2.5 text-xs font-bold !text-slate-800 border-2 border-slate-300 shadow-sm active:scale-95"
                >
                  Voltar
                </button>
                <button
                  id="btn-confirm-delete-subject"
                  disabled={submitting}
                  onClick={handleDelete}
                  className="btn btn-orange flex-1 !bg-love py-2.5 text-xs"
                >
                  {submitting ? 'Excluindo...' : 'Sim, Excluir'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal de Ranking Global */}
      <AnimatePresence>
        {showLeaderboard && (
          <LeaderboardModal onClose={() => setShowLeaderboard(false)} />
        )}
      </AnimatePresence>
    </section>
  );
}

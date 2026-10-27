import { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Sparkles, Check, Flame, Trophy, Coins, Award, Edit3, Move, Radio, Heart, ArrowRight } from 'lucide-react';
import { sfx } from '../../lib/sfx';

export const STORAGE_KEY_NEVER_SHOW = 'pokemoro_patch_notes_never_show_v1_1';
export const SESSION_KEY_CLOSED = 'pokemoro_patch_notes_session_closed';

export function shouldShowProfessorPatchNotes(): boolean {
  try {
    if (typeof window === 'undefined') return false;
    const neverShow = localStorage.getItem(STORAGE_KEY_NEVER_SHOW);
    if (neverShow === 'true') return false;
    const sessionClosed = sessionStorage.getItem(SESSION_KEY_CLOSED);
    if (sessionClosed === 'true') return false;
    return true;
  } catch {
    return false;
  }
}

interface Props {
  onClose: () => void;
}

export function ProfessorPatchNotesModal({ onClose }: Props) {
  const [neverShow, setNeverShow] = useState(false);
  const [imgSrc, setImgSrc] = useState('/assets/Professor-Ricardo.png');

  const handleDismiss = (forceNeverShow = false) => {
    sfx.tap();
    try {
      if (forceNeverShow || neverShow) {
        localStorage.setItem(STORAGE_KEY_NEVER_SHOW, 'true');
      } else {
        sessionStorage.setItem(SESSION_KEY_CLOSED, 'true');
      }
    } catch {}
    onClose();
  };

  const handlePrimaryConfirm = () => {
    sfx.fanfare();
    try {
      if (neverShow) {
        localStorage.setItem(STORAGE_KEY_NEVER_SHOW, 'true');
      } else {
        sessionStorage.setItem(SESSION_KEY_CLOSED, 'true');
      }
    } catch {}
    onClose();
  };

  return (
    <motion.div
      className="absolute inset-0 z-[80] flex items-center justify-center bg-black/65 backdrop-blur-xs p-3.5"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={() => handleDismiss(neverShow)}
    >
      <motion.div
        className="relative flex w-full max-w-sm max-h-[90vh] flex-col overflow-hidden rounded-3xl bg-cream border-2 border-leaf/40 shadow-2xl"
        initial={{ scale: 0.9, y: 25, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.9, y: 20, opacity: 0 }}
        transition={{ type: 'spring', damping: 22, stiffness: 260 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Topo Estilizado com Professor Ricardo */}
        <div className="relative bg-gradient-to-b from-leaf/30 via-leaf/15 to-transparent px-4 pt-4 pb-2 border-b border-ink/5">
          {/* Botão de Fechar (X) */}
          <button
            type="button"
            onClick={() => handleDismiss(neverShow)}
            className="absolute top-3 right-3 z-20 flex h-8 w-8 items-center justify-center rounded-full bg-white/80 text-ink/70 hover:bg-white hover:text-ink shadow-sm transition-transform active:scale-95"
            aria-label="Fechar informativo"
          >
            <X size={18} />
          </button>

          <div className="flex items-center gap-3">
            {/* Imagem do Professor Ricardo com animação de flutuação */}
            <div className="relative flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white/90 p-1 border border-leaf/30 shadow-sm overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-tr from-emerald-100/60 to-transparent" />
              <motion.img
                src={imgSrc}
                alt="Professor Ricardo"
                onError={() => {
                  setImgSrc('/favicon.png');
                }}
                animate={{ y: [0, -3, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                className="relative z-10 h-full w-full object-contain drop-shadow-sm"
              />
            </div>

            <div className="flex-1 min-w-0 pr-6">
              <span className="inline-flex items-center gap-1 rounded-full bg-leaf px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-white shadow-2xs">
                <Sparkles size={10} /> Professor Ricardo 🔬
              </span>
              <h2 className="text-base font-black text-ink leading-tight mt-1">
                Boletim de Novidades!
              </h2>
              <p className="text-[10px] font-bold text-ink/60 leading-tight">
                Confira as atualizações implementadas no laboratório hoje!
              </p>
            </div>
          </div>
        </div>

        {/* Mensagem introdutória do Professor */}
        <div className="px-4 py-2.5 bg-leaf/10 border-b border-leaf/15 flex items-start gap-2">
          <span className="text-sm select-none">📢</span>
          <p className="text-[11px] font-semibold text-ink/80 leading-snug">
            <em>"Atenção, Treinador! Nossos estudos de campo avançaram. Preparei um resumo de tudo o que chegou de novo para elevar seu foco ao nível de um Mestre Pokémon!"</em>
          </p>
        </div>

        {/* Lista Rolável de Novidades do Dia */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2.5 no-scrollbar max-h-[46vh]">
          {/* 1. Novas Medalhas de Contest */}
          <div className="flex items-start gap-2.5 rounded-2xl bg-white p-2.5 border border-amber-200/60 shadow-2xs">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-50 border border-amber-200">
              <img
                src="/medals/rank_1.png"
                alt="Medalha Tough"
                onError={(e) => {
                  e.currentTarget.src = 'https://i0.wp.com/www.serebii.net/games/ribbons/toughcontestmasterrankribbon-s.png?w=640&ssl=1';
                }}
                className="h-7 w-7 object-contain drop-shadow-xs"
              />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <Trophy size={12} className="text-amber-500" />
                <h3 className="text-xs font-black text-ink">Novas Medalhas do Ranking</h3>
              </div>
              <p className="text-[10px] text-ink/70 leading-relaxed mt-0.5">
                O Hall da Fama agora conta com os <strong>Ribbons Oficiais de Contest Pokémon</strong> (Tough, Smart e Cool) com transparência pura e sem fundos pesados!
              </p>
            </div>
          </div>

          {/* 2. Nova Moeda Oficial */}
          <div className="flex items-start gap-2.5 rounded-2xl bg-white p-2.5 border border-emerald-200/60 shadow-2xs">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50 border border-emerald-200">
              <img
                src="/coins/focus_coin.png"
                alt="Focus Coin"
                onError={(e) => {
                  e.currentTarget.src = 'https://i0.wp.com/www.serebii.net/emerald/badge05-g.png?resize=16%2C16&ssl=1';
                }}
                className="h-6.5 w-6.5 object-contain drop-shadow-xs"
              />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <Coins size={12} className="text-emerald-600" />
                <h3 className="text-xs font-black text-ink">Nova Moeda do Foco</h3>
              </div>
              <p className="text-[10px] text-ink/70 leading-relaxed mt-0.5">
                A moeda oficial foi repaginada para o ícone clássico da <strong>Emerald Badge 05</strong> no HUD, na Loja de Biscoitos e nas recompensas Pomodoro!
              </p>
            </div>
          </div>

          {/* 3. Insígnias Oficiais de Kanto */}
          <div className="flex items-start gap-2.5 rounded-2xl bg-white p-2.5 border border-purple-200/60 shadow-2xs">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-purple-50 border border-purple-200">
              <img
                src="/badges/04.gif"
                alt="Insígnia de Ginásio"
                onError={(e) => {
                  e.currentTarget.src = 'https://www.serebii.net/badges/04.gif';
                }}
                className="h-6 w-6 object-contain"
              />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <Award size={12} className="text-purple-600" />
                <h3 className="text-xs font-black text-ink">Insígnias Oficiais de Ginásio</h3>
              </div>
              <p className="text-[10px] text-ink/70 leading-relaxed mt-0.5">
                A cada <strong>10 dias de ofensiva</strong> você ganha uma insígnia oficial de Kanto! Elas persistem no Supabase e aparecem no Ranking (somente para quem conquistou ao menos 1).
              </p>
            </div>
          </div>

          {/* 4. Renomear Pokémon */}
          <div className="flex items-start gap-2.5 rounded-2xl bg-white p-2.5 border border-blue-200/60 shadow-2xs">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 border border-blue-200 text-blue-600">
              <Edit3 size={18} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <h3 className="text-xs font-black text-ink">Renomeie seus Pokémon</h3>
              </div>
              <p className="text-[10px] text-ink/70 leading-relaxed mt-0.5">
                Personalize seus parceiros! Você pode dar apelidos carinhosos para qualquer Pokémon que capturou através da tela de Equipe.
              </p>
            </div>
          </div>

          {/* 5. Menus Modulares e Arrastáveis */}
          <div className="flex items-start gap-2.5 rounded-2xl bg-white p-2.5 border border-amber-200/60 shadow-2xs">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-50 border border-amber-200 text-amber-700">
              <Move size={18} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <Radio size={12} className="text-amber-700" />
                <h3 className="text-xs font-black text-ink">Menus Arrastáveis & Lo-Fi</h3>
              </div>
              <p className="text-[10px] text-ink/70 leading-relaxed mt-0.5">
                Na tela de descanso, arraste os menus de <strong>Missões</strong>, <strong>Mudar Ilha</strong> e o <strong>Reprodutor Lo-Fi</strong> para posicioná-los onde preferir!
              </p>
            </div>
          </div>

          {/* 6. Memória de Amizade dos Visitantes */}
          <div className="flex items-start gap-2.5 rounded-2xl bg-white p-2.5 border border-rose-200/60 shadow-2xs">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-rose-50 border border-rose-200 text-rose-500">
              <Heart size={18} fill="currentColor" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-xs font-black text-ink">Corações de Amizade Salvos</h3>
              <p className="text-[10px] text-ink/70 leading-relaxed mt-0.5">
                O cronômetro dos visitantes diminui minuto a minuto e, se você der biscoitos e ele for embora, seus corações ficam salvos para a próxima visita!
              </p>
            </div>
          </div>

          {/* 7. Retorno Automático ao Foco */}
          <div className="flex items-start gap-2.5 rounded-2xl bg-white p-2.5 border border-leaf/40 shadow-2xs">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-leaf/15 border border-leaf/30 text-leaf-dark">
              <Flame size={18} />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-xs font-black text-ink">Retorno Automático ao Foco</h3>
              <p className="text-[10px] text-ink/70 leading-relaxed mt-0.5">
                Se você minimizar ou sair do app durante uma sessão de estudo ativa, ao reabrir ele volta direto para o Pomodoro para proteger sua concentração!
              </p>
            </div>
          </div>
        </div>

        {/* Rodapé com Checkbox de "Nunca Mais Mostrar" e Botões */}
        <div className="border-t border-ink/10 bg-white/70 px-4 py-3 space-y-2.5">
          {/* Checkbox interativa */}
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <button
              type="button"
              role="checkbox"
              aria-checked={neverShow}
              onClick={() => {
                sfx.tap();
                setNeverShow(!neverShow);
              }}
              className={`flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-md border transition-all ${
                neverShow
                  ? 'bg-leaf border-leaf text-white shadow-2xs'
                  : 'bg-white border-ink/30 text-transparent hover:border-leaf'
              }`}
            >
              <Check size={12} strokeWidth={3} className={neverShow ? 'opacity-100' : 'opacity-0'} />
            </button>
            <span
              onClick={() => {
                sfx.tap();
                setNeverShow(!neverShow);
              }}
              className="text-[11px] font-bold text-ink/75"
            >
              Nunca mais mostrar este informativo
            </span>
          </label>

          {/* Botões de Ação */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleDismiss(true)}
              className="px-3 py-2 text-[10px] font-black text-ink/50 hover:text-ink/80 uppercase transition-colors"
            >
              Não mostrar mais
            </button>

            <button
              type="button"
              onClick={handlePrimaryConfirm}
              className="flex-1 flex items-center justify-center gap-1.5 rounded-2xl bg-gradient-to-b from-leaf to-leaf-dark py-2.5 px-3 font-black text-xs text-white shadow-md transition-transform active:scale-97 hover:brightness-105"
            >
              <span>Entendido, Professor!</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

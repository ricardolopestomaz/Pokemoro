/**
 * OnboardingTour.tsx — v4
 * Revisão e Correção Profunda do Onboarding / Tutorial do Professor Ricardo:
 *
 * 1. Lore Clássica da Pesquisa do Sono & Deep Focus:
 *    - Introdução clássica de Pokémon: estudo do campo eletromagnético do sono/concentração humana.
 *    - Foco Profundo (Deep Focus) entra em ressonância e atrai Pokémon cansados para descansar.
 *    - Por que ele precisa de você como assistente (referência bem-humorada ao Kauan).
 *
 * 2. Pausa Estrita no Cronômetro de 10s:
 *    - NENHUM avanço prematuro ou timer automático após os 10s.
 *    - O diálogo pausa e aguarda estritamente o clique do usuário em "Ir para o Acampamento 🏕️ ▶".
 *
 * 3. Polaroids Autênticos com Piadas dos Amigos:
 *    - Mr. Mime: tira foto -> abre card Polaroid com a piada do Genival -> registra na Dex.
 *    - Slaking: tira foto -> abre card Polaroid com a piada do Joelson sem lençol -> registra na Dex.
 *
 * 4. Alimentação Simulada & Amizade:
 *    - Biscoito de teste oferecido ao Slaking.
 *    - Animação de mastigação (munch), partículas de coração e barra de corações (1/5 -> 2/5).
 *    - Explicação da mecânica de Study Buddies e despedida natural dos Pokémon (sem entrar na equipe).
 *
 * 5. Z-Index & Layout Perfeitos:
 *    - Pokémon posicionados no alto do gramado/mat (top: 33% e top: 35%), bem longe do Professor.
 *    - Professor Ricardo ancorado na base da caixa de diálogo sem encobrir o Slaking.
 *
 * 6. Botão "Começar a Aventura" 100% Funcional:
 *    - Concede Caterpie (#0010) como líder da equipe.
 *    - Estado de envio limpo sem botão desabilitado indevidamente.
 *    - Transição de estado imediata para entrar no jogo.
 */

import React, {
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronRight, Cookie, Award, Star, Camera, Heart } from 'lucide-react';
import confetti from 'canvas-confetti';
import { api } from '../../api/endpoints';
import { PokemonImage } from '../campsite/PokemonImage';
import { sfx } from '../../lib/sfx';
import type { TabId } from '../../types';

// ─────────────────────────────────────────────
// Tipos Públicos
// ─────────────────────────────────────────────

export type TourStep =
  | 'welcome_lore'
  | 'welcome_waves'
  | 'welcome_name'
  | 'focus_intro'
  | 'focus_running'
  | 'focus_completed'
  | 'campsite_mr'
  | 'campsite_slak'
  | 'campsite_feed'
  | 'diary_tab'
  | 'team_tab'
  | 'dex_tab'
  | 'caterpie';

export interface OnboardingTourProps {
  onSetTab: (tab: TabId) => void;
  onTourTimer: (timer: { seconds: number; running: boolean } | null) => void;
  onCompleted: () => Promise<void>;
}

interface PolaroidData {
  id: number;
  name: string;
  styleTitle: string;
  jokeAuthor: string;
  jokeText: string;
}

// ─────────────────────────────────────────────
// Input do Nome — Isolado para evitar re-render do Typewriter
// ─────────────────────────────────────────────

interface NameInputRef {
  getValue: () => string;
}

const NameInput = React.forwardRef<NameInputRef, { onSubmit: () => void }>(
  ({ onSubmit }, ref) => {
    const [value, setValue] = useState('');
    useImperativeHandle(ref, () => ({ getValue: () => value }));

    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mt-4 flex flex-col gap-2.5"
        onClick={(e) => e.stopPropagation()}
      >
        <input
          id="input-user-name"
          type="text"
          maxLength={24}
          autoFocus
          placeholder="Digite seu nome de pesquisador..."
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && value.trim()) onSubmit();
          }}
          className="w-full rounded-2xl border-2 border-slate-200 bg-slate-50 px-4 py-3 text-sm font-black text-slate-800 placeholder:text-slate-400 focus:border-[#48D0B0] focus:bg-white focus:outline-none transition-all shadow-inner"
        />
        <button
          id="btn-confirm-name"
          disabled={!value.trim()}
          onClick={onSubmit}
          className={`flex w-full items-center justify-center gap-1.5 rounded-2xl py-3.5 text-sm font-black text-white transition-all shadow-[0_4px_0_#1B846A] active:translate-y-1 active:shadow-[0_1px_0_#1B846A] ${
            value.trim()
              ? 'bg-gradient-to-b from-[#48D0B0] to-[#25AC8B] cursor-pointer'
              : 'bg-slate-300 opacity-60 cursor-not-allowed shadow-none'
          }`}
        >
          <span>Confirmar Nome</span>
          <ChevronRight size={16} />
        </button>
      </motion.div>
    );
  }
);
NameInput.displayName = 'NameInput';

// ─────────────────────────────────────────────
// Hook Typewriter Seguro
// ─────────────────────────────────────────────

function useTypewriter(
  text: string,
  speed = typeof process !== 'undefined' && process.env?.NODE_ENV === 'test' ? 0 : 12
) {
  const [displayed, setDisplayed] = useState(speed <= 0 ? text : '');
  const [done, setDone] = useState(speed <= 0);

  useEffect(() => {
    if (!text || speed <= 0) {
      setDisplayed(text);
      setDone(true);
      return;
    }
    setDisplayed('');
    setDone(false);
    let i = 0;
    const iv = setInterval(() => {
      i++;
      setDisplayed(text.slice(0, i));
      if (i >= text.length) {
        clearInterval(iv);
        setDone(true);
      }
    }, speed);
    return () => clearInterval(iv);
  }, [text, speed]);

  const skip = useCallback(() => {
    setDisplayed(text);
    setDone(true);
  }, [text]);

  return { displayed, done, skip };
}

// ─────────────────────────────────────────────
// Configuração das Etapas
// ─────────────────────────────────────────────

interface StepConfig {
  id: TourStep;
  badge: string;
  tab?: TabId;
  getText: (name: string, state?: { fed?: boolean }) => string;
}

const STEPS: StepConfig[] = [
  {
    id: 'welcome_lore',
    badge: 'Professor Ricardo 🔬',
    getText: () =>
      'Olá! Seja muito bem-vindo ao laboratório de pesquisas do Pokémoro!\n\nNeste mundo fascinante, humanos e Pokémon convivem em harmonia. Eu sou o Professor Ricardo e dedico meus estudos a desvendar o campo eletromagnético do sono e da concentração humana!',
  },
  {
    id: 'welcome_waves',
    badge: 'Professor Ricardo 🔬',
    getText: () =>
      'Descobri algo extraordinário: quando você atinge o estado de Foco Profundo (Deep Focus), suas ondas cerebrais entram em ressonância e atraem Pokémon sensíveis para perto, onde eles se sentem seguros para tirar uma soneca tranquila!',
  },
  {
    id: 'welcome_name',
    badge: 'Professor Ricardo 🔬',
    getText: () =>
      'É exatamente por isso que preciso de você! Meu assistente anterior, o Kauan, vivia perdendo o foco configurando mil coisas ao mesmo tempo e esquecia de anotar os relatórios...\n\nVocê estuda focado, os Pokémon aparecem para descansar e nós registramos as fotos juntos! Qual é o seu nome, novo pesquisador?',
  },
  {
    id: 'focus_intro',
    badge: 'Professor Ricardo ⏱️',
    tab: 'focus',
    getText: (name) =>
      `Prazer, ${name || 'Estudante'}! Nada de teoria chata: vou te mostrar na prática onde a mágica acontece.\n\nAqui na aba Foco ⏱️ sua concentração atrai Pokémon cansados. Toque no botão abaixo para iniciarmos nosso teste prático de 10 segundos!`,
  },
  {
    id: 'focus_running',
    badge: 'Professor Ricardo ⚡',
    tab: 'focus',
    getText: () =>
      'Observe o cronômetro avançando! O disco de Poké Bola e seu parceiro estão em sintonia enquanto o Deep Focus calibra suas ondas cerebrais... Foco total!',
  },
  {
    id: 'focus_completed',
    badge: 'Professor Ricardo 🎉',
    tab: 'focus',
    getText: () =>
      'Sessão de foco concluída com sucesso! 🎉 O Deep Focus ativou os multiplicadores de recompensa e atraiu novos Pokémon cansados para o nosso Acampamento.\n\nVamos até lá ver quem apareceu para descansar!',
  },
  {
    id: 'campsite_mr',
    badge: 'Professor Ricardo 😂',
    tab: 'rest',
    getText: () =>
      'Olha só quem apareceu no Acampamento! Um Mr. Mime dormindo no gramado!\n\nToque nele para registrar a foto com a nossa Poké-Câmera!',
  },
  {
    id: 'campsite_slak',
    badge: 'Professor Ricardo 🥶',
    tab: 'rest',
    getText: () =>
      'E tem outro Pokémon tirando uma soneca ali! Toque no Slaking para registrar a pose de sono dele também!',
  },
  {
    id: 'campsite_feed',
    badge: 'Professor Ricardo 🍪',
    tab: 'rest',
    getText: (_name, state) =>
      state?.fed
        ? 'Muito bem! Quando todos os corações se completam, o Pokémon se torna seu Study Buddy e entra na sua Equipe!\n\nComo esta foi uma simulação rápida, o Mr. Mime e o Slaking já vão voltar descansados para a floresta.'
        : 'Depois da foto, vem a melhor parte: alimentar os visitantes com Biscoitos de Café 🍪 para conquistar a amizade deles!\n\nToque no Biscoito de Teste abaixo para alimentar o Slaking:',
  },
  {
    id: 'diary_tab',
    badge: 'Professor Ricardo 📚',
    tab: 'journey',
    getText: () =>
      'Aqui no Diário 📚 você cadastra suas matérias reais, personaliza as cores de cada disciplina e acompanha o gráfico semanal de evolução dos seus estudos!',
  },
  {
    id: 'team_tab',
    badge: 'Professor Ricardo ⭐',
    tab: 'team',
    getText: () =>
      'Na aba Equipe ⭐, você gerencia seus Pokémon amigos. Eles atuam como seus Study Buddies, concedendo bônus passivos incríveis de Moedas de Foco e biscoitos adicionais nas pausas!',
  },
  {
    id: 'dex_tab',
    badge: 'Professor Ricardo 📸',
    tab: 'dex',
    getText: () =>
      'E aqui na Focus Dex 📸 fica o seu álbum completo de pesquisas! Cada espécie possui poses de sono únicas para descobrir e fotografar, incluindo variantes shiny raras!',
  },
  {
    id: 'caterpie',
    badge: 'Professor Ricardo ❤️',
    tab: 'rest',
    getText: () =>
      'Bom, agora que você já domina tudo, tenho uma confissão: vou tirar uma folga das pesquisas para passar um tempo com o meu amor, a Julya ❤️.\n\nEla gosta muito do Caterpie! Por isso quero te dar este pequeno Caterpie de presente. Ele será o seu primeiro parceiro oficial e Líder da equipe!',
  },
];

// ─────────────────────────────────────────────
// Componente Principal
// ─────────────────────────────────────────────

export function OnboardingTour({ onSetTab, onTourTimer, onCompleted }: OnboardingTourProps) {
  const [stepIdx, setStepIdx] = useState(0);
  const [userName, setUserName] = useState('');
  const [cameraFlash, setCameraFlash] = useState(false);
  const [polaroid, setPolaroid] = useState<PolaroidData | null>(null);
  const [mrRegistered, setMrRegistered] = useState(false);
  const [slakRegistered, setSlakRegistered] = useState(false);
  const [feedHearts, setFeedHearts] = useState(1);
  const [slakFed, setSlakFed] = useState(false);
  const [spawnsDismissed, setSpawnsDismissed] = useState(false);
  const [celebrating, setCelebrating] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const [imgSrc, setImgSrc] = useState('/assets/Professor-Ricardo.png');
  const nameInputRef = useRef<NameInputRef>(null);

  const currentStep = STEPS[stepIdx];

  // Texto atual
  const dialogText = currentStep.getText(userName, { fed: slakFed });
  const { displayed, done, skip } = useTypewriter(dialogText);

  // Sincroniza aba da tela
  useEffect(() => {
    if (currentStep.tab) {
      onSetTab(currentStep.tab);
    }
  }, [stepIdx, currentStep.tab, onSetTab]);

  // ── Simulação de 10 segundos no Pomodoro ──
  useEffect(() => {
    if (currentStep.id !== 'focus_running') return;

    let sec = 0;
    onTourTimer({ seconds: 0, running: true });

    const interval = setInterval(() => {
      sec += 1;
      onTourTimer({ seconds: sec, running: true });

      if (sec >= 10) {
        clearInterval(interval);
        sfx.bell();
        confetti({
          particleCount: 130,
          spread: 85,
          origin: { y: 0.45 },
          colors: ['#48D0B0', '#FFCB05', '#3B82F6', '#FF5B84'],
        });
        // Pausa estrita: transiciona para o passo 'focus_completed' para aguardar leitura do usuário!
        setStepIdx(5); // focus_completed
      }
    }, 1000);

    return () => {
      clearInterval(interval);
      onTourTimer(null);
    };
  }, [currentStep.id, onTourTimer]);

  // Limpa timer ao sair das telas de foco
  useEffect(() => {
    if (currentStep.id !== 'focus_running' && currentStep.id !== 'focus_completed') {
      onTourTimer(null);
    }
  }, [currentStep.id, onTourTimer]);

  // ── Ações do Usuário ──

  const handleSkipText = () => {
    if (!done && dialogText) {
      skip();
      sfx.tap();
    }
  };

  const handleConfirmName = useCallback(() => {
    const name = nameInputRef.current?.getValue().trim() ?? '';
    if (!name) return;
    sfx.tap();
    setUserName(name);
    setStepIdx(3); // focus_intro
  }, []);

  const handleStart10sFocus = () => {
    sfx.start();
    setStepIdx(4); // focus_running
  };

  const handleGoToCampsite = () => {
    sfx.tap();
    onTourTimer(null);
    setStepIdx(6); // campsite_mr
  };

  // Disparo da foto no Mr. Mime
  const handleSnapMrMime = () => {
    if (mrRegistered) return;
    sfx.camera();
    setCameraFlash(true);
    setTimeout(() => setCameraFlash(false), 200);

    setPolaroid({
      id: 122,
      name: 'Mr. Mime',
      styleTitle: 'Pose Mímica Noturna 🎭',
      jokeAuthor: 'Professor Ricardo 😂',
      jokeText:
        'Hahaha! Olha só, ele faz mímica até dormindo! Ele me lembra demais uma vez que imitei meu amigo Genival, que perdeu o dedo... foi mal, não aguento, toda vez que lembro disso eu dou risada! 😂',
    });
  };

  // Disparo da foto no Slaking
  const handleSnapSlaking = () => {
    if (slakRegistered) return;
    sfx.camera();
    setCameraFlash(true);
    setTimeout(() => setCameraFlash(false), 200);

    setPolaroid({
      id: 289,
      name: 'Slaking',
      styleTitle: 'Pose Soneca Folgada 💤',
      jokeAuthor: 'Professor Ricardo 🥶',
      jokeText:
        'Ver esse Slaking dormindo no chão me faz lembrar do meu amigo Joelson... acredita que quando a gente vai dormir na casa do Joelson ele não oferece nem um lençol?! A gente dorme tremendo de frio lá! 🥶',
    });
  };

  // Fechar o Polaroid e registrar
  const handleClosePolaroid = () => {
    if (!polaroid) return;
    sfx.fanfare();
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.55 },
    });

    if (polaroid.id === 122) {
      setMrRegistered(true);
      setPolaroid(null);
      setStepIdx(7); // campsite_slak
    } else if (polaroid.id === 289) {
      setSlakRegistered(true);
      setPolaroid(null);
      setStepIdx(8); // campsite_feed
    }
  };

  // Alimentar Slaking com biscoito de teste
  const handleFeedSlaking = () => {
    if (slakFed) return;
    sfx.munch();
    setFeedHearts(2);
    setSlakFed(true);
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { x: 0.68, y: 0.35 },
      colors: ['#FF5B84', '#FF85A2', '#FFC0CB'],
    });

    // Após breve momento, Mr. Mime e Slaking se despedem
    setTimeout(() => {
      setSpawnsDismissed(true);
    }, 2800);
  };

  // Avanço padrão entre etapas
  const handleNextStep = () => {
    sfx.tap();
    setStepIdx((i) => Math.min(i + 1, STEPS.length - 1));
  };

  // Entrega do presente Caterpie pela Julya
  const handleClaimCaterpie = () => {
    sfx.fanfare();
    confetti({
      particleCount: 220,
      spread: 110,
      origin: { y: 0.5 },
      colors: ['#FFCB05', '#48D0B0', '#FF5B84', '#3B82F6', '#8B5CF6'],
    });
    setCelebrating(true);
  };

  // Finalizar o onboarding e entrar no jogo
  const handleFinish = async () => {
    if (finishing) return;
    setFinishing(true);
    sfx.start();
    try {
      // 1. Grava no storage / banco o Caterpie e o nome do usuário
      await api.completeOnboarding(userName.trim() || 'Estudante');
      // 2. Chama onCompleted() que executa refreshAll() no App.tsx
      await onCompleted();
    } catch (err) {
      console.error('Erro ao finalizar onboarding:', err);
      // Fallback seguro caso ocorra erro
      window.location.reload();
    }
  };

  const isCampsiteActive =
    (currentStep.id === 'campsite_mr' ||
      currentStep.id === 'campsite_slak' ||
      currentStep.id === 'campsite_feed') &&
    !spawnsDismissed;

  return (
    <>
      {/* ── Flash Fotográfico da Câmera ── */}
      <AnimatePresence>
        {cameraFlash && (
          <motion.div
            key="camera-flash"
            initial={{ opacity: 0.95 }}
            animate={{ opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[95] bg-white pointer-events-none"
          />
        )}
      </AnimatePresence>

      {/* ── Backdrop Contextual ── */}
      <div
        className={`absolute inset-0 z-[70] transition-colors duration-300 ${
          currentStep.id.startsWith('welcome') || currentStep.id === 'caterpie'
            ? 'bg-black/50 pointer-events-auto'
            : currentStep.id.startsWith('focus')
            ? 'bg-transparent pointer-events-none'
            : isCampsiteActive
            ? 'bg-black/20 pointer-events-none'
            : 'bg-black/25 pointer-events-none'
        }`}
        onClick={currentStep.id.startsWith('welcome') || currentStep.id === 'caterpie' ? handleSkipText : undefined}
      />

      {/* ── Pokémon Spawns de Demonstração no Acampamento (Mr. Mime & Slaking) ── */}
      {/* Posicionados no alto do cenário (top: 33% e top: 35%) para NUNCA colidir com o Professor */}
      {isCampsiteActive && (
        <div className="absolute inset-0 z-[75] pointer-events-none">
          {/* Mr. Mime — lado esquerdo superior */}
          <div
            className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center pointer-events-auto"
            style={{ left: '30%', top: '33%', width: '36%' }}
          >
            {/* Tag indicativa */}
            <div className="mb-1">
              {mrRegistered ? (
                <div className="flex items-center gap-1 rounded-full bg-emerald-500 px-2.5 py-0.5 text-[9px] font-black text-white shadow-md">
                  <span>✓ Foto Registrada!</span>
                </div>
              ) : currentStep.id === 'campsite_mr' ? (
                <motion.div
                  animate={{ y: [0, -5, 0] }}
                  transition={{ duration: 0.8, repeat: Infinity, ease: 'easeInOut' }}
                  className="flex items-center gap-1 rounded-full border border-white bg-amber-400 px-2.5 py-0.5 text-[10px] font-black text-slate-900 shadow-md"
                >
                  <Camera size={11} />
                  <span>Toque aqui! 👆</span>
                </motion.div>
              ) : null}
            </div>

            <motion.button
              id="spawn-demo-mrmime"
              onClick={handleSnapMrMime}
              whileTap={{ scale: 0.92 }}
              className="relative w-full cursor-pointer focus:outline-none"
              aria-label="Fotografar Mr. Mime dormindo"
            >
              {currentStep.id === 'campsite_mr' && !mrRegistered && (
                <motion.div
                  animate={{ scale: [1, 1.25, 1], opacity: [0.7, 0.2, 0.7] }}
                  transition={{ duration: 1.2, repeat: Infinity }}
                  className="absolute inset-0 rounded-full border-4 border-amber-400 bg-amber-300/30 blur-[2px]"
                />
              )}
              <PokemonImage
                pokemonId={122}
                style={1}
                variant="regular"
                alt="Mr. Mime"
                className="w-full drop-shadow-xl"
              />
            </motion.button>
          </div>

          {/* Slaking — lado direito superior */}
          <div
            className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center pointer-events-auto"
            style={{ left: '68%', top: '35%', width: '38%' }}
          >
            {/* Tag indicativa ou barra de corações no passo de alimentar */}
            <div className="mb-1">
              {currentStep.id === 'campsite_feed' ? (
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="flex items-center gap-1 rounded-full bg-white/95 px-3 py-1 shadow-md border border-slate-200 backdrop-blur-sm"
                >
                  {[1, 2, 3, 4, 5].map((heartIdx) => (
                    <Heart
                      key={heartIdx}
                      size={13}
                      className={`transition-all duration-300 ${
                        heartIdx <= feedHearts
                          ? 'fill-rose-500 text-rose-500 scale-110 drop-shadow'
                          : 'fill-slate-200 text-slate-300'
                      }`}
                    />
                  ))}
                  <span className="ml-1 text-[9px] font-black text-slate-700">{feedHearts}/5</span>
                </motion.div>
              ) : slakRegistered ? (
                <div className="flex items-center gap-1 rounded-full bg-emerald-500 px-2.5 py-0.5 text-[9px] font-black text-white shadow-md">
                  <span>✓ Foto Registrada!</span>
                </div>
              ) : currentStep.id === 'campsite_slak' ? (
                <motion.div
                  animate={{ y: [0, -5, 0] }}
                  transition={{ duration: 0.8, repeat: Infinity, ease: 'easeInOut' }}
                  className="flex items-center gap-1 rounded-full border border-white bg-amber-400 px-2.5 py-0.5 text-[10px] font-black text-slate-900 shadow-md"
                >
                  <Camera size={11} />
                  <span>Toque aqui! 👆</span>
                </motion.div>
              ) : null}
            </div>

            <motion.button
              id="spawn-demo-slaking"
              onClick={currentStep.id === 'campsite_feed' ? undefined : handleSnapSlaking}
              whileTap={{ scale: 0.92 }}
              animate={slakFed ? { scale: [1, 1.15, 0.95, 1] } : {}}
              transition={{ duration: 0.4 }}
              className="relative w-full cursor-pointer focus:outline-none"
              aria-label="Fotografar Slaking dormindo"
            >
              {currentStep.id === 'campsite_slak' && !slakRegistered && (
                <motion.div
                  animate={{ scale: [1, 1.25, 1], opacity: [0.7, 0.2, 0.7] }}
                  transition={{ duration: 1.2, repeat: Infinity }}
                  className="absolute inset-0 rounded-full border-4 border-amber-400 bg-amber-300/30 blur-[2px]"
                />
              )}
              <PokemonImage
                pokemonId={289}
                style={1}
                variant="regular"
                alt="Slaking"
                className="w-full drop-shadow-xl"
              />
            </motion.button>
          </div>
        </div>
      )}

      {/* ── Modal Polaroid de Captura ── */}
      <AnimatePresence>
        {polaroid && (
          <motion.div
            className="fixed inset-0 z-[85] flex items-center justify-center bg-black/60 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              initial={{ scale: 0.85, y: 30, rotate: -3 }}
              animate={{ scale: 1, y: 0, rotate: -1 }}
              exit={{ scale: 0.85, y: 30 }}
              transition={{ type: 'spring', damping: 20, stiffness: 220 }}
              className="relative w-full max-w-[310px] rounded-3xl bg-white p-4 shadow-2xl border-4 border-slate-100"
            >
              <Star className="absolute right-3.5 top-3.5 text-amber-400 fill-amber-400 drop-shadow" size={24} />

              {/* Moldura fotográfica Polaroid */}
              <div className="relative aspect-square overflow-hidden rounded-2xl bg-gradient-to-b from-emerald-100 via-teal-50 to-emerald-50 border border-slate-200 shadow-inner flex items-center justify-center p-4">
                <PokemonImage
                  pokemonId={polaroid.id}
                  style={1}
                  variant="regular"
                  alt={polaroid.name}
                  className="w-[85%] drop-shadow-xl"
                />
              </div>

              {/* Informações da foto */}
              <div className="mt-3 text-center">
                <span className="rounded-full bg-slate-100 px-3 py-0.5 text-[10px] font-black text-slate-600">
                  #{String(polaroid.id).padStart(4, '0')} {polaroid.name}
                </span>
                <h3 className="mt-1 text-base font-black text-slate-800">{polaroid.styleTitle}</h3>
              </div>

              {/* Balão com a fala cômica do Professor */}
              <div className="mt-2.5 rounded-2xl bg-amber-50/90 border border-amber-200/80 p-3 text-left">
                <div className="flex items-center gap-1.5 text-[10px] font-black text-amber-900 uppercase">
                  <span>{polaroid.jokeAuthor}</span>
                </div>
                <p className="mt-1 text-xs font-bold leading-relaxed text-amber-950">
                  {polaroid.jokeText}
                </p>
              </div>

              {/* Botão Registrar */}
              <button
                id="btn-register-polaroid"
                onClick={handleClosePolaroid}
                className="mt-3.5 w-full rounded-2xl bg-gradient-to-b from-[#48D0B0] to-[#25AC8B] py-3.5 text-xs font-black text-white shadow-[0_4px_0_#1B846A] active:translate-y-1 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Camera size={15} />
                <span>Registrar na Focus Dex 📸</span>
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Painel Inferior: Professor Ricardo + Diálogo (z-80) ── */}
      <div className="absolute bottom-0 inset-x-0 z-[80] pointer-events-none flex flex-col items-end">
        {/* Professor Ricardo — ANCORADO firmemente atrás do topo da caixa de diálogo */}
        {!celebrating && (
          <div className="relative w-full flex justify-end px-5 pointer-events-none overflow-visible">
            <motion.img
              key={`prof-${stepIdx}`}
              src={imgSrc}
              alt="Professor Ricardo"
              onError={() => {
                if (imgSrc.includes('Professor-Ricardo.png')) {
                  setImgSrc('/assets/Professor%20Ricardo.png');
                }
              }}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
              className="h-40 w-auto object-contain select-none pointer-events-none drop-shadow-[0_8px_16px_rgba(0,0,0,0.35)]"
              style={{ marginBottom: '-14px', zIndex: 1 }}
              draggable={false}
            />
          </div>
        )}

        {/* Card de Celebração e Entrega do Caterpie */}
        {celebrating && (
          <div className="w-full flex justify-center pb-4 px-4 pointer-events-auto">
            <motion.div
              key="caterpie-card"
              initial={{ scale: 0.8, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              transition={{ type: 'spring', damping: 18, stiffness: 220 }}
              className="relative flex w-full max-w-xs flex-col items-center rounded-3xl bg-white p-5 text-center shadow-2xl border-4 border-amber-300"
            >
              <div className="absolute -top-3.5 rounded-full bg-gradient-to-r from-amber-400 to-yellow-500 px-4 py-1 text-[10px] font-black text-white shadow-md uppercase tracking-wider">
                Primeiro Parceiro! 🐛✨
              </div>

              <div className="relative mt-2 flex h-28 w-28 items-center justify-center">
                <div className="absolute inset-0 rounded-full bg-amber-100/80 animate-ping opacity-20" />
                <div className="absolute inset-2 rounded-full bg-gradient-to-b from-amber-100 to-yellow-200 shadow-inner" />
                <div className="relative w-24">
                  <PokemonImage pokemonId={10} style={1} variant="regular" alt="Caterpie" className="w-full drop-shadow-lg" />
                </div>
              </div>

              <h2 className="mt-2 text-lg font-black text-slate-800">Caterpie #0010</h2>
              <p className="text-[10px] font-extrabold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full mt-0.5">
                Líder da Equipe (Slot 1)
              </p>

              <div className="mt-3 flex w-full flex-col gap-1.5 rounded-xl bg-slate-50 p-2.5 text-left border border-slate-100">
                <div className="flex items-center gap-2 text-[10px] font-black text-slate-700">
                  <Award size={14} className="text-amber-500" />
                  <span>+20% Moedas de Foco</span>
                </div>
                <div className="flex items-center gap-2 text-[10px] font-black text-slate-700">
                  <Cookie size={14} className="text-amber-600" />
                  <span>Kit Inicial: +3 Biscoitos Básicos 🍪</span>
                </div>
              </div>

              <button
                id="btn-start-adventure"
                disabled={finishing}
                onClick={handleFinish}
                className="mt-4 w-full rounded-2xl bg-gradient-to-b from-[#48D0B0] to-[#25AC8B] py-3.5 text-sm font-black text-white shadow-[0_4px_0_#1B846A] active:translate-y-1 transition-all cursor-pointer"
              >
                {finishing ? 'Iniciando Aventura... 🏕️' : 'Começar a Aventura! 🏕️'}
              </button>
            </motion.div>
          </div>
        )}

        {/* ── Caixa de Diálogo ── */}
        {!celebrating && (
          <motion.div
            key={`dlg-${stepIdx}`}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            onClick={currentStep.id === 'welcome_name' || isCampsiteActive ? undefined : handleSkipText}
            className={`pointer-events-auto relative z-10 w-full rounded-t-[1.8rem] border-t-4 border-emerald-400 bg-white px-5 py-4 shadow-[0_-12px_32px_rgba(0,0,0,0.22)] ${
              currentStep.id === 'welcome_name' || isCampsiteActive ? '' : 'cursor-pointer'
            }`}
          >
            {/* Badge com o nome do Professor */}
            <div className="absolute -top-4 left-5 flex items-center gap-1 rounded-full bg-[#48D0B0] px-4 py-1 text-[11px] font-black text-white shadow-md uppercase tracking-wider border-2 border-white">
              {currentStep.badge}
            </div>

            {/* Indicador de progresso */}
            <div className="absolute -top-3.5 right-5 flex items-center gap-1 rounded-full bg-white px-2.5 py-1 shadow border border-slate-100">
              {STEPS.map((_, i) => (
                <span
                  key={i}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    i === stepIdx ? 'w-4 bg-emerald-500' : i < stepIdx ? 'w-1.5 bg-emerald-300' : 'w-1.5 bg-slate-200'
                  }`}
                />
              ))}
            </div>

            {/* Texto do Diálogo */}
            <div className="min-h-[68px] text-xs font-bold leading-relaxed text-slate-700 sm:text-sm pt-1">
              {displayed.split('\n\n').map((para, pi) => (
                <p key={pi} className={pi > 0 ? 'mt-2' : ''}>
                  {para.split('\n').map((line, li) => (
                    <React.Fragment key={li}>
                      {li > 0 && <br />}
                      {line}
                    </React.Fragment>
                  ))}
                </p>
              ))}
            </div>

            {/* Input de Nome no passo welcome_name */}
            {currentStep.id === 'welcome_name' && (
              <NameInput ref={nameInputRef} onSubmit={handleConfirmName} />
            )}

            {/* Botão de iniciar o teste de 10s no Pomodoro */}
            {currentStep.id === 'focus_intro' && done && (
              <div className="mt-3 flex justify-end" onClick={(e) => e.stopPropagation()}>
                <button
                  id="btn-start-focus-test"
                  onClick={handleStart10sFocus}
                  className="flex items-center gap-2 rounded-2xl bg-gradient-to-b from-[#48D0B0] to-[#25AC8B] px-5 py-2.5 text-sm font-black text-white shadow-[0_4px_0_#1B846A] transition-all active:translate-y-1 active:shadow-[0_1px_0_#1B846A] cursor-pointer"
                >
                  <span>Iniciar Teste de 10s ⏱️</span>
                  <ChevronRight size={16} />
                </button>
              </div>
            )}

            {/* Botão de ir para o Acampamento após concluir os 10s (SEM AVANÇO AUTOMÁTICO!) */}
            {currentStep.id === 'focus_completed' && done && (
              <div className="mt-3 flex justify-end" onClick={(e) => e.stopPropagation()}>
                <button
                  id="btn-go-campsite"
                  onClick={handleGoToCampsite}
                  className="flex items-center gap-2 rounded-2xl bg-gradient-to-b from-[#48D0B0] to-[#25AC8B] px-5 py-2.5 text-sm font-black text-white shadow-[0_4px_0_#1B846A] transition-all active:translate-y-1 active:shadow-[0_1px_0_#1B846A] cursor-pointer"
                >
                  <span>Ir para o Acampamento 🏕️</span>
                  <ChevronRight size={16} />
                </button>
              </div>
            )}

            {/* Botão de Alimentação do Slaking */}
            {currentStep.id === 'campsite_feed' && !slakFed && done && (
              <div className="mt-3 flex justify-end" onClick={(e) => e.stopPropagation()}>
                <button
                  id="btn-feed-test-biscuit"
                  onClick={handleFeedSlaking}
                  className="flex items-center gap-2 rounded-2xl bg-gradient-to-b from-amber-500 to-amber-600 px-5 py-2.5 text-sm font-black text-white shadow-[0_4px_0_#b45309] transition-all active:translate-y-1 active:shadow-[0_1px_0_#b45309] cursor-pointer"
                >
                  <Cookie size={16} />
                  <span>Oferecer Biscoito de Teste 🍪</span>
                </button>
              </div>
            )}

            {/* Botão Continuar após alimentar o Slaking */}
            {currentStep.id === 'campsite_feed' && slakFed && done && (
              <div className="mt-3 flex justify-end" onClick={(e) => e.stopPropagation()}>
                <button
                  id="btn-continue-after-feed"
                  onClick={handleNextStep}
                  className="flex items-center gap-2 rounded-2xl bg-gradient-to-b from-[#48D0B0] to-[#25AC8B] px-5 py-2.5 text-sm font-black text-white shadow-[0_4px_0_#1B846A] transition-all active:translate-y-1 active:shadow-[0_1px_0_#1B846A] cursor-pointer"
                >
                  <span>Entendido! Continuar</span>
                  <ChevronRight size={16} />
                </button>
              </div>
            )}

            {/* Botão Continuar Padrão para passos de navegação e lore */}
            {(currentStep.id === 'welcome_lore' ||
              currentStep.id === 'welcome_waves' ||
              currentStep.id === 'diary_tab' ||
              currentStep.id === 'team_tab' ||
              currentStep.id === 'dex_tab') &&
              done && (
                <div className="mt-3 flex justify-end" onClick={(e) => e.stopPropagation()}>
                  <button
                    id={`btn-tour-next-${stepIdx}`}
                    onClick={handleNextStep}
                    className="flex items-center gap-2 rounded-2xl bg-gradient-to-b from-[#48D0B0] to-[#25AC8B] px-5 py-2.5 text-sm font-black text-white shadow-[0_4px_0_#1B846A] transition-all active:translate-y-1 active:shadow-[0_1px_0_#1B846A] cursor-pointer"
                  >
                    {currentStep.id === 'dex_tab' ? (
                      <>
                        <Star size={14} />
                        <span>Receber Presente! 🎁</span>
                      </>
                    ) : (
                      <>
                        <span>Próximo ▶</span>
                      </>
                    )}
                  </button>
                </div>
              )}

            {/* Botão Presente do Caterpie */}
            {currentStep.id === 'caterpie' && done && (
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.15 }}
                className="mt-3"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  id="btn-claim-caterpie"
                  onClick={handleClaimCaterpie}
                  className="w-full rounded-2xl bg-gradient-to-b from-[#FFCB05] to-[#E5A800] py-4 text-sm font-black text-slate-900 shadow-[0_5px_0_#B78700] active:translate-y-1 active:shadow-[0_1px_0_#B78700] transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Receber Caterpie e Começar! 🐛✨</span>
                </button>
              </motion.div>
            )}

            {/* Indicador de skip do typewriter */}
            {!done && dialogText && (
              <div className="mt-1 text-right">
                <span className="text-[10px] font-bold text-slate-400 animate-pulse">
                  Toque para adiantar ▶
                </span>
              </div>
            )}
          </motion.div>
        )}
      </div>
    </>
  );
}

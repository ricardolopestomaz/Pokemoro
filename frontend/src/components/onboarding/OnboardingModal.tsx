import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Cookie, Award, ChevronRight } from 'lucide-react';
import confetti from 'canvas-confetti';
import { API_BASE } from '../../api/client';
import { api } from '../../api/endpoints';
import { PokemonImage } from '../campsite/PokemonImage';
import { sfx } from '../../lib/sfx';

interface Props {
  /** Chamado quando o onboarding é concluído para atualizar o estado global. */
  onCompleted: () => void | Promise<void>;
}

function isJulyaName(name: string): boolean {
  const n = name.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  return n === 'julya' || n === 'julia';
}

export function OnboardingModal({ onCompleted }: Props) {
  const [step, setStep] = useState<0 | 1 | 2 | 3 | 4>(0);
  const [userName, setUserName] = useState('');
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [celebrating, setCelebrating] = useState(false);

  // Fallback seguro de URL do Professor Ricardo
  const [imgSrc, setImgSrc] = useState('/assets/Professor-Ricardo.png');

  const cleanName = userName.trim();
  const isJulya = isJulyaName(cleanName);

  // Diálogos oficiais e passo a passo educativo
  const dialogueSteps = [
    // Passo 0: Boas-vindas & Nome
    {
      text: 'Olá! Boas-vindas ao laboratório do Pokémoro! Eu sou o Professor Ricardo, pesquisador chefe da relação entre o foco humano e o descanso dos Pokémon.\n\nAntes de começarmos nossa pesquisa, me diga: como devo te chamar?',
      badge: 'Professor Ricardo',
    },
    // Passo 1: Reação ao Nome (com Easter Egg especial da Julya)
    {
      text: isJulya
        ? `Nossa... ${cleanName}! Que nome lindo e encantador! Esse é exatamente o mesmo nome da mulher que eu mais amo em todo o mundo! ❤️ Fico muito emocionado e feliz de ter alguém com esse nome tão especial sendo minha assistente oficial de pesquisa!\n\nAgora deixe-me te ensinar como o Pokémoro funciona na prática!`
        : `Muito prazer, ${cleanName || 'Estudante'}! É uma alegria enorme ter você como meu(minha) novo(a) assistente de pesquisa aqui no laboratório!\n\nAgora, preste bastante atenção nestas instruções rápidas para você aproveitar ao máximo sua jornada de estudos!`,
      badge: isJulya ? 'Professor Ricardo ❤️' : 'Professor Ricardo',
    },
    // Passo 2: Como cria matéria & Como entra em foco
    {
      text: '1. Criar Matérias 📚:\nNa aba "Jornada", toque no botão "+ Nova Matéria" para cadastrar o que você estuda (ex: Matemática, Programação ou Idiomas) e escolher uma cor temática para cada disciplina!\n\n2. Entrar em Foco ⏱️:\nNa aba "Foco", selecione a matéria, escolha o modo (25 min, 50 min ou Modo Livre) e toque em "Iniciar Sessão de Foco". O cronômetro roda em segundo plano, então seu foco continua valendo mesmo se você sair do app!',
      badge: 'Professor Ricardo',
    },
    // Passo 3: Como dar biscoito & Como colocar na equipe
    {
      text: '3. Dar Biscoitos & Focus Dex 🍪📸:\nAo concluir uma sessão de estudos, novos Pokémon aparecem dormindo no seu Acampamento! Toque neles para registrar as poses na Focus Dex e alimente-os com Biscoitos de Café até encher a barra de amizade!\n\n4. Colocar na Equipe ⭐:\nAo recrutar um Pokémon, vá até a aba "Equipe". Lá você escala até 5 Study Buddies na equipe ativa para te acompanharem no cenário e concederem bônus passivos de moedas e foco!',
      badge: 'Professor Ricardo',
    },
    // Passo 4: Julya & O Presente Especial (Caterpie)
    {
      text: 'Para falar a verdade, você chegou na hora certa! Eu vou tirar uma folga das pesquisas para passar um tempo especial com o meu amor, a Julya ❤️.\n\nA Julya gosta muito do Caterpie! Por isso, antes de eu sair de férias com ela, quero te entregar este pequeno Caterpie para cuidar. Ele será o seu primeiro amigo e parceiro oficial de estudos!',
      badge: 'Professor Ricardo',
    },
  ];

  const currentDialogue = dialogueSteps[step] || dialogueSteps[0];

  // Efeito Typewriter
  useEffect(() => {
    let index = 0;
    const fullText = currentDialogue.text;
    setDisplayedText('');
    setIsTyping(true);

    const interval = setInterval(() => {
      index++;
      setDisplayedText(fullText.slice(0, index));
      if (index >= fullText.length) {
        clearInterval(interval);
        setIsTyping(false);
      }
    }, 14);

    return () => clearInterval(interval);
  }, [step, userName]);

  // Pular digitação ao clicar na caixa de texto
  const handleSkipTyping = () => {
    if (isTyping) {
      setDisplayedText(currentDialogue.text);
      setIsTyping(false);
      sfx.tap();
    }
  };

  const handleNextStep = () => {
    sfx.tap();
    if (step === 0) {
      if (!userName.trim()) return;
      setStep(1);
    } else if (step === 1) {
      setStep(2);
    } else if (step === 2) {
      setStep(3);
    } else if (step === 3) {
      setStep(4);
    }
  };

  const handleClaimCaterpie = async () => {
    sfx.fanfare();
    confetti({
      particleCount: 160,
      spread: 90,
      origin: { y: 0.55 },
      colors: ['#FFCB05', '#48D0B0', '#FF5B84', '#3B82F6', '#8B5CF6'],
    });

    setCelebrating(true);
    setSubmitting(true);

    try {
      await api.completeOnboarding(userName.trim() || 'Estudante');
    } catch (err) {
      console.error('Erro ao completar onboarding:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleFinishOnboarding = async () => {
    sfx.tap();
    try {
      await onCompleted();
    } catch {
      window.location.reload();
    }
  };

  return (
    <div className="absolute inset-0 z-[75] flex flex-col items-center justify-between overflow-hidden bg-gradient-to-b from-[#e8f6ff] via-[#d6f0ff] to-[#bce5ff] p-4 text-slate-800 select-none">
      {/* Luz ambiente e brilhos */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-white/70 via-transparent to-transparent" />

      {/* Header Superior estilo Pokémon Sleep */}
      <div className="relative z-10 flex w-full items-center justify-between pt-2">
        <div className="flex items-center gap-2 rounded-full bg-white/80 px-3.5 py-1.5 shadow-sm backdrop-blur-xs">
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-[10px] text-white">
            🎓
          </span>
          <span className="text-xs font-black tracking-wide text-slate-700 uppercase">
            Laboratório Pokémoro
          </span>
        </div>

        {/* Indicador de passos */}
        {!celebrating && (
          <div className="flex items-center gap-1.5 rounded-full bg-white/80 px-3 py-1 shadow-sm backdrop-blur-xs">
            {[0, 1, 2, 3, 4].map((i) => (
              <span
                key={i}
                className={`h-2 rounded-full transition-all duration-300 ${
                  i === step ? 'w-5 bg-emerald-500' : 'w-2 bg-slate-300'
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Área Central: Professor Ricardo ou Card de Celebração */}
      <div className="relative z-10 flex flex-1 w-full items-center justify-center py-2">
        <AnimatePresence mode="wait">
          {!celebrating ? (
            <motion.div
              key="professor"
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.45, ease: 'easeOut' }}
              className="relative flex flex-col items-center"
            >
              {/* Efeito de halo/luz atrás do Professor */}
              <div className="absolute h-64 w-64 rounded-full bg-emerald-200/50 blur-2xl -z-10" />

              <motion.img
                src={imgSrc}
                alt="Professor Ricardo"
                onError={() => {
                  if (imgSrc.includes('Professor-Ricardo.png')) {
                    setImgSrc('/assets/Professor%20Ricardo.png');
                  }
                }}
                animate={{ y: [0, -6, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                className="max-h-[36vh] w-auto object-contain drop-shadow-[0_15px_15px_rgba(0,0,0,0.18)]"
              />
            </motion.div>
          ) : (
            <motion.div
              key="celebration-card"
              initial={{ scale: 0.7, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              transition={{ type: 'spring', damping: 18, stiffness: 220 }}
              className="relative flex w-full max-w-sm flex-col items-center rounded-3xl bg-white p-6 text-center shadow-2xl border-4 border-amber-300"
            >
              <div className="absolute -top-4 rounded-full bg-gradient-to-r from-amber-400 to-yellow-500 px-4 py-1 text-xs font-black text-white shadow-md uppercase tracking-wider">
                Primeiro Parceiro Recrutado! 🐛✨
              </div>

              <div className="relative mt-2 flex h-36 w-36 items-center justify-center">
                <div className="absolute inset-0 rounded-full bg-amber-100/80 animate-ping opacity-25" />
                <div className="absolute inset-2 rounded-full bg-gradient-to-b from-amber-100 to-yellow-200 shadow-inner" />
                <div className="relative w-28">
                  <PokemonImage
                    pokemonId={10}
                    style={1}
                    variant="regular"
                    alt="Caterpie"
                    className="w-full drop-shadow-lg"
                  />
                </div>
              </div>

              <h2 className="mt-2 text-2xl font-black text-slate-800">Caterpie #0010</h2>
              <p className="text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full mt-1">
                Líder da Equipe de Estudos (Slot 1)
              </p>

              <div className="mt-4 flex w-full flex-col gap-2 rounded-2xl bg-slate-50 p-3 text-left border border-slate-100">
                <div className="flex items-center gap-2 text-xs font-black text-slate-700">
                  <Award size={16} className="text-amber-500" />
                  <span>Bônus Passivo: Coleta &amp; Café (+20% Moedas)</span>
                </div>
                <div className="flex items-center gap-2 text-xs font-black text-slate-700">
                  <Cookie size={16} className="text-amber-600" />
                  <span>Kit Boas-Vindas: +3 Biscoitos de Café Básicos 🍪</span>
                </div>
              </div>

              <button
                id="btn-start-adventure"
                disabled={submitting}
                onClick={handleFinishOnboarding}
                className="mt-5 w-full rounded-2xl bg-gradient-to-b from-[#48D0B0] to-[#25AC8B] py-3.5 text-center text-sm font-black text-white shadow-[0_5px_0_#1B846A] active:translate-y-1 active:shadow-[0_1px_0_#1B846A] transition-all"
              >
                Começar Estudos no Pokémoro! 🏕️
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Caixa de Diálogo Inferior estilo Pokémon Sleep / Console RPG */}
      {!celebrating && (
        <motion.div
          key={`dialogue-${step}`}
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          onClick={handleSkipTyping}
          className="relative z-20 w-full rounded-[2rem] border-2 border-emerald-400/50 bg-white/95 p-5 shadow-2xl backdrop-blur-md cursor-pointer"
        >
          {/* Badge do Nome do Professor estilo Pokémon Sleep */}
          <div className="absolute -top-3.5 left-6 flex items-center gap-1.5 rounded-full bg-[#48D0B0] px-4 py-1 text-xs font-black text-white shadow-md uppercase tracking-wider">
            <span>{currentDialogue.badge}</span>
          </div>

          {/* Texto com Typewriter e quebras de linha preservadas */}
          <div className="mt-1 min-h-[96px] text-xs font-bold leading-relaxed text-slate-700 sm:text-sm">
            {displayedText.split('\n\n').map((paragraph, idx) => (
              <p key={idx} className={idx > 0 ? 'mt-2' : ''}>
                {paragraph.split('\n').map((line, li) => (
                  <React.Fragment key={li}>
                    {li > 0 && <br />}
                    {line}
                  </React.Fragment>
                ))}
              </p>
            ))}
          </div>

          {/* Input interativo para o Nome no Passo 0 */}
          {step === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              onClick={(e) => e.stopPropagation()}
              className="mt-4 flex flex-col gap-2"
            >
              <div className="relative">
                <input
                  id="input-user-name"
                  type="text"
                  maxLength={24}
                  autoFocus
                  placeholder="Digite seu nome de estudante..."
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && userName.trim()) {
                      handleNextStep();
                    }
                  }}
                  className="w-full rounded-2xl border-2 border-slate-200 bg-slate-50 px-4 py-3 text-sm font-black text-slate-800 placeholder:text-slate-400 focus:border-[#48D0B0] focus:bg-white focus:outline-none transition-all shadow-inner"
                />
              </div>

              <button
                id="btn-confirm-name"
                disabled={!userName.trim()}
                onClick={handleNextStep}
                className={`mt-1 flex w-full items-center justify-center gap-1.5 rounded-2xl py-3.5 text-center text-sm font-black text-white transition-all shadow-[0_4px_0_#1B846A] active:translate-y-1 active:shadow-[0_1px_0_#1B846A] ${
                  userName.trim()
                    ? 'bg-gradient-to-b from-[#48D0B0] to-[#25AC8B] cursor-pointer'
                    : 'bg-slate-300 opacity-60 cursor-not-allowed shadow-none'
                }`}
              >
                <span>Confirmar Nome</span>
                <ChevronRight size={16} />
              </button>
            </motion.div>
          )}

          {/* Botão de Avançar no Passo 1 (Reação ao Nome) */}
          {step === 1 && (
            <div className="mt-4 flex justify-end" onClick={(e) => e.stopPropagation()}>
              <button
                id="btn-step-1-next"
                onClick={handleNextStep}
                className="flex items-center gap-2 rounded-2xl bg-gradient-to-b from-[#48D0B0] to-[#25AC8B] px-6 py-3 text-sm font-black text-white shadow-[0_4px_0_#1B846A] active:translate-y-1 active:shadow-[0_1px_0_#1B846A] transition-all"
              >
                <span>Como Funciona?</span>
                <ChevronRight size={16} />
              </button>
            </div>
          )}

          {/* Botão de Avançar no Passo 2 (Matérias & Foco) */}
          {step === 2 && (
            <div className="mt-4 flex justify-end" onClick={(e) => e.stopPropagation()}>
              <button
                id="btn-step-2-next"
                onClick={handleNextStep}
                className="flex items-center gap-2 rounded-2xl bg-gradient-to-b from-[#48D0B0] to-[#25AC8B] px-6 py-3 text-sm font-black text-white shadow-[0_4px_0_#1B846A] active:translate-y-1 active:shadow-[0_1px_0_#1B846A] transition-all"
              >
                <span>E os Pokémon?</span>
                <ChevronRight size={16} />
              </button>
            </div>
          )}

          {/* Botão de Avançar no Passo 3 (Biscoitos & Equipe) */}
          {step === 3 && (
            <div className="mt-4 flex justify-end" onClick={(e) => e.stopPropagation()}>
              <button
                id="btn-step-3-next"
                onClick={handleNextStep}
                className="flex items-center gap-2 rounded-2xl bg-gradient-to-b from-[#48D0B0] to-[#25AC8B] px-6 py-3 text-sm font-black text-white shadow-[0_4px_0_#1B846A] active:translate-y-1 active:shadow-[0_1px_0_#1B846A] transition-all"
              >
                <span>A História da Folga</span>
                <ChevronRight size={16} />
              </button>
            </div>
          )}

          {/* Botão Especial Amarelo no Passo 4 (Caterpie da Julya) */}
          {step === 4 && (
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="mt-4"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                id="btn-claim-caterpie"
                disabled={submitting}
                onClick={handleClaimCaterpie}
                className="w-full rounded-2xl bg-gradient-to-b from-[#FFCB05] to-[#E5A800] py-4 px-4 text-center text-sm font-black text-slate-900 shadow-[0_5px_0_#B78700] active:translate-y-1 active:shadow-[0_1px_0_#B78700] hover:brightness-105 transition-all flex items-center justify-center gap-2 tracking-wide disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <span>{submitting ? 'Recebendo Caterpie...' : 'Receber Caterpie e Começar! 🐛✨'}</span>
              </button>
            </motion.div>
          )}

          {/* Indicador tátil para continuar / avançar texto rápido */}
          {isTyping && (
            <div className="mt-2 text-right">
              <span className="text-[10px] font-bold text-slate-400 animate-pulse">
                Clique para adiantar o texto ▶
              </span>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}

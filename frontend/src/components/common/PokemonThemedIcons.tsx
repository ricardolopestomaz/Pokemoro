import React from 'react';

interface IconProps {
  size?: number;
  className?: string;
}

/**
 * Insígnia de Campeão / Ranking Global Estilo Pokémon.
 * Substitui o troféu genérico por uma medalha de insígnia de ginásio com formato de Pokébola dourada.
 */
export function PokeBadgeIcon({ size = 18, className = '' }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="badgeGold" x1="0" y1="0" x2="24" y2="24" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FCD34D" />
          <stop offset="0.5" stopColor="#F59E0B" />
          <stop offset="1" stopColor="#D97706" />
        </linearGradient>
        <linearGradient id="badgeRuby" x1="0" y1="2" x2="24" y2="12" gradientUnits="userSpaceOnUse">
          <stop stopColor="#EF4444" />
          <stop offset="1" stopColor="#B91C1C" />
        </linearGradient>
      </defs>
      {/* Círculo base metálico de insígnia */}
      <circle cx="12" cy="12" r="10.5" fill="url(#badgeGold)" stroke="#78350F" strokeWidth="1" />
      <circle cx="12" cy="12" r="9" fill="#FFFFFF" />
      
      {/* Metade superior vermelha (Pokébola) */}
      <path d="M3 12 A9 9 0 0 1 21 12 Z" fill="url(#badgeRuby)" />
      
      {/* Faixa central preta/dourada */}
      <rect x="3" y="10.8" width="18" height="2.4" fill="#1E293B" />
      
      {/* Botão central da Pokébola */}
      <circle cx="12" cy="12" r="3.2" fill="#1E293B" />
      <circle cx="12" cy="12" r="2.2" fill="#FFFFFF" stroke="#0F172A" strokeWidth="0.6" />
      <circle cx="12" cy="12" r="1" fill="#F8FAFC" />
      
      {/* Brilho estelar */}
      <path d="M12 4.5 L12.6 6 L14 6.5 L12.8 7.5 L13 9 L12 8.2 L11 9 L11.2 7.5 L10 6.5 L11.4 6 Z" fill="#FDE047" opacity="0.85" />
    </svg>
  );
}

/**
 * Caderneta de Pesquisa Pokémon (Missões Diárias).
 * Substitui o emoji/pergaminho genérico pelo caderno de campo oficial do Professor Pokémon.
 */
export function ResearchQuestIcon({ size = 18, className = '' }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="questCover" x1="4" y1="2" x2="20" y2="22" gradientUnits="userSpaceOnUse">
          <stop stopColor="#3B82F6" />
          <stop offset="1" stopColor="#1D4ED8" />
        </linearGradient>
      </defs>
      {/* Capa do caderno de campo */}
      <rect x="4" y="2" width="16" height="20" rx="3" fill="url(#questCover)" stroke="#1E3A8A" strokeWidth="1.2" />
      
      {/* Lombada espiral vermelha de Pokédex */}
      <rect x="4" y="2" width="3.5" height="20" rx="1.5" fill="#EF4444" />
      <circle cx="5.7" cy="6" r="0.8" fill="#FFFFFF" />
      <circle cx="5.7" cy="10" r="0.8" fill="#FFFFFF" />
      <circle cx="5.7" cy="14" r="0.8" fill="#FFFFFF" />
      <circle cx="5.7" cy="18" r="0.8" fill="#FFFFFF" />
      
      {/* Folha interna com linhas de anotação de estudos */}
      <rect x="9.5" y="4.5" width="8.5" height="15" rx="1.5" fill="#FFFFFF" />
      <line x1="11" y1="8" x2="16.5" y2="8" stroke="#94A3B8" strokeWidth="1.2" strokeLinecap="round" />
      <line x1="11" y1="11" x2="16.5" y2="11" stroke="#94A3B8" strokeWidth="1.2" strokeLinecap="round" />
      <line x1="11" y1="14" x2="14.5" y2="14" stroke="#94A3B8" strokeWidth="1.2" strokeLinecap="round" />
      
      {/* Carimbo de Pokébola no rodapé da folha */}
      <circle cx="15" cy="16.5" r="1.8" fill="#EF4444" />
      <path d="M13.2 16.5 A1.8 1.8 0 0 0 16.8 16.5 Z" fill="#F8FAFC" />
      <circle cx="15" cy="16.5" r="0.6" fill="#1E293B" />
    </svg>
  );
}

interface BiscuitProps extends IconProps {
  type?: 'basic' | 'great' | 'master' | 'default';
}

/**
 * Biscoito Pokémon Oficial (Poké Biscuit de Pokémon Sleep).
 * Substitui o cookie de chocolate genérico pelo biscoito temático em formato de Pokébola.
 */
export function PokeBiscuitIcon({ size = 18, type = 'default', className = '' }: BiscuitProps) {
  const topColor =
    type === 'great'
      ? '#38BDF8'
      : type === 'master'
      ? '#A855F7'
      : '#E11D48'; // Básico é Vermelho Pokébola

  const darkBorder =
    type === 'great'
      ? '#0369A1'
      : type === 'master'
      ? '#6B21A8'
      : '#881337';

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* Biscoito com textura tostada dourada */}
      <circle cx="12" cy="12" r="10" fill="#FDE68A" stroke="#B45309" strokeWidth="1.5" />
      
      {/* Glacê da metade superior (Vermelho/Azul/Roxo do Poké Biscuit) */}
      <path d="M2.5 12 A9.5 9.5 0 0 1 21.5 12 Z" fill={topColor} />
      
      {/* Pequenos granulados crocantes de biscoito */}
      <circle cx="8" cy="8" r="0.9" fill="#FFF" opacity="0.6" />
      <circle cx="16" cy="7.5" r="0.9" fill="#FFF" opacity="0.6" />
      <circle cx="7" cy="15.5" r="0.9" fill="#B45309" opacity="0.4" />
      <circle cx="17" cy="15.5" r="0.9" fill="#B45309" opacity="0.4" />
      
      {/* Faixa de chocolate divisória */}
      <rect x="2.5" y="10.8" width="19" height="2.4" fill="#451A03" />
      
      {/* Botão de açúcar central */}
      <circle cx="12" cy="12" r="3.2" fill="#451A03" />
      <circle cx="12" cy="12" r="2.2" fill="#FFFFFF" stroke={darkBorder} strokeWidth="0.5" />
      <circle cx="12" cy="12" r="1" fill="#FEF08A" />
    </svg>
  );
}

/**
 * Moeda de Foco Oficial (Serebii Emerald Badge 05).
 * Substitui o ícone anterior pela moeda oficial de Emerald solicitada pelo usuário.
 */
export function PokeCoinIcon({ size = 18, className = '' }: IconProps) {
  return (
    <img
      src="/coins/focus_coin.png"
      onError={(e) => {
        e.currentTarget.src = 'https://i0.wp.com/www.serebii.net/emerald/badge05-g.png?resize=16%2C16&ssl=1';
      }}
      alt="Moeda de Foco"
      style={{ width: size, height: size }}
      className={`inline-block shrink-0 object-contain drop-shadow-2xs select-none ${className}`}
      draggable={false}
    />
  );
}

const BADGE_SHAPES: Record<string, string> = {
  round: 'M12 1.5a10.5 10.5 0 1 0 0 21 10.5 10.5 0 0 0 0-21Z',
  diamond: 'M12 1.5 22 12 12 22.5 2 12Z',
  star: 'M12 1.8l2.9 6.2 6.8.8-5 4.7 1.3 6.7L12 16.7 6 20.2l1.3-6.7-5-4.7 6.8-.8Z',
  drop: 'M12 1.5C12 1.5 4.5 10 4.5 14.5a7.5 7.5 0 0 0 15 0C19.5 10 12 1.5 12 1.5Z',
  flame: 'M12 1.5c1 4-4.5 6-4.5 11a4.5 4.5 0 0 0 9 0c0-2-1-3-1.5-4.5 3 1 5.5 3.6 5.5 7A8.5 8.5 0 0 1 3.5 15C3.5 8.5 10 7 12 1.5Z',
  hex: 'M12 1.5 21 6.75v10.5L12 22.5 3 17.25V6.75Z',
  heart: 'M12 21s-9-5.7-9-12a5 5 0 0 1 9-3 5 5 0 0 1 9 3c0 6.3-9 12-9 12Z',
  leaf: 'M12 1.5C20 4 21.5 14 12 22.5 2.5 14 4 4 12 1.5Z',
};

interface GymBadgeProps extends IconProps {
  color: string;
  dark: string;
  shape: string;
  locked?: boolean;
}

/**
 * Insígnia de Ginásio individual (cada uma com cor e formato próprios, estilo Kanto).
 * Sem gradientes com id global, então várias insígnias podem coexistir na mesma tela.
 */
export function GymBadgeIcon({ size = 20, color, dark, shape, locked = false, className = '' }: GymBadgeProps) {
  const d = BADGE_SHAPES[shape] ?? BADGE_SHAPES.round;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={locked ? { filter: 'grayscale(1)', opacity: 0.35 } : undefined}
      aria-hidden="true"
    >
      <path d={d} fill={dark} stroke={dark} strokeWidth="1.2" strokeLinejoin="round" />
      <g transform="translate(12 12) scale(0.8) translate(-12 -12)">
        <path d={d} fill={color} stroke="#FFFFFF" strokeOpacity="0.55" strokeWidth="0.8" strokeLinejoin="round" />
      </g>
      <ellipse cx="9" cy="8" rx="2.4" ry="1.3" fill="#FFFFFF" opacity="0.6" transform="rotate(-30 9 8)" />
      <circle cx="12" cy="13" r="1.4" fill={dark} opacity="0.55" />
    </svg>
  );
}

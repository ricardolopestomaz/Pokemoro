import { getBadgeTier, getBadgeGifUrl, getBadgeFallbackGifUrl } from '../../lib/badges';

interface Props {
  count: number;
  /** Quantas insígnias exibir antes de resumir em "+N". */
  max?: number;
  size?: number;
  className?: string;
}

/**
 * Cápsula de insígnias de ginásio oficiais do Serebii (01.gif a 08.gif).
 * Desenhada com o exato mesmo estilo visual da caixa de equipe Pokémon.
 */
export function BadgeStrip({ count, max = 3, size = 15, className = '' }: Props) {
  // Se ainda não conquistou nenhuma insígnia, não renderiza absolutamente nada
  if (!count || count < 1) {
    return null;
  }

  const shownStart = Math.max(0, count - max);
  const shown = Array.from({ length: Math.min(count, max) }, (_, i) => shownStart + i);
  const hidden = shownStart;

  return (
    <div
      className={`flex items-center gap-0.5 ml-0.5 bg-cream px-1.5 py-0.5 rounded-full border border-ink/10 shadow-2xs ${className}`}
      title={`${count} insígnia${count > 1 ? 's' : ''} de ginásio conquistada${count > 1 ? 's' : ''}!`}
      aria-label={`${count} insígnias de ginásio`}
    >
      {hidden > 0 && (
        <span className="text-[9px] font-black text-amber-800 pr-0.5 select-none">
          +{hidden}
        </span>
      )}
      {shown.map((i) => {
        const tier = getBadgeTier(i);
        const gifUrl = getBadgeGifUrl(i);
        const fallbackUrl = getBadgeFallbackGifUrl(i);

        return (
          <div
            key={`badge-${i}`}
            className="h-5 w-5 shrink-0 flex items-center justify-center overflow-hidden"
            title={`${tier.name} (${tier.gym})`}
          >
            <img
              src={gifUrl}
              alt={tier.name}
              onError={(e) => { e.currentTarget.src = fallbackUrl; }}
              style={{ width: size, height: size }}
              className="object-contain drop-shadow-2xs scale-105 transition-transform"
            />
          </div>
        );
      })}
    </div>
  );
}

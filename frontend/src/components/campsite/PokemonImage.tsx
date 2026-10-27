import { useState, useEffect } from 'react';
import { menuSprite, sleepSprite } from '../../lib/assets';
import { getPokemonShineClass } from '../../lib/pokemonShine';
import type { PokemonVariant, SleepStyle } from '../../types';

interface Props {
  pokemonId: number;
  style?: SleepStyle;
  variant?: PokemonVariant;
  /** Usa sempre o sprite de menu (ícones). */
  menu?: boolean;
  className?: string;
  alt?: string;
  silhouette?: boolean;
  /** Habilita a aura de brilho estelar (roxo para comum, dourado para lendário). Padrão: true */
  glow?: boolean;
}

/** Imagem de Pokémon com fallback: sleep -> menu -> oculta, com brilho Shiny roxo/dourado automático. */
export function PokemonImage({ pokemonId, style = 1, variant = 'regular', menu, className, alt = '', silhouette, glow = true }: Props) {
  const [stage, setStage] = useState(0);

  useEffect(() => {
    setStage(0);
  }, [pokemonId, style, variant, menu]);

  const sources = menu
    ? [menuSprite(pokemonId, variant), menuSprite(pokemonId, 'regular')]
    : [
        sleepSprite(pokemonId, style, variant),
        sleepSprite(pokemonId, style, 'regular'),
        menuSprite(pokemonId, variant),
        menuSprite(pokemonId, 'regular'),
      ];
  if (stage >= sources.length) return <div className={className} />;

  const shineClass = (glow && variant === 'shiny' && !silhouette)
    ? getPokemonShineClass(pokemonId, variant, Boolean(menu))
    : '';

  return (
    <img
      src={sources[stage]}
      alt={alt}
      draggable={false}
      onError={() => setStage((s) => s + 1)}
      className={`sprite ${shineClass} ${className ?? ''}`}
      style={silhouette ? { filter: 'brightness(0) opacity(0.35)' } : undefined}
    />
  );
}

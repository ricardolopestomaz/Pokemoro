import { useState, useEffect } from 'react';
import { menuSprite, sleepSprite } from '../../lib/assets';
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
}

/** Imagem de Pokémon com fallback: sleep -> menu -> oculta. */
export function PokemonImage({ pokemonId, style = 1, variant = 'regular', menu, className, alt = '', silhouette }: Props) {
  const [stage, setStage] = useState(0);

  useEffect(() => {
    setStage(0);
  }, [pokemonId, style, variant, menu]);

  const sources = menu
    ? [menuSprite(pokemonId, variant), menuSprite(pokemonId, 'regular')]
    : [sleepSprite(pokemonId, style, variant), menuSprite(pokemonId, variant), menuSprite(pokemonId, 'regular')];
  if (stage >= sources.length) return <div className={className} />;
  return (
    <img
      src={sources[stage]}
      alt={alt}
      draggable={false}
      onError={() => setStage((s) => s + 1)}
      className={`sprite ${className ?? ''}`}
      style={silhouette ? { filter: 'brightness(0) opacity(0.35)' } : undefined}
    />
  );
}

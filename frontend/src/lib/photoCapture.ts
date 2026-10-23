import { envUrl, sleepSprite } from './assets';
import type { SpawnedPokemon, UserPokemon } from '../types';

interface CaptureOptions {
  targetSpawn: SpawnedPokemon;
  allSpawns: SpawnedPokemon[];
  leader?: UserPokemon | null;
  environment: string;
}

function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    if (typeof Image === 'undefined') {
      resolve(null);
      return;
    }
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
    // Timeout de 2s para evitar bloqueio caso asset falhe
    setTimeout(() => resolve(null), 2000);
  });
}

/**
 * Cria uma fotografia autêntica da cena (snapshot real do acampamento).
 * Centrada no Pokémon fotografado, recortando o fundo exato e incluindo
 * outros Pokémon que estiverem dormindo próximos dentro do enquadramento.
 */
export async function captureScenePhoto({
  targetSpawn,
  allSpawns,
  leader,
  environment,
}: CaptureOptions): Promise<string> {
  if (typeof document === 'undefined') {
    return 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400"><rect width="400" height="400" fill="%2348d0b0"/></svg>';
  }

  const canvas = document.createElement('canvas');
  const size = 420;
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    return 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400"><rect width="400" height="400" fill="%2348d0b0"/></svg>';
  }

  // 1. Carrega o fundo do cenário ativo
  const bgImg = await loadImage(envUrl(environment));

  // O cenário de visualização mobile 9:16 tem dimensões relativas (largura W, altura H)
  // Usamos as dimensões naturais do fundo ou fallback 720x1280
  const bgW = bgImg?.naturalWidth || 720;
  const bgH = bgImg?.naturalHeight || 1280;

  // Enquadramento da câmera (zoom de ~40% da largura ao redor do alvo)
  const cropW = bgW * 0.44;
  const cropH = cropW; // Quadrado fotográfico perfeito

  const targetX = targetSpawn.canvasPosition.x * bgW;
  const targetY = targetSpawn.canvasPosition.y * bgH;

  const cropX = Math.max(0, Math.min(bgW - cropW, targetX - cropW / 2));
  const cropY = Math.max(0, Math.min(bgH - cropH, targetY - cropH / 2));

  // Desenha o recorte exato do cenário de fundo
  if (bgImg) {
    ctx.drawImage(bgImg, cropX, cropY, cropW, cropH, 0, 0, size, size);
  } else {
    // Gradiente suave de fallback baseado no ambiente
    const grad = ctx.createLinearGradient(0, 0, 0, size);
    grad.addColorStop(0, '#7ce8c0');
    grad.addColorStop(1, '#38a38c');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);
  }

  // 2. Coleta todos os Pokémon presentes no acampamento para renderizar na foto
  interface SpriteItem {
    id: number;
    style: 1 | 2 | 3;
    variant: 'regular' | 'shiny';
    x: number;
    y: number;
    scale: number;
    isTarget: boolean;
  }

  const itemsToRender: SpriteItem[] = [];

  // Adiciona o Líder caso esteja no centro do cenário (x: 0.50, y: 0.50)
  if (leader) {
    itemsToRender.push({
      id: leader.pokemonId,
      style: 1,
      variant: leader.variant === 'shiny' ? 'shiny' : 'regular',
      x: 0.50 * bgW,
      y: 0.50 * bgH,
      scale: 1.25,
      isTarget: false,
    });
  }

  // Adiciona todos os spawns dormindo
  for (const s of allSpawns) {
    itemsToRender.push({
      id: s.pokemonId,
      style: s.sleepStyle,
      variant: s.variant === 'shiny' ? 'shiny' : 'regular',
      x: s.canvasPosition.x * bgW,
      y: s.canvasPosition.y * bgH,
      scale: s.spawnId === targetSpawn.spawnId ? 1.15 : 0.95,
      isTarget: s.spawnId === targetSpawn.spawnId,
    });
  }

  // Filtra apenas os que estão dentro do enquadramento (com margem de tolerância)
  const margin = cropW * 0.35;
  const visibleItems = itemsToRender.filter((it) => {
    return (
      it.x >= cropX - margin &&
      it.x <= cropX + cropW + margin &&
      it.y >= cropY - margin &&
      it.y <= cropY + cropH + margin
    );
  });

  // Ordena por coordenada Y para profundidade realista (os mais abaixo ficam na frente)
  visibleItems.sort((a, b) => a.y - b.y);

  // Carrega e desenha cada Pokémon na coordenada relativa do enquadramento
  for (const item of visibleItems) {
    const spriteUrl = sleepSprite(item.id, item.style, item.variant);
    const spriteImg = await loadImage(spriteUrl);

    if (spriteImg) {
      // Posição no canvas [0, size]
      const canvasX = ((item.x - cropX) / cropW) * size;
      const canvasY = ((item.y - cropY) / cropH) * size;
      const spriteW = (size * 0.42) * item.scale;
      const spriteH = (spriteW / (spriteImg.naturalWidth || 1)) * (spriteImg.naturalHeight || 1);

      ctx.save();
      // Sombra suave sob o sprite
      ctx.shadowColor = 'rgba(0, 0, 0, 0.28)';
      ctx.shadowBlur = 12;
      ctx.shadowOffsetY = 6;
      ctx.drawImage(
        spriteImg,
        canvasX - spriteW / 2,
        canvasY - spriteH / 2,
        spriteW,
        spriteH
      );
      ctx.restore();
    }
  }

  // 3. Efeito estético de vinheta suave fotográfica
  const vignette = ctx.createRadialGradient(
    size / 2, size / 2, size * 0.35,
    size / 2, size / 2, size * 0.72
  );
  vignette.addColorStop(0, 'rgba(255, 255, 255, 0)');
  vignette.addColorStop(0.7, 'rgba(0, 0, 0, 0.04)');
  vignette.addColorStop(1, 'rgba(0, 0, 0, 0.22)');
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, size, size);

  // 4. Marca d'água sutil no canto da foto (estilo Poké-Lente)
  ctx.font = 'bold 11px system-ui, sans-serif';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
  ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
  ctx.shadowBlur = 4;
  ctx.fillText('📷 Pokémoro Cam', 12, size - 14);

  try {
    return canvas.toDataURL('image/jpeg', 0.88);
  } catch {
    return 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400"><rect width="400" height="400" fill="%2348d0b0"/></svg>';
  }
}

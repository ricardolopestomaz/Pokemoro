/**
 * Gerador de Cartão Postal & Stories para Instagram / WhatsApp (Resolução 1080x1920).
 * Renderiza um card comemorativo em alta resolução via HTML5 Canvas para compartilhamento visual.
 */

import type { PokemonVariant } from '../types';

export interface StoryCardData {
  pokemonId: number;
  nickname: string;
  variant: PokemonVariant;
  minutesToday: number;
  streakDays: number;
  subjectName?: string;
  dateStr?: string;
}

export async function generateStudyStoryCard(data: StoryCardData): Promise<string> {
  const width = 1080;
  const height = 1920;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Não foi possível inicializar o canvas.');

  // 1. Fundo Gradiente Cósmico de Noite / Aurora
  const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
  bgGrad.addColorStop(0, '#090d16');
  bgGrad.addColorStop(0.3, '#111827');
  bgGrad.addColorStop(0.7, '#1e1b4b');
  bgGrad.addColorStop(1, '#064e3b');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, width, height);

  // 2. Partículas e Estrelas de Foco
  ctx.fillStyle = '#ffffff';
  for (let i = 0; i < 70; i++) {
    const x = (i * 137.5) % width;
    const y = (i * 243.7) % (height * 0.7);
    const r = (i % 3) + 1.2;
    ctx.globalAlpha = 0.2 + (i % 5) * 0.15;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1.0;

  // 3. Moldura Central Estilo Cartão Postal
  const pad = 80;
  ctx.save();
  ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
  ctx.shadowBlur = 40;
  ctx.shadowOffsetY = 20;

  ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
  roundRect(ctx, pad, 140, width - pad * 2, height - 280, 56);
  ctx.fill();
  ctx.restore();

  // Borda decorativa interna
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 4;
  roundRect(ctx, pad + 24, 164, width - (pad + 24) * 2, height - 328, 44);
  ctx.stroke();

  // 4. Cabeçalho Pokémoro
  ctx.textAlign = 'center';
  ctx.fillStyle = '#0f172a';
  ctx.font = '900 48px system-ui, -apple-system, sans-serif';
  ctx.fillText('POKÉMORO', width / 2, 260);

  ctx.fillStyle = '#64748b';
  ctx.font = '700 24px system-ui, -apple-system, sans-serif';
  ctx.fillText('REGISTRO OFICIAL DE ESTUDOS · FOCUS DEX', width / 2, 305);

  // 5. Carregar e Desenhar Sprite do Parceiro
  const paddedId = String(data.pokemonId).padStart(4, '0');
  const shinySuffix = data.variant === 'shiny' ? '_s' : '';
  const spriteUrl = `/sprites/sleep/${data.variant}/${paddedId}-1${shinySuffix}.png`;

  try {
    const img = await loadImage(spriteUrl);
    const spriteBoxSize = 420;
    const spriteX = (width - spriteBoxSize) / 2;
    const spriteY = 360;

    // Fundo do círculo do parceiro
    ctx.fillStyle = '#f1f5f9';
    ctx.beginPath();
    ctx.arc(width / 2, spriteY + spriteBoxSize / 2, spriteBoxSize / 2 - 10, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 6;
    ctx.stroke();

    ctx.drawImage(img, spriteX + 20, spriteY + 20, spriteBoxSize - 40, spriteBoxSize - 40);
  } catch {}

  // 6. Nome do Parceiro
  ctx.fillStyle = '#0f172a';
  ctx.font = '900 44px system-ui, -apple-system, sans-serif';
  ctx.fillText(data.nickname, width / 2, 850);

  ctx.fillStyle = '#059669';
  ctx.font = '800 24px system-ui, -apple-system, sans-serif';
  ctx.fillText('★ Study Buddy Dedicado ★', width / 2, 895);

  // 7. Bloco de Destaque: Minutos de Foco
  const statBoxY = 960;
  const statBoxH = 260;
  ctx.fillStyle = '#f8fafc';
  roundRect(ctx, pad + 60, statBoxY, width - (pad + 60) * 2, statBoxH, 36);
  ctx.fill();
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 3;
  ctx.stroke();

  ctx.fillStyle = '#64748b';
  ctx.font = '700 24px system-ui, -apple-system, sans-serif';
  ctx.fillText('TEMPO TOTAL DE FOCO REGISTRADO', width / 2, statBoxY + 65);

  ctx.fillStyle = '#0f172a';
  ctx.font = '900 100px system-ui, -apple-system, sans-serif';
  ctx.fillText(`${data.minutesToday} min`, width / 2, statBoxY + 175);

  // 8. Badges Inferiores: Ofensiva e Matéria
  const badgeY = 1270;
  const badgeW = 380;
  const badgeH = 130;

  // Badge Ofensiva
  ctx.fillStyle = '#fff7ed';
  roundRect(ctx, width / 2 - badgeW - 20, badgeY, badgeW, badgeH, 28);
  ctx.fill();
  ctx.strokeStyle = '#fed7aa';
  ctx.lineWidth = 3;
  ctx.stroke();

  ctx.fillStyle = '#c2410c';
  ctx.font = '900 40px system-ui, -apple-system, sans-serif';
  ctx.fillText(`🔥 ${data.streakDays} Dias`, width / 2 - badgeW / 2 - 20, badgeY + 65);
  ctx.fillStyle = '#ea580c';
  ctx.font = '700 20px system-ui, -apple-system, sans-serif';
  ctx.fillText('Ofensiva Ativa', width / 2 - badgeW / 2 - 20, badgeY + 100);

  // Badge Matéria
  ctx.fillStyle = '#ecfdf5';
  roundRect(ctx, width / 2 + 20, badgeY, badgeW, badgeH, 28);
  ctx.fill();
  ctx.strokeStyle = '#a7f3d0';
  ctx.lineWidth = 3;
  ctx.stroke();

  ctx.fillStyle = '#047857';
  ctx.font = '900 36px system-ui, -apple-system, sans-serif';
  ctx.fillText(`📚 ${data.subjectName || 'Geral'}`, width / 2 + badgeW / 2 + 20, badgeY + 65);
  ctx.fillStyle = '#059669';
  ctx.font = '700 20px system-ui, -apple-system, sans-serif';
  ctx.fillText('Disciplina de Estudo', width / 2 + badgeW / 2 + 20, badgeY + 100);

  // 9. Mensagem Inspiradora e Rodapé
  ctx.fillStyle = '#475569';
  ctx.font = 'italic 600 26px system-ui, -apple-system, sans-serif';
  ctx.fillText('"A constância de hoje constrói o seu amanhã."', width / 2, 1480);

  const now = new Date();
  const dateStr = data.dateStr || `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`;
  ctx.fillStyle = '#94a3b8';
  ctx.font = '700 22px system-ui, -apple-system, sans-serif';
  ctx.fillText(`Emitido em ${dateStr} · Pokémoro`, width / 2, 1540);

  return canvas.toDataURL('image/png');
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

export async function shareOrDownloadStory(dataUrl: string, filename = 'pokemoro-conquista.png'): Promise<void> {
  // Tenta compartilhar nativamente no celular via Web Share API
  if (navigator.share && navigator.canShare) {
    try {
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      const file = new File([blob], filename, { type: 'image/png' });
      if (navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: 'Minha Conquista no Pokémoro! 💤',
          text: 'Olha quanto tempo eu estudei com meu parceiro no Pokémoro!',
        });
        return;
      }
    } catch {}
  }

  // Fallback: download direto do arquivo .png
  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

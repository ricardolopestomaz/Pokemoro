/**
 * Player de Áudio Oficial do Dia do Magikarp
 * Reproduz o som oficial do Magikarp e o rugido do Gyarados via Web Audio / HTML5 Audio
 */

let magikarpAudio: HTMLAudioElement | null = null;
let gyaradosAudio: HTMLAudioElement | null = null;

export function playMagikarpCry(volume = 0.8) {
  try {
    if (!magikarpAudio) {
      magikarpAudio = new Audio('/assets/magikarp_cry.ogg');
    }
    magikarpAudio.volume = Math.max(0, Math.min(1, volume));
    magikarpAudio.currentTime = 0;
    void magikarpAudio.play().catch(() => {});
  } catch {}
}

export function playGyaradosCry(volume = 1.0) {
  try {
    if (!gyaradosAudio) {
      gyaradosAudio = new Audio('/assets/gyarados_cry.ogg');
    }
    gyaradosAudio.volume = Math.max(0, Math.min(1, volume));
    gyaradosAudio.currentTime = 0;
    void gyaradosAudio.play().catch(() => {});
  } catch {}
}

import { Zap, AlertTriangle, Moon } from 'lucide-react';

interface Props { deepFocus: boolean; isOut: boolean; graceLeft: number }

export function DeepFocusBadge({ deepFocus, isOut, graceLeft }: Props) {
  if (!deepFocus) {
    return (
      <div id="badge-focus-normal" className="flex items-center gap-1.5 rounded-full bg-white/20 px-4 py-1.5 text-xs font-black text-white ring-2 ring-white/40">
        <Moon size={14} /> Foco Normal 1.0x · Parceiro Distraído 😴
      </div>
    );
  }
  if (isOut) {
    return (
      <div id="badge-grace" className="flex items-center gap-1.5 rounded-full bg-warm-orange px-4 py-1.5 text-xs font-black text-white shadow-lg">
        <AlertTriangle size={14} /> Volte ao app! Tolerância: {graceLeft}s
      </div>
    );
  }
  return (
    <div id="badge-deep-focus" className="deep-glow flex items-center gap-1.5 rounded-full bg-leaf px-4 py-1.5 text-xs font-black text-white">
      <Zap size={14} fill="currentColor" /> Deep Focus 1.2x Ativo ⚡
    </div>
  );
}

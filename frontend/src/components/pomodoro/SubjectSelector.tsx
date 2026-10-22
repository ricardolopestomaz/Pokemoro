import { useState } from 'react';
import { Plus } from 'lucide-react';
import { api } from '../../api/endpoints';
import { useGame } from '../../hooks/useGameState';
import { sfx } from '../../lib/sfx';

const COLORS = ['#48d0b0', '#4fc3f7', '#ff8c42', '#ff5b84', '#a78bfa', '#ffcb05'];

interface Props { value: string | null; onChange: (id: string) => void; disabled?: boolean }

export function SubjectSelector({ value, onChange, disabled }: Props) {
  const { subjects, refreshSubjects, toast } = useGame();
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState('');

  const add = async () => {
    const n = name.trim();
    if (!n) return;
    try {
      const created = await api.createSubject(n, COLORS[subjects.length % COLORS.length]);
      await refreshSubjects();
      onChange(created.id);
      setName('');
      setAdding(false);
      sfx.tap();
    } catch (e) {
      toast((e as Error).message, 'error');
    }
  };

  return (
    <div className="w-full">
      <div className="mb-1.5 text-[11px] font-black uppercase tracking-wider text-white/70">Matéria</div>
      <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
        {subjects.map((s) => {
          const active = s.id === value;
          return (
            <button
              key={s.id}
              disabled={disabled}
              onClick={() => { sfx.tap(); onChange(s.id); }}
              className="flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-black transition-all active:scale-95 disabled:opacity-60"
              style={{ background: active ? '#fff' : 'rgba(255,255,255,0.16)', color: active ? '#2b3a67' : '#fff', boxShadow: active ? `0 0 0 3px ${s.color}` : 'none' }}
            >
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: s.color }} />
              {s.name}
              {!!s.totalMinutes && <span className="opacity-60">· {s.totalMinutes}m</span>}
            </button>
          );
        })}
        {!adding && (
          <button id="btn-add-subject" disabled={disabled} onClick={() => setAdding(true)} className="flex shrink-0 items-center gap-1 rounded-full border-2 border-dashed border-white/60 px-3 py-1.5 text-xs font-black text-white active:scale-95">
            <Plus size={14} /> Nova
          </button>
        )}
      </div>
      {adding && (
        <div className="mt-2 flex gap-2">
          <input
            id="input-subject"
            autoFocus
            value={name}
            maxLength={30}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && add()}
            placeholder="Ex: Matemática, Direito..."
            className="min-w-0 flex-1 rounded-full bg-white px-4 py-2 text-sm font-bold text-ink outline-none ring-2 ring-transparent focus:ring-sleep-yellow"
          />
          <button id="btn-save-subject" className="btn btn-green !px-4 !py-2 text-sm" onClick={add}>Criar</button>
        </div>
      )}
    </div>
  );
}

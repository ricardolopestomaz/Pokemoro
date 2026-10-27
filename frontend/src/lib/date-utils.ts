/**
 * Utilitários de Data, Divisão Dinâmica de Sessões de Estudo e Regra de Ofensiva (Estilo Duolingo).
 */

export interface DaySplit {
  dateStr: string; // 'YYYY-MM-DD' no fuso horário local
  minutes: number;
}

/**
 * Retorna uma data no formato 'YYYY-MM-DD' usando o calendário local do usuário
 * (evita bugs de fuso horário causados por toISOString()).
 */
export function formatLocalDate(date?: Date | string | number): string {
  const d = date ? new Date(date) : new Date();
  if (isNaN(d.getTime())) return '';
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Calcula a diferença em dias de calendário inteiros entre duas datas 'YYYY-MM-DD'.
 * Exemplo: '2026-10-24' para '2026-10-25' => 1 dia.
 */
export function getDaysDifference(fromDateStr: string, toDateStr: string): number {
  if (!fromDateStr || !toDateStr) return 0;
  const [y1, m1, d1] = fromDateStr.split('-').map(Number);
  const [y2, m2, d2] = toDateStr.split('-').map(Number);
  const dt1 = new Date(y1, m1 - 1, d1);
  const dt2 = new Date(y2, m2 - 1, d2);
  const diffTime = dt2.getTime() - dt1.getTime();
  return Math.round(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Divide dinamicamente uma sessão de estudo entre os dias de calendário que ela atravessa.
 * Exemplo: Uma sessão que começou sábado às 23:45 e terminou domingo às 00:15 (30 min total)
 * terá exatamente 15 min computados para o sábado e 15 min computados para o domingo.
 */
export function splitSessionAcrossDays(session: {
  startedAt?: string | Date | number;
  completedAt?: string | Date | number;
  actualDurationMinutes?: number;
}): DaySplit[] {
  const durationMins = Math.max(0, Number(session.actualDurationMinutes) || 0);
  if (durationMins <= 0) return [];

  const completed = session.completedAt ? new Date(session.completedAt) : new Date();
  const started = session.startedAt
    ? new Date(session.startedAt)
    : new Date(completed.getTime() - durationMins * 60000);

  const startMs = started.getTime();
  const endMs = completed.getTime();

  // Fallback se timestamps forem inválidos ou invertidos
  if (isNaN(startMs) || isNaN(endMs) || endMs <= startMs) {
    return [{ dateStr: formatLocalDate(completed), minutes: durationMins }];
  }

  const splits: DaySplit[] = [];
  let curr = new Date(started);

  while (curr < completed) {
    const dateStr = formatLocalDate(curr);

    // Próxima meia-noite local (00:00:00 do dia seguinte)
    const nextMidnight = new Date(curr.getFullYear(), curr.getMonth(), curr.getDate() + 1, 0, 0, 0, 0);
    const segmentEnd = completed < nextMidnight ? completed : nextMidnight;

    const segmentMs = Math.max(0, segmentEnd.getTime() - curr.getTime());
    const rawMinutes = segmentMs / 60000;

    if (rawMinutes > 0) {
      splits.push({
        dateStr,
        minutes: rawMinutes,
      });
    }

    curr = nextMidnight;
  }

  if (splits.length === 0) {
    return [{ dateStr: formatLocalDate(completed), minutes: durationMins }];
  }

  // Normaliza os minutos proporcionalmente para casar exatamente com durationMins
  const sumRaw = splits.reduce((acc, s) => acc + s.minutes, 0);
  if (sumRaw > 0 && Math.abs(sumRaw - durationMins) > 0.01) {
    const ratio = durationMins / sumRaw;
    let accumulated = 0;
    return splits.map((s, idx) => {
      if (idx === splits.length - 1) {
        return {
          dateStr: s.dateStr,
          minutes: Math.max(0, durationMins - accumulated),
        };
      }
      const rounded = Math.round(s.minutes * ratio);
      accumulated += rounded;
      return {
        dateStr: s.dateStr,
        minutes: rounded,
      };
    });
  }

  return splits.map((s) => ({
    dateStr: s.dateStr,
    minutes: Math.round(s.minutes),
  }));
}

/**
 * Avalia a evolução da Ofensiva (Streak) conforme a regra oficial tipo Duolingo:
 * 1. A sessão é sempre creditada ao dia de INÍCIO do estudo (se começou sábado, salva o sábado).
 * 2. O dia seguinte (domingo) NÃO é contado ainda ("o fogo n vai ser contado ainda"), exigindo
 *    uma sessão iniciada no domingo para avançar a sequência daquele dia.
 * 3. Se a pessoa ficou mais de 1 dia inteiro sem estudar (ontem foi pulado), o streak zera.
 */
export function evaluateStreakOnSession(
  currentStreak: number,
  lastStudyDate: string | null,
  sessionStartDateStr: string,
  qualifies: boolean
): {
  newStreak: number;
  streakKept: boolean;
  newLastStudyDate: string | null;
} {
  if (!qualifies) {
    return {
      newStreak: currentStreak,
      streakKept: false,
      newLastStudyDate: lastStudyDate,
    };
  }

  if (!lastStudyDate) {
    return {
      newStreak: 1,
      streakKept: true,
      newLastStudyDate: sessionStartDateStr,
    };
  }

  const diffDays = getDaysDifference(lastStudyDate, sessionStartDateStr);

  if (diffDays === 0) {
    // Já havia completado a meta neste dia! Mantém a sequência
    return {
      newStreak: currentStreak,
      streakKept: true,
      newLastStudyDate: sessionStartDateStr,
    };
  } else if (diffDays === 1) {
    // Dia imediatamente consecutivo (ex: estudou ontem e agora estudou hoje) -> Ofensiva cresce!
    return {
      newStreak: currentStreak + 1,
      streakKept: true,
      newLastStudyDate: sessionStartDateStr,
    };
  } else if (diffDays > 1) {
    // Pulou um ou mais dias inteiros -> quebrou a sequência, recomeça em 1
    return {
      newStreak: 1,
      streakKept: false,
      newLastStudyDate: sessionStartDateStr,
    };
  } else {
    // Sessão com data anterior à última registrada
    return {
      newStreak: currentStreak,
      streakKept: true,
      newLastStudyDate: lastStudyDate,
    };
  }
}

/**
 * Verifica se a ofensiva foi quebrada porque o usuário não estudou ontem (ou antes).
 * Retorna true se passou a meia-noite e ontem não houve estudo.
 */
export function isStreakBroken(
  lastStudyDate: string | null,
  referenceDateStr: string = formatLocalDate(new Date())
): boolean {
  if (!lastStudyDate) return false;
  const diffDays = getDaysDifference(lastStudyDate, referenceDateStr);
  // diffDays === 0: Estudou hoje
  // diffDays === 1: Estudou ontem (hoje ainda está correndo até 23:59:59)
  // diffDays >= 2: O dia de ontem passou sem nenhum estudo -> Foguinho deve ser zerado!
  return diffDays > 1;
}

/**
 * Retorna o status visual do foguinho (Estilo Duolingo):
 * - activeToday: Usuário já estudou hoje, foguinho acesso/concluído!
 * - pendingToday: Estudou ontem, o foguinho ainda não foi conquistado hoje (precisa estudar hoje).
 * - isZero: Ofensiva está zerada.
 */
export function getStreakStatus(
  currentStreak: number,
  lastStudyDate: string | null,
  referenceDateStr: string = formatLocalDate(new Date())
): {
  activeToday: boolean;
  pendingToday: boolean;
  isZero: boolean;
  streakDays: number;
} {
  if (currentStreak <= 0 || !lastStudyDate || isStreakBroken(lastStudyDate, referenceDateStr)) {
    return {
      activeToday: false,
      pendingToday: false,
      isZero: true,
      streakDays: 0,
    };
  }

  const diffDays = getDaysDifference(lastStudyDate, referenceDateStr);
  if (diffDays === 0) {
    return {
      activeToday: true,
      pendingToday: false,
      isZero: false,
      streakDays: currentStreak,
    };
  }

  // diffDays === 1: ontem foi estudado, hoje ainda está pendente
  return {
    activeToday: false,
    pendingToday: true,
    isZero: false,
    streakDays: currentStreak,
  };
}

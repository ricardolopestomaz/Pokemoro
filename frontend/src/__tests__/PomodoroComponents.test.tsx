import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CircularTimer } from '../components/pomodoro/CircularTimer';
import { DeepFocusBadge } from '../components/pomodoro/DeepFocusBadge';
import { SubjectSelector } from '../components/pomodoro/SubjectSelector';

// Mock do useGame para o SubjectSelector
const mockSubjects = [
  { id: 'sub-1', userId: 'user-1', name: 'Matemática', color: '#48d0b0', totalMinutes: 50, createdAt: '' },
  { id: 'sub-2', userId: 'user-1', name: 'História', color: '#ff8c42', totalMinutes: 25, createdAt: '' },
];
const mockRefreshSubjects = vi.fn();
const mockToast = vi.fn();

vi.mock('../hooks/useGameState', () => ({
  useGame: () => ({
    subjects: mockSubjects,
    refreshSubjects: mockRefreshSubjects,
    toast: mockToast,
  }),
}));

describe('components/pomodoro/CircularTimer', () => {
  it('deve renderizar o tempo formatado em MM:SS e a legenda', () => {
    render(
      <CircularTimer
        progress={0.5}
        seconds={1500}
        partnerId={25}
        distracted={false}
        running={true}
        caption="• • •  Focando  • • •"
      />
    );

    expect(screen.getByText('25')).toBeInTheDocument();
    expect(screen.getByText('00')).toBeInTheDocument();
    expect(screen.getByText('• • • Focando • • •')).toBeInTheDocument();
  });

  it('deve exibir o emoji de distração 💤 quando o usuário estiver distraído', () => {
    render(
      <CircularTimer
        progress={0.2}
        seconds={1200}
        partnerId={25}
        distracted={true}
        running={true}
        caption="Distraído"
      />
    );

    expect(screen.getByText('💤')).toBeInTheDocument();
  });
});

describe('components/pomodoro/DeepFocusBadge', () => {
  it('deve exibir badge verde "Deep Focus 1.2x Ativo ⚡" quando focado', () => {
    render(<DeepFocusBadge deepFocus={true} isOut={false} graceLeft={60} />);

    expect(screen.getByText(/Deep Focus 1\.2x Ativo ⚡/i)).toBeInTheDocument();
  });

  it('deve exibir aviso de retorno quando a aba estiver em segundo plano', () => {
    render(<DeepFocusBadge deepFocus={true} isOut={true} graceLeft={42} />);

    expect(screen.getByText(/Volte ao app! Tolerância: 42s/i)).toBeInTheDocument();
  });

  it('deve exibir "Foco Normal 1.0x" quando o tempo de tolerância expirar', () => {
    render(<DeepFocusBadge deepFocus={false} isOut={false} graceLeft={0} />);

    expect(screen.getByText(/Foco Normal 1\.0x/i)).toBeInTheDocument();
    expect(screen.getByText(/Parceiro Distraído 😴/i)).toBeInTheDocument();
  });
});

describe('components/pomodoro/SubjectSelector', () => {
  it('deve renderizar as matérias cadastradas', () => {
    const onChange = vi.fn();
    render(<SubjectSelector value="sub-1" onChange={onChange} />);

    expect(screen.getByText('Matemática')).toBeInTheDocument();
    expect(screen.getByText('História')).toBeInTheDocument();
  });

  it('deve chamar onChange ao clicar em uma matéria diferente', () => {
    const onChange = vi.fn();
    render(<SubjectSelector value="sub-1" onChange={onChange} />);

    fireEvent.click(screen.getByText('História'));
    expect(onChange).toHaveBeenCalledWith('sub-2');
  });

  it('deve permitir abrir o campo de criação de nova matéria', () => {
    const onChange = vi.fn();
    render(<SubjectSelector value="sub-1" onChange={onChange} />);

    const btnNova = screen.getByText(/Nova/i);
    fireEvent.click(btnNova);

    expect(screen.getByPlaceholderText(/Ex: Matemática, Direito/i)).toBeInTheDocument();
  });
});

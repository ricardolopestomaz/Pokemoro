import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { DiaryScreen } from '../components/diary/DiaryScreen';
import { api } from '../api/endpoints';
import type { Subject, UserProfile, CoffeeBreak } from '../types';

const mockSubjects: Subject[] = [
  { id: 'sub-1', name: 'Matemática', color: '#48D0B0', icon: 'book', totalMinutes: 120, createdAt: '' },
  { id: 'sub-2', name: 'História', color: '#FF8C42', icon: 'book', totalMinutes: 60, createdAt: '' },
];

const mockProfile: UserProfile = {
  id: 'u1',
  name: 'Ash Focado',
  email: '',
  streakDays: 5,
  lastStudyDate: '2026-10-22',
  focusCoins: 200,
  inventory: { basic: 2, great: 1, master: 0 },
  activeEnvironment: 'greengrass',
  activeTeamPokemonIds: [],
  createdAt: '',
};

const mockCoffeeBreak: CoffeeBreak = {
  sessionId: 's1',
  focusPower: 300,
  spawnsCount: 2,
  spawns: [],
  expiresAt: '',
};

const mockRefreshSubjects = vi.fn().mockResolvedValue(undefined);
const mockToast = vi.fn();

vi.mock('../hooks/useGameState', () => ({
  useGame: () => ({
    subjects: mockSubjects,
    profile: mockProfile,
    coffeeBreak: mockCoffeeBreak,
    refreshSubjects: mockRefreshSubjects,
    toast: mockToast,
  }),
}));

vi.mock('../api/endpoints', () => ({
  api: {
    recentSessions: vi.fn().mockResolvedValue([]),
    createSubject: vi.fn().mockResolvedValue({ id: 'sub-3', name: 'Física', color: '#4FC3F7' }),
    updateSubject: vi.fn().mockResolvedValue({ id: 'sub-1', name: 'Matemática Pura', color: '#FF5B84' }),
    deleteSubject: vi.fn().mockResolvedValue(true),
  },
}));

describe('components/diary/DiaryScreen', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deve renderizar o título, resumo de horas e poder de foco', () => {
    render(<DiaryScreen />);

    expect(screen.getByText('Diário de Foco')).toBeInTheDocument();
    expect(screen.getByText('3.0h')).toBeInTheDocument(); // 180 min = 3.0h
    expect(screen.getByText('300')).toBeInTheDocument(); // Poder de foco
    expect(screen.getByText('5d')).toBeInTheDocument(); // Streak
  });

  it('deve listar as matérias cadastradas com minutos e porcentagens', () => {
    render(<DiaryScreen />);

    expect(screen.getAllByText('Matemática').length).toBeGreaterThanOrEqual(2);
    expect(screen.getAllByText('História').length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText('120 min acumulados')).toBeInTheDocument();
    expect(screen.getByText('60 min acumulados')).toBeInTheDocument();
  });

  it('deve abrir modal de criação de matéria e chamar api.createSubject', async () => {
    render(<DiaryScreen />);

    const btnNew = screen.getByRole('button', { name: /Nova Matéria/i });
    fireEvent.click(btnNew);

    expect(screen.getByText('Nova Matéria de Estudo')).toBeInTheDocument();

    const inputName = screen.getByPlaceholderText(/Ex: Direito Constitucional/i);
    fireEvent.change(inputName, { target: { value: 'Física Quântica' } });

    const btnConfirm = screen.getByRole('button', { name: /Criar Matéria/i });
    fireEvent.click(btnConfirm);

    await waitFor(() => {
      expect(api.createSubject).toHaveBeenCalledWith('Física Quântica', expect.any(String));
      expect(mockRefreshSubjects).toHaveBeenCalled();
      expect(mockToast).toHaveBeenCalledWith('Matéria criada com sucesso!', 'ok');
    });
  });

  it('deve abrir modal de edição e chamar api.updateSubject ao salvar', async () => {
    render(<DiaryScreen />);

    const btnEdit = screen.getByLabelText('Editar Matemática');
    fireEvent.click(btnEdit);

    expect(screen.getByText('Editar Matéria')).toBeInTheDocument();

    const inputName = screen.getByDisplayValue('Matemática');
    fireEvent.change(inputName, { target: { value: 'Matemática Pura' } });

    const btnSave = screen.getByRole('button', { name: /Salvar Alterações/i });
    fireEvent.click(btnSave);

    await waitFor(() => {
      expect(api.updateSubject).toHaveBeenCalledWith('sub-1', {
        name: 'Matemática Pura',
        color: expect.any(String),
      });
      expect(mockRefreshSubjects).toHaveBeenCalled();
    });
  });

  it('deve abrir modal de confirmação e chamar api.deleteSubject ao confirmar exclusão', async () => {
    render(<DiaryScreen />);

    const btnDelete = screen.getByLabelText('Excluir Matemática');
    fireEvent.click(btnDelete);

    expect(screen.getByText('Excluir Matéria?')).toBeInTheDocument();

    const btnConfirmDelete = screen.getByRole('button', { name: /Sim, Excluir/i });
    fireEvent.click(btnConfirmDelete);

    await waitFor(() => {
      expect(api.deleteSubject).toHaveBeenCalledWith('sub-1');
      expect(mockRefreshSubjects).toHaveBeenCalled();
      expect(mockToast).toHaveBeenCalledWith('Matéria excluída com sucesso!', 'ok');
    });
  });
});

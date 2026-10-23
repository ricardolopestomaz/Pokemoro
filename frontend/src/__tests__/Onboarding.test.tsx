import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { OnboardingModal } from '../components/onboarding/OnboardingModal';
import { api } from '../api/endpoints';

vi.mock('../api/endpoints', () => ({
  api: {
    completeOnboarding: vi.fn(),
    getProfile: vi.fn(),
  },
}));

vi.mock('canvas-confetti', () => ({
  default: vi.fn(),
}));

vi.mock('../lib/sfx', () => ({
  sfx: {
    tap: vi.fn(),
    fanfare: vi.fn(),
  },
}));

describe('OnboardingModal - Professor Ricardo', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deve renderizar a introdução do Professor Ricardo e pedir o nome do estudante', async () => {
    const onCompleted = vi.fn();
    render(<OnboardingModal onCompleted={onCompleted} />);

    expect(screen.getByText('Professor Ricardo')).toBeInTheDocument();
    expect(screen.getByText(/Laboratório Pokémoro/i)).toBeInTheDocument();

    const input = screen.getByPlaceholderText(/Digite seu nome de estudante/i);
    expect(input).toBeInTheDocument();

    const confirmBtn = screen.getByRole('button', { name: /Confirmar Nome/i });
    expect(confirmBtn).toBeDisabled();

    // Digita o nome do treinador
    fireEvent.change(input, { target: { value: 'Ash Ketchum' } });
    expect(confirmBtn).not.toBeDisabled();
  });

  it('deve reagir com amor especial quando o nome for Julya (ou variações como júlya)', async () => {
    const onCompleted = vi.fn();
    render(<OnboardingModal onCompleted={onCompleted} />);

    const input = screen.getByPlaceholderText(/Digite seu nome de estudante/i);
    fireEvent.change(input, { target: { value: 'júlya' } });
    fireEvent.click(screen.getByRole('button', { name: /Confirmar Nome/i }));

    // Passo 1: Reação ao nome especial
    await waitFor(() => {
      expect(screen.getByText(/Professor Ricardo ❤️/i)).toBeInTheDocument();
    });

    // Clica para adiantar instantaneamente a digitação
    fireEvent.click(screen.getByText(/Professor Ricardo ❤️/i));

    await waitFor(() => {
      expect(screen.getByText(/mulher que eu mais amo em todo o mundo/i)).toBeInTheDocument();
    });
  });

  it('deve ensinar a criar matéria, entrar em foco, dar biscoito e montar equipe antes de entregar o Caterpie', async () => {
    const onCompleted = vi.fn();
    (api.completeOnboarding as any).mockResolvedValue({
      id: 'local-student-01',
      name: 'Ash',
      hasCompletedOnboarding: true,
    });
    (api.getProfile as any).mockResolvedValue({
      id: 'local-student-01',
      name: 'Ash',
      hasCompletedOnboarding: true,
    });

    render(<OnboardingModal onCompleted={onCompleted} />);

    // Passo 0: Nome
    fireEvent.change(screen.getByPlaceholderText(/Digite seu nome de estudante/i), {
      target: { value: 'Ash' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Confirmar Nome/i }));

    // Passo 1: Boas-vindas
    await waitFor(() => screen.getByRole('button', { name: /Como Funciona\?/i }));
    fireEvent.click(screen.getByRole('button', { name: /Como Funciona\?/i }));

    // Passo 2: Criar matéria e Entrar em Foco (mencionando segundo plano)
    await waitFor(() => screen.getByRole('button', { name: /E os Pokémon\?/i }));
    fireEvent.click(screen.getByRole('button', { name: /E os Pokémon\?/i }));

    // Passo 3: Dar Biscoitos e Colocar na Equipe
    await waitFor(() => screen.getByRole('button', { name: /A História da Folga/i }));
    fireEvent.click(screen.getByRole('button', { name: /A História da Folga/i }));

    // Passo 4: Julya e Caterpie
    await waitFor(() => screen.getByText(/Receber Caterpie e Começar!/i));
    fireEvent.click(screen.getByText(/Receber Caterpie e Começar!/i));

    expect(api.completeOnboarding).toHaveBeenCalledWith('Ash');

    // Card de celebração
    await waitFor(() => {
      expect(screen.getByText(/Caterpie #0010/i)).toBeInTheDocument();
      expect(screen.getByText(/Líder da Equipe de Estudos/i)).toBeInTheDocument();
      expect(screen.getByText(/\+3 Biscoitos de Café Básicos/i)).toBeInTheDocument();
    });

    const startBtn = screen.getByRole('button', { name: /Começar Estudos no Pokémoro!/i });
    fireEvent.click(startBtn);

    await waitFor(() => {
      expect(onCompleted).toHaveBeenCalled();
    });
  });
});

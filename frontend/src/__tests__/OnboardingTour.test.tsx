import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { OnboardingTour } from '../components/onboarding/OnboardingTour';
import { api } from '../api/endpoints';

vi.mock('../api/endpoints', () => ({
  api: {
    completeOnboarding: vi.fn(),
  },
}));

vi.mock('../lib/sfx', () => ({
  sfx: {
    tap: vi.fn(),
    start: vi.fn(),
    bell: vi.fn(),
    camera: vi.fn(),
    munch: vi.fn(),
    fanfare: vi.fn(),
  },
}));

vi.mock('canvas-confetti', () => ({
  default: vi.fn(),
}));

describe('OnboardingTour — Tutorial Guiado do Professor Ricardo', () => {
  const mockSetTab = vi.fn();
  const mockTourTimer = vi.fn();
  const mockOnCompleted = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (api.completeOnboarding as any).mockResolvedValue({
      id: 'u1',
      name: 'Ash',
      hasCompletedOnboarding: true,
    });
  });

  it('deve renderizar a lore clássica sobre o campo eletromagnético do sono e concentração humana', () => {
    render(
      <OnboardingTour
        onSetTab={mockSetTab}
        onTourTimer={mockTourTimer}
        onCompleted={mockOnCompleted}
      />
    );

    // Etapa 1: Apresentação clássica do mundo Pokémon
    expect(screen.getByText(/campo eletromagnético do sono e da concentração humana/i)).toBeInTheDocument();

    // Avança para etapa 2
    fireEvent.click(screen.getByText(/Próximo ▶/i));

    // Etapa 2: Explicação do Deep Focus atraindo Pokémon
    expect(screen.getByText(/Foco Profundo \(Deep Focus\)/i)).toBeInTheDocument();
    expect(screen.getByText(/ondas cerebrais entram em ressonância/i)).toBeInTheDocument();

    // Avança para etapa 3: Kauan e entrada do nome
    fireEvent.click(screen.getByText(/Próximo ▶/i));
    expect(screen.getByText(/assistente anterior, o Kauan/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Digite seu nome de pesquisador/i)).toBeInTheDocument();
  });

  it('deve permitir confirmar o nome e ir para o teste prático de 10s', () => {
    render(
      <OnboardingTour
        onSetTab={mockSetTab}
        onTourTimer={mockTourTimer}
        onCompleted={mockOnCompleted}
      />
    );

    // Avança até o nome
    fireEvent.click(screen.getByText(/Próximo ▶/i));
    fireEvent.click(screen.getByText(/Próximo ▶/i));

    const input = screen.getByPlaceholderText(/Digite seu nome de pesquisador/i);
    fireEvent.change(input, { target: { value: 'Red' } });
    fireEvent.click(screen.getByText(/Confirmar Nome/i));

    // Entra na tela de Foco
    expect(mockSetTab).toHaveBeenCalledWith('focus');
    expect(screen.getByText(/iniciarmos nosso teste prático de 10 segundos/i)).toBeInTheDocument();
    expect(screen.getByText(/Iniciar Teste de 10s ⏱️/i)).toBeInTheDocument();
  });

  it('não deve avançar automaticamente após os 10s e deve pausar aguardando o clique do usuário', () => {
    vi.useFakeTimers();

    render(
      <OnboardingTour
        onSetTab={mockSetTab}
        onTourTimer={mockTourTimer}
        onCompleted={mockOnCompleted}
      />
    );

    // Vai até a tela de foco
    fireEvent.click(screen.getByText(/Próximo ▶/i));
    fireEvent.click(screen.getByText(/Próximo ▶/i));
    const input = screen.getByPlaceholderText(/Digite seu nome de pesquisador/i);
    fireEvent.change(input, { target: { value: 'Red' } });
    fireEvent.click(screen.getByText(/Confirmar Nome/i));

    // Inicia o teste de 10s
    fireEvent.click(screen.getByText(/Iniciar Teste de 10s ⏱️/i));
    expect(mockTourTimer).toHaveBeenCalledWith({ seconds: 0, running: true });

    // Avança 10 segundos no timer
    act(() => {
      vi.advanceTimersByTime(10000);
    });

    // O timer conclui e o texto de sucesso é exibido
    expect(screen.getByText(/Sessão de foco concluída com sucesso!/i)).toBeInTheDocument();
    const btnGoCampsite = screen.getByText(/Ir para o Acampamento 🏕️/i);
    expect(btnGoCampsite).toBeInTheDocument();

    // Avança mais 5 segundos no tempo para provar que NÃO AVANÇA SOZINHO
    act(() => {
      vi.advanceTimersByTime(5000);
    });
    // O botão ainda está presente e na mesma tela!
    expect(screen.getByText(/Ir para o Acampamento 🏕️/i)).toBeInTheDocument();

    // Usuário clica conscientemente para ir ao acampamento
    fireEvent.click(btnGoCampsite);
    expect(mockSetTab).toHaveBeenCalledWith('rest');

    vi.useRealTimers();
  });

  it('deve disparar foto com Polaroid e piada do Genival para Mr. Mime e Joelson para Slaking', async () => {
    vi.useFakeTimers();

    render(
      <OnboardingTour
        onSetTab={mockSetTab}
        onTourTimer={mockTourTimer}
        onCompleted={mockOnCompleted}
      />
    );

    // Navega até o acampamento
    fireEvent.click(screen.getByText(/Próximo ▶/i));
    fireEvent.click(screen.getByText(/Próximo ▶/i));
    fireEvent.change(screen.getByPlaceholderText(/Digite seu nome de pesquisador/i), { target: { value: 'Red' } });
    fireEvent.click(screen.getByText(/Confirmar Nome/i));
    fireEvent.click(screen.getByText(/Iniciar Teste de 10s ⏱️/i));

    // Conclui 10s de timer e avança conscientemente para o acampamento
    act(() => {
      vi.advanceTimersByTime(10000);
    });
    fireEvent.click(screen.getByText(/Ir para o Acampamento 🏕️/i));

    // Clica no Mr. Mime
    const mrMimeBtn = screen.getByLabelText(/Fotografar Mr. Mime/i);
    fireEvent.click(mrMimeBtn);

    // Abre o Polaroid do Mr. Mime com a piada do Genival
    expect(screen.getByText(/Pose Mímica Noturna 🎭/i)).toBeInTheDocument();
    expect(screen.getByText(/imitei meu amigo Genival, que perdeu o dedo/i)).toBeInTheDocument();

    // Registra na Dex e fecha Polaroid
    fireEvent.click(screen.getByText(/Registrar na Focus Dex 📸/i));

    // Agora é a vez do Slaking
    const slakingBtn = screen.getByLabelText(/Fotografar Slaking/i);
    fireEvent.click(slakingBtn);

    // Abre o Polaroid do Slaking com a piada do Joelson sem lençol
    expect(screen.getByText(/Pose Soneca Folgada 💤/i)).toBeInTheDocument();
    expect(screen.getByText(/dormir na casa do Joelson ele não oferece nem um lençol/i)).toBeInTheDocument();

    // Registra na Dex e fecha Polaroid
    fireEvent.click(screen.getByText(/Registrar na Focus Dex 📸/i));

    // Entra na etapa de Alimentação
    expect(screen.getByText(/alimentar os visitantes com Biscoitos de Café/i)).toBeInTheDocument();
    expect(screen.getByText(/Oferecer Biscoito de Teste 🍪/i)).toBeInTheDocument();

    // Alimenta o Slaking
    fireEvent.click(screen.getByText(/Oferecer Biscoito de Teste 🍪/i));
    expect(screen.getByText(/2\/5/)).toBeInTheDocument();
    expect(screen.getByText(/Quando todos os corações se completam, o Pokémon se torna seu Study Buddy/i)).toBeInTheDocument();

    vi.useRealTimers();
  });

  it('deve chamar api.completeOnboarding e onCompleted sem desabilitar indevidamente o botão Começar Aventura', async () => {
    vi.useFakeTimers();

    render(
      <OnboardingTour
        onSetTab={mockSetTab}
        onTourTimer={mockTourTimer}
        onCompleted={mockOnCompleted}
      />
    );

    // Navega rápido até a etapa final do Caterpie
    fireEvent.click(screen.getByText(/Próximo ▶/i));
    fireEvent.click(screen.getByText(/Próximo ▶/i));
    fireEvent.change(screen.getByPlaceholderText(/Digite seu nome de pesquisador/i), { target: { value: 'Ash' } });
    fireEvent.click(screen.getByText(/Confirmar Nome/i));
    fireEvent.click(screen.getByText(/Iniciar Teste de 10s ⏱️/i));

    // Conclui 10s e vai para o acampamento
    act(() => {
      vi.advanceTimersByTime(10000);
    });
    fireEvent.click(screen.getByText(/Ir para o Acampamento 🏕️/i));

    // Fotografa Mr. Mime
    fireEvent.click(screen.getByLabelText(/Fotografar Mr. Mime/i));
    fireEvent.click(screen.getByText(/Registrar na Focus Dex 📸/i));

    // Fotografa Slaking
    fireEvent.click(screen.getByLabelText(/Fotografar Slaking/i));
    fireEvent.click(screen.getByText(/Registrar na Focus Dex 📸/i));

    // Alimenta Slaking
    fireEvent.click(screen.getByText(/Oferecer Biscoito de Teste 🍪/i));
    fireEvent.click(screen.getByText(/Entendido! Continuar/i));

    // Navega pelas abas Diário -> Equipe -> Dex -> Caterpie
    fireEvent.click(screen.getByText(/Próximo ▶/i)); // diary
    fireEvent.click(screen.getByText(/Próximo ▶/i)); // team
    fireEvent.click(screen.getByText(/Receber Presente! 🎁/i)); // dex

    // Etapa Caterpie com menção à Julya
    expect(screen.getByText(/passar um tempo com o meu amor, a Julya ❤️/i)).toBeInTheDocument();
    fireEvent.click(screen.getByText(/Receber Caterpie e Começar! 🐛✨/i));

    // Abre o card de celebração com o Caterpie Líder
    expect(screen.getByText(/Caterpie #0010/i)).toBeInTheDocument();
    expect(screen.getByText(/Líder da Equipe \(Slot 1\)/i)).toBeInTheDocument();

    const startAdventureBtn = screen.getByText(/Começar a Aventura! 🏕️/i);
    expect(startAdventureBtn).not.toBeDisabled();

    // Clica no botão final
    await act(async () => {
      fireEvent.click(startAdventureBtn);
    });

    expect(api.completeOnboarding).toHaveBeenCalledWith('Ash');
    expect(mockOnCompleted).toHaveBeenCalled();

    vi.useRealTimers();
  });
});

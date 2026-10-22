import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TopHUD } from '../components/layout/TopHUD';
import { BottomNav } from '../components/layout/BottomNav';
import { ProfileModal } from '../components/profile/ProfileModal';
import type { UserProfile, CoffeeBreak, UserPokemon } from '../types';

const mockProfile: UserProfile = {
  id: 'u1',
  name: 'Ash Focado',
  email: '',
  streakDays: 7,
  lastStudyDate: '2026-10-22',
  focusCoins: 350,
  inventory: { basic: 4, great: 2, master: 1 },
  activeEnvironment: 'greengrass',
  activeTeamPokemonIds: [],
  createdAt: '',
};

const mockCoffeeBreak: CoffeeBreak = {
  sessionId: 's1',
  focusPower: 450,
  spawnsCount: 3,
  spawns: [],
  expiresAt: '',
};

const mockCollection: UserPokemon[] = [
  {
    id: 'poke-1',
    pokemonId: 25,
    pokemonName: 'Pikachu',
    nickname: 'Pikachu',
    role: 'SUBJECT_EXACT',
    passiveBonusDescription: '+15% Focus Power em Exatas',
    friendshipLevel: 3,
    variant: 'regular',
    acquiredAt: '',
  },
];

const mockSetTab = vi.fn();

vi.mock('../hooks/useGameState', () => ({
  useGame: () => ({
    profile: mockProfile,
    coffeeBreak: mockCoffeeBreak,
    collection: mockCollection,
    tab: 'rest',
    setTab: mockSetTab,
  }),
}));

describe('components/layout/TopHUD', () => {
  it('deve renderizar o dia e mês no badge de calendário', () => {
    render(<TopHUD onShop={vi.fn()} />);

    const now = new Date();
    const day = now.getDate();
    expect(screen.getByText(String(day))).toBeInTheDocument();
  });

  it('deve exibir a ofensiva de dias e o poder de foco', () => {
    render(<TopHUD onShop={vi.fn()} />);

    expect(screen.getAllByText('7').length).toBeGreaterThanOrEqual(1); // streak e biscoitos
    expect(screen.getByText('450')).toBeInTheDocument(); // focus power
    expect(screen.getByText('350')).toBeInTheDocument(); // focus coins
  });

  it('deve abrir a loja ao clicar no botão de biscoitos', () => {
    const onShop = vi.fn();
    render(<TopHUD onShop={onShop} />);

    const btnShop = screen.getByRole('button', { name: /Abrir cantina de biscoitos/i });
    fireEvent.click(btnShop);
    expect(onShop).toHaveBeenCalled();
  });
});

describe('components/layout/BottomNav', () => {
  it('deve renderizar as 4 abas de navegação (Foco, Descanso, Equipe, Focus Dex)', () => {
    render(<BottomNav />);

    expect(screen.getByText('Foco')).toBeInTheDocument();
    expect(screen.getByText('Descanso')).toBeInTheDocument();
    expect(screen.getByText('Equipe')).toBeInTheDocument();
    expect(screen.getByText('Focus Dex')).toBeInTheDocument();
  });

  it('deve chamar setTab ao clicar em uma aba', () => {
    render(<BottomNav />);

    fireEvent.click(screen.getByText('Foco'));
    expect(mockSetTab).toHaveBeenCalledWith('focus');

    fireEvent.click(screen.getByText('Equipe'));
    expect(mockSetTab).toHaveBeenCalledWith('team');
  });
});

describe('components/profile/ProfileModal', () => {
  it('deve renderizar os ícones padrão e os Pokémon da coleção', () => {
    render(
      <ProfileModal
        currentIcon="caterpie"
        onSelectIcon={vi.fn()}
        onClose={vi.fn()}
      />
    );

    expect(screen.getByText(/Ícone do Perfil/i)).toBeInTheDocument();
    expect(screen.getByText(/Padrão/i)).toBeInTheDocument();
    expect(screen.getByText(/Pikachu/i)).toBeInTheDocument();
  });

  it('deve chamar onSelectIcon ao selecionar e confirmar novo avatar', () => {
    const onSelectIcon = vi.fn();
    const onClose = vi.fn();

    render(
      <ProfileModal
        currentIcon="caterpie"
        onSelectIcon={onSelectIcon}
        onClose={onClose}
      />
    );

    fireEvent.click(screen.getByText('Pikachu'));
    fireEvent.click(screen.getByText('Confirmar'));

    expect(onSelectIcon).toHaveBeenCalledWith('poke_25_regular');
    expect(onClose).toHaveBeenCalled();
  });
});

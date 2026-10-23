import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Campsite } from '../components/campsite/Campsite';
import { PokemonSpawn } from '../components/campsite/PokemonSpawn';
import { EnvironmentPicker } from '../components/campsite/EnvironmentPicker';
import type { SpawnedPokemon, TeamResponse, CoffeeBreak, UserProfile } from '../types';

const mockSpawn: SpawnedPokemon = {
  spawnId: 'sp-1',
  pokemonId: 4,
  pokemonName: 'Charmander',
  variant: 'regular',
  sleepStyle: 2,
  currentFriendshipPoints: 2,
  maxFriendshipPoints: 5,
  isAlreadyRecruited: false,
  isHungry: true,
  isFull: false,
  spriteSleepUrl: '',
  spriteMenuUrl: '',
  canvasPosition: { x: 0.5, y: 0.5 },
};

const mockTeam: TeamResponse = {
  activeTeam: [
    {
      id: 'p1',
      pokemonId: 1,
      pokemonName: 'Bulbasaur',
      nickname: 'Bulba',
      role: 'STAMINA',
      passiveBonusDescription: '+10% retenção',
      friendshipLevel: 2,
      variant: 'regular',
      acquiredAt: '',
    },
  ],
  activePassives: [],
};

const mockProfile: UserProfile = {
  id: 'u1',
  name: 'Ash',
  email: '',
  streakDays: 3,
  lastStudyDate: '',
  focusCoins: 100,
  inventory: { basic: 1, great: 0, master: 0 },
  activeEnvironment: 'greengrass',
  activeTeamPokemonIds: [],
  hasCompletedOnboarding: true,
  createdAt: '',
};

let mockCoffeeBreak: CoffeeBreak | null = null;
const mockSetTab = vi.fn();
const mockRefreshProfile = vi.fn();
const mockToast = vi.fn();

vi.mock('../hooks/useGameState', () => ({
  useGame: () => ({
    coffeeBreak: mockCoffeeBreak,
    team: mockTeam,
    profile: mockProfile,
    setTab: mockSetTab,
    refreshProfile: mockRefreshProfile,
    toast: mockToast,
  }),
}));

describe('components/campsite/Campsite', () => {
  it('deve exibir o Pokémon Líder, mensagem de incentivo e botão "Começar a estudar" quando não há spawns', () => {
    mockCoffeeBreak = null;
    render(<Campsite onOpenSpawn={vi.fn()} />);

    expect(screen.getByText(/Bulba \(Líder\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Seu cantinho de descanso está pronto/i)).toBeInTheDocument();
    const btnFocus = screen.getByText(/Começar a estudar/i);
    expect(btnFocus).toBeInTheDocument();

    fireEvent.click(btnFocus);
    expect(mockSetTab).toHaveBeenCalledWith('focus');
  });

  it('deve renderizar os Pokémon sorteados, a barra inferior E manter o Pokémon Líder visível', () => {
    mockCoffeeBreak = {
      sessionId: 'sess-1',
      focusPower: 300,
      spawnsCount: 1,
      spawns: [mockSpawn],
      expiresAt: '',
    };

    render(<Campsite onOpenSpawn={vi.fn()} />);

    expect(screen.getByText(/Bulba \(Líder\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Charmander/i)).toBeInTheDocument();
    expect(screen.getByText(/Amizades de Hoje/i)).toBeInTheDocument();
    expect(screen.getByText(/0 de 1 recrutados/i)).toBeInTheDocument();

    // Clicar no líder dispara toast afetuoso
    fireEvent.click(screen.getByText(/Bulba \(Líder\)/i));
    expect(mockToast).toHaveBeenCalledWith(expect.stringContaining('Bulba'), 'ok');
  });
});

describe('components/campsite/PokemonSpawn', () => {
  it('deve exibir apenas o nome do Pokémon e o coração com a quantidade de amizade', () => {
    render(<PokemonSpawn spawn={mockSpawn} index={0} onClick={vi.fn()} />);

    expect(screen.getByText('Charmander')).toBeInTheDocument();
    expect(screen.getByText('2/5')).toBeInTheDocument();
    expect(screen.queryByText(/Faminto! 3x/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Dormindo/i)).not.toBeInTheDocument();
  });

  it('deve chamar onClick ao clicar no Pokémon dormindo', () => {
    const onClick = vi.fn();
    render(<PokemonSpawn spawn={mockSpawn} index={0} onClick={onClick} />);

    const spawnBtn = screen.getByRole('button', { name: /Charmander dormindo/i });
    fireEvent.click(spawnBtn);
    expect(onClick).toHaveBeenCalledWith(mockSpawn);
  });
});

describe('components/campsite/EnvironmentPicker', () => {
  it('deve permitir abrir o menu e listar os ambientes disponíveis', () => {
    render(<EnvironmentPicker />);

    const btnTrocar = screen.getByRole('button', { name: /Trocar cenário/i });
    fireEvent.click(btnTrocar);

    expect(screen.getByText(/Ilha Verdejante/i)).toBeInTheDocument();
    expect(screen.getByText(/Praia Ciano/i)).toBeInTheDocument();
    expect(screen.getByText(/Tundra de Neve/i)).toBeInTheDocument();
  });
});

import { describe, it, expect, vi, beforeEach } from 'vitest';
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
const mockRemoveSpawn = vi.fn();

vi.mock('../hooks/useGameState', () => ({
  useGame: () => ({
    coffeeBreak: mockCoffeeBreak,
    team: mockTeam,
    profile: mockProfile,
    setTab: mockSetTab,
    refreshProfile: mockRefreshProfile,
    toast: mockToast,
    removeSpawn: mockRemoveSpawn,
  }),
}));

import { resetReactionRateLimiter } from '../lib/pokemonEmotions';
import { offlineEngine } from '../lib/offline-engine';

describe('components/campsite/Campsite', () => {
  beforeEach(() => {
    resetReactionRateLimiter();
  });

  it('deve exibir o Pokémon Líder no acampamento limpo quando não há spawns', () => {
    mockCoffeeBreak = null;
    render(<Campsite onOpenSpawn={vi.fn()} />);

    expect(screen.getByText(/Bulba \(Líder\)/i)).toBeInTheDocument();
    expect(screen.queryByText(/Seu cantinho de descanso está pronto/i)).not.toBeInTheDocument();
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

    // Clicar no líder abre o emoji puro de coração pixelado
    fireEvent.click(screen.getByText(/Bulba \(Líder\)/i));
    expect(screen.getByAltText('<3')).toBeInTheDocument();
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

  it('deve exibir o tempo restante persistente e não reiniciar para 30m', () => {
    // 15 minutos restantes
    const spawnWith15m: SpawnedPokemon = {
      ...mockSpawn,
      spawnId: 'sp-15m',
      expiresAt: Date.now() + 15 * 60 * 1000,
    };
    const { unmount } = render(<PokemonSpawn spawn={spawnWith15m} index={0} onClick={vi.fn()} />);
    expect(screen.getByText(/15m/)).toBeInTheDocument();
    unmount();

    // Remontando com 7 minutos restantes: não reinicia para 30m!
    const spawnWith7m: SpawnedPokemon = {
      ...mockSpawn,
      spawnId: 'sp-7m',
      expiresAt: Date.now() + 7 * 60 * 1000,
    };
    render(<PokemonSpawn spawn={spawnWith7m} index={0} onClick={vi.fn()} />);
    expect(screen.getByText(/7m/)).toBeInTheDocument();
    expect(screen.queryByText(/30m/)).not.toBeInTheDocument();
  });
});

describe('Pokemon 30min Despawn & Offline Persistence', () => {
  it('offlineEngine.getActiveBreak deve expirar e retornar null se o tempo de 30m passou com o app fechado', () => {
    const pastTime = Date.now() - 35 * 60 * 1000;
    const expiredBreak: CoffeeBreak = {
      sessionId: 'sess_old',
      focusPower: 250,
      spawns: [
        {
          ...mockSpawn,
          spawnId: `sp_${pastTime}_0_4`,
          spawnedAt: pastTime,
          expiresAt: pastTime + 30 * 60 * 1000,
        },
      ],
      createdAt: pastTime,
      expiresAt: pastTime + 30 * 60 * 1000,
    };

    localStorage.setItem('pokemoro_active_break', JSON.stringify(expiredBreak));

    const result = offlineEngine.getActiveBreak();
    expect(result).toBeNull();
    // Verifica que o storage foi limpo
    expect(localStorage.getItem('pokemoro_active_break')).toBeNull();
  });

  it('offlineEngine.getActiveBreak deve manter os spawns se ainda estiverem dentro dos 30 minutos', () => {
    const recentTime = Date.now() - 10 * 60 * 1000;
    const activeBreak: CoffeeBreak = {
      sessionId: 'sess_active',
      focusPower: 300,
      spawns: [
        {
          ...mockSpawn,
          spawnId: `sp_${recentTime}_0_4`,
          spawnedAt: recentTime,
          expiresAt: recentTime + 30 * 60 * 1000,
        },
      ],
      createdAt: recentTime,
      expiresAt: recentTime + 30 * 60 * 1000,
    };

    localStorage.setItem('pokemoro_active_break', JSON.stringify(activeBreak));

    const result = offlineEngine.getActiveBreak();
    expect(result).not.toBeNull();
    expect(result!.spawns).toHaveLength(1);
    // Tempo restante deve ser ~20 minutos, nunca resetado para 30m
    const remainingMs = result!.spawns[0].expiresAt! - Date.now();
    const remainingMins = Math.ceil(remainingMs / 60000);
    expect(remainingMins).toBe(20);
  });

  it('offlineEngine.removeSpawn deve salvar null quando o último spawn for removido', () => {
    const activeBreak: CoffeeBreak = {
      sessionId: 'sess_remove',
      focusPower: 300,
      spawns: [
        {
          ...mockSpawn,
          spawnId: 'sp_to_remove',
          expiresAt: Date.now() + 25 * 60 * 1000,
        },
      ],
      createdAt: Date.now(),
      expiresAt: Date.now() + 25 * 60 * 1000,
    };

    localStorage.setItem('pokemoro_active_break', JSON.stringify(activeBreak));
    offlineEngine.removeSpawn('sp_to_remove');

    expect(offlineEngine.getActiveBreak()).toBeNull();
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

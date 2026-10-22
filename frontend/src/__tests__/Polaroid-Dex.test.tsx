import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PolaroidModal } from '../components/dex/PolaroidModal';
import { DexScreen } from '../components/dex/DexScreen';
import type { SpawnedPokemon, FocusDex, UserProfile } from '../types';

const mockSpawn: SpawnedPokemon = {
  spawnId: 'pol-1',
  pokemonId: 1,
  pokemonName: 'Bulbasaur',
  variant: 'regular',
  sleepStyle: 1,
  currentFriendshipPoints: 5,
  maxFriendshipPoints: 5,
  isAlreadyRecruited: true,
  isHungry: false,
  isFull: true,
  spriteSleepUrl: '',
  spriteMenuUrl: '',
  canvasPosition: { x: 0.5, y: 0.5 },
};

const mockProfile: UserProfile = {
  id: 'u1',
  name: 'Ash',
  email: '',
  streakDays: 1,
  lastStudyDate: '',
  focusCoins: 100,
  inventory: { basic: 1, great: 0, master: 0 },
  activeEnvironment: 'greengrass',
  activeTeamPokemonIds: [],
  createdAt: '',
};

const mockDex: FocusDex = {
  totalDiscovered: 12,
  totalAvailable: 36,
  completionPercentage: 33,
  entries: [
    {
      pokemonId: 1,
      pokemonName: 'Bulbasaur',
      isSeen: true,
      isRecruited: true,
      styles: {
        style1: { style: 1, isUnlocked: true, discoveredShiny: false },
        style2: { style: 2, isUnlocked: true, discoveredShiny: false },
        style3: { style: 3, isUnlocked: false, discoveredShiny: false },
      },
    },
    {
      pokemonId: 4,
      pokemonName: 'Charmander',
      isSeen: false,
      isRecruited: false,
      styles: {
        style1: { style: 1, isUnlocked: false, discoveredShiny: false },
        style2: { style: 2, isUnlocked: false, discoveredShiny: false },
        style3: { style: 3, isUnlocked: false, discoveredShiny: false },
      },
    },
  ],
};

const mockRefreshDex = vi.fn().mockResolvedValue(undefined);

vi.mock('../hooks/useGameState', () => ({
  useGame: () => ({
    profile: mockProfile,
    dex: mockDex,
    refreshDex: mockRefreshDex,
  }),
}));

describe('components/dex/PolaroidModal', () => {
  it('deve renderizar o card fotográfico com nome do Pokémon e estilo', () => {
    render(
      <PolaroidModal
        spawn={mockSpawn}
        onRegister={vi.fn()}
        onClose={vi.fn()}
      />
    );

    expect(screen.getByText(/#0001 Bulbasaur/i)).toBeInTheDocument();
    expect(screen.getByText(/Dormindo de Lado/i)).toBeInTheDocument();
    expect(screen.getByText(/🍪 \+1 Biscoito/i)).toBeInTheDocument();
    expect(screen.getByText(/🪙 \+25 Moedas/i)).toBeInTheDocument();
  });

  it('deve chamar onRegister ao clicar em "Registrar na Focus Dex"', async () => {
    const onRegister = vi.fn();
    render(
      <PolaroidModal
        spawn={mockSpawn}
        onRegister={onRegister}
        onClose={vi.fn()}
      />
    );

    const btnRegister = screen.getByRole('button', { name: /Registrar na Focus Dex/i });
    fireEvent.click(btnRegister);

    await vi.waitFor(() => {
      expect(onRegister).toHaveBeenCalled();
    });
  });
});

describe('components/dex/DexScreen', () => {
  it('deve renderizar a porcentagem de conclusão e a contagem de poses catalogadas', () => {
    render(<DexScreen />);

    expect(screen.getByText(/Focus Dex/i)).toBeInTheDocument();
    expect(screen.getByText(/12 \/ 36 poses catalogadas/i)).toBeInTheDocument();
    expect(screen.getByText(/33% concluído/i)).toBeInTheDocument();
  });

  it('deve renderizar Pokémon visto com nome e não visto com silhueta/???', () => {
    render(<DexScreen />);

    expect(screen.getByText('Bulbasaur')).toBeInTheDocument();
    expect(screen.getByText('???')).toBeInTheDocument(); // Charmander não visto
  });

  it('deve abrir o modal inferior ao clicar em um Pokémon catalogado', () => {
    render(<DexScreen />);

    fireEvent.click(screen.getByText('Bulbasaur'));

    expect(screen.getByText(/#0001/i)).toBeInTheDocument();
    expect(screen.getByText(/Dormindo de Lado/i)).toBeInTheDocument();
  });
});

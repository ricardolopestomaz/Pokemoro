import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SnackPanel } from '../components/snack/SnackPanel';
import { ShopSheet } from '../components/snack/ShopSheet';
import { api } from '../api/endpoints';
import type { SpawnedPokemon, UserProfile, CoffeeBreak } from '../types';

const mockSpawn: SpawnedPokemon = {
  spawnId: 'sp-snack-1',
  pokemonId: 7,
  pokemonName: 'Squirtle',
  variant: 'regular',
  sleepStyle: 1,
  currentFriendshipPoints: 2,
  maxFriendshipPoints: 5,
  isAlreadyRecruited: false,
  isHungry: false,
  isFull: false,
  spriteSleepUrl: '',
  spriteMenuUrl: '',
  canvasPosition: { x: 0.5, y: 0.5 },
};

const mockProfile: UserProfile = {
  id: 'u1',
  name: 'Treinador',
  email: '',
  streakDays: 1,
  lastStudyDate: '',
  focusCoins: 150,
  inventory: { basic: 2, great: 1, master: 0 },
  activeEnvironment: 'greengrass',
  activeTeamPokemonIds: [],
  createdAt: '',
};

const mockCoffeeBreak: CoffeeBreak = {
  sessionId: 's1',
  focusPower: 300,
  spawnsCount: 1,
  spawns: [mockSpawn],
  expiresAt: '',
};

const mockPatchInventory = vi.fn();
const mockPatchSpawn = vi.fn();
const mockToast = vi.fn();

vi.mock('../hooks/useGameState', () => ({
  useGame: () => ({
    coffeeBreak: mockCoffeeBreak,
    profile: mockProfile,
    patchInventory: mockPatchInventory,
    patchSpawn: mockPatchSpawn,
    toast: mockToast,
    refreshTeam: vi.fn(),
    refreshDex: vi.fn(),
    refreshProfile: vi.fn(),
  }),
}));

describe('components/snack/SnackPanel', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('deve exibir os pontos de amizade e os biscoitos disponíveis', () => {
    render(<SnackPanel spawnId="sp-snack-1" onClose={vi.fn()} />);

    expect(screen.getByText(/Nível de Amizade 2/i)).toBeInTheDocument();
    expect(screen.getByText(/Faltam 3 ❤ para recrutá-lo/i)).toBeInTheDocument();
    expect(screen.getByText('Café')).toBeInTheDocument();
    expect(screen.getByText('Especial')).toBeInTheDocument();
    expect(screen.getByText('Dourado')).toBeInTheDocument();
  });

  it('deve desabilitar botão de biscoito quando quantidade em estoque for 0', () => {
    render(<SnackPanel spawnId="sp-snack-1" onClose={vi.fn()} />);

    const btnMaster = screen.getByRole('button', { name: /Dourado/i });
    expect(btnMaster).toBeDisabled(); // profile.inventory.master = 0
  });

  it('deve chamar api.feed e atualizar amizade ao dar biscoito', async () => {
    vi.spyOn(api, 'feed').mockResolvedValueOnce({
      spawnId: 'sp-snack-1',
      pointsAdded: 1,
      newFriendshipPoints: 3,
      maxFriendshipPoints: 5,
      wasHungry: false,
      isFull: false,
      isRecruited: false,
      recruitedPokemon: null,
      updatedInventory: { basic: 1, great: 1, master: 0 },
    });

    render(<SnackPanel spawnId="sp-snack-1" onClose={vi.fn()} />);

    const btnBasic = screen.getByRole('button', { name: /Café/i });
    fireEvent.click(btnBasic);

    expect(api.feed).toHaveBeenCalledWith('sp-snack-1', 'BASIC');
  });
});

describe('components/snack/ShopSheet', () => {
  it('deve renderizar os itens da loja e saldo de moedas', () => {
    render(<ShopSheet onClose={vi.fn()} />);

    expect(screen.getByText(/Cantina de Biscoitos/i)).toBeInTheDocument();
    expect(screen.getByText('150')).toBeInTheDocument(); // saldo 150 moedas
    expect(screen.getByText(/Biscoito de Café/i)).toBeInTheDocument();
    expect(screen.getByText(/Biscoito Especial/i)).toBeInTheDocument();
    expect(screen.getByText(/Biscoito Dourado/i)).toBeInTheDocument();
  });

  it('deve desabilitar compra de itens mais caros do que o saldo atual', () => {
    render(<ShopSheet onClose={vi.fn()} />);

    // Biscoito Dourado custa 300 moedas, usuário tem 150
    const btnMaster = screen.getByRole('button', { name: /300 🪙/i });
    expect(btnMaster).toBeDisabled();

    // Biscoito de Café custa 50 moedas
    const btnBasic = screen.getByRole('button', { name: /50 🪙/i });
    expect(btnBasic).not.toBeDisabled();
  });

  it('deve chamar api.buyBiscuits ao comprar um item', async () => {
    vi.spyOn(api, 'buyBiscuits').mockResolvedValueOnce({
      ...mockProfile,
      focusCoins: 100,
      inventory: { basic: 3, great: 1, master: 0 },
    });

    render(<ShopSheet onClose={vi.fn()} />);

    const btnBasic = screen.getByRole('button', { name: /50 🪙/i });
    fireEvent.click(btnBasic);

    expect(api.buyBiscuits).toHaveBeenCalledWith('BASIC', 1);
  });
});

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TeamScreen } from '../components/team/TeamScreen';
import { api } from '../api/endpoints';
import type { TeamResponse, UserPokemon } from '../types';

const mockTeam: TeamResponse = {
  activeTeam: [
    {
      id: 'p-1',
      pokemonId: 25,
      pokemonName: 'Pikachu',
      nickname: 'Pikachu',
      role: 'SUBJECT_EXACT',
      passiveBonusDescription: '+15% Focus Power em Exatas',
      friendshipLevel: 4,
      variant: 'regular',
      acquiredAt: '',
    },
    {
      id: 'p-2',
      pokemonId: 1,
      pokemonName: 'Bulbasaur',
      nickname: 'Bulba',
      role: 'STAMINA',
      passiveBonusDescription: '+10% de retenção',
      friendshipLevel: 2,
      variant: 'regular',
      acquiredAt: '',
    },
  ],
  activePassives: ['+15% Focus Power em Exatas', '+10% de retenção'],
};

const mockCollection: UserPokemon[] = [
  ...mockTeam.activeTeam,
  {
    id: 'p-3',
    pokemonId: 4,
    pokemonName: 'Charmander',
    nickname: 'Charmy',
    role: 'ENERGY',
    passiveBonusDescription: '+10% de motivação em sessões longas',
    friendshipLevel: 3,
    variant: 'regular',
    acquiredAt: '',
  },
  {
    id: 'p-4',
    pokemonId: 10,
    pokemonName: 'Caterpie',
    nickname: 'Caterpie',
    role: 'ITEMS',
    passiveBonusDescription: '+15% de chance de coletar Biscoitos',
    friendshipLevel: 5,
    variant: 'regular',
    acquiredAt: '',
  },
];

const mockRefreshTeam = vi.fn().mockResolvedValue(undefined);
const mockToast = vi.fn();

vi.mock('../hooks/useGameState', () => ({
  useGame: () => ({
    team: mockTeam,
    collection: mockCollection,
    refreshTeam: mockRefreshTeam,
    toast: mockToast,
  }),
}));

describe('components/team/TeamScreen', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('deve exibir o Poder da Equipe (RP) e a fita "Leader" no primeiro slot', () => {
    render(<TeamScreen />);

    expect(screen.getByText(/Poder da Equipe \(RP\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Leader/i)).toBeInTheDocument();
  });

  it('deve renderizar os parceiros nos cards verticais com seus níveis', () => {
    render(<TeamScreen />);

    expect(screen.getAllByText('Pikachu').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Bulba').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Lv. 4').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Lv. 2').length).toBeGreaterThan(0);
  });

  it('deve listar os Pokémon na Pokémon Box e permitir filtrar por papel', () => {
    render(<TeamScreen />);

    expect(screen.getByText(/Pokémon Box/i)).toBeInTheDocument();
    expect(screen.getByText(/4\/50/i)).toBeInTheDocument();

    // Filtros por botões específicos
    expect(screen.getByRole('button', { name: /Constância/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Resistência/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Coleta/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Motivação/i })).toBeInTheDocument();
  });

  it('deve auto-organizar a equipe ao clicar em "✨ Auto-organizar"', () => {
    render(<TeamScreen />);

    const btnAuto = screen.getByRole('button', { name: /Auto-organizar/i });
    fireEvent.click(btnAuto);

    expect(mockToast).toHaveBeenCalledWith(
      expect.stringContaining('Equipe ideal selecionada'),
      'ok'
    );
  });

  it('deve salvar a nova escalação da equipe chamando api.setTeam', async () => {
    vi.spyOn(api, 'setTeam').mockResolvedValueOnce({
      activeTeam: mockCollection,
      activePassives: [],
    });

    render(<TeamScreen />);

    // Clica em um Pokémon da Box para adicionar à equipe
    fireEvent.click(screen.getByText('Charmy'));

    // Botão de salvar fica ativo
    const btnSave = screen.getByRole('button', { name: /Usar Esta Equipe/i });
    expect(btnSave).not.toBeDisabled();

    fireEvent.click(btnSave);

    expect(api.setTeam).toHaveBeenCalled();
  });
});

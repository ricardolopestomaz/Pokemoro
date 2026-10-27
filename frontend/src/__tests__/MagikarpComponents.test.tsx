import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MagikarpBottomEventBar } from '../components/event/MagikarpBottomEventBar';
import { MagikarpRainOverlay } from '../components/event/MagikarpRainOverlay';
import { MagikarpLakeCreature } from '../components/event/MagikarpLakeCreature';
import { MagikarpDevSwitcher } from '../components/event/MagikarpDevSwitcher';
import { MagikarpEventModal } from '../components/event/MagikarpEventModal';
import type {
  MagikarpEventStateDTO,
  MagikarpUserProgressDTO,
  MagikarpMilestone,
} from '../types/magikarp-event';

describe('Componentes Visuais do Dia do Magikarp (Fortnite Level UI)', () => {
  const mockGoal = {
    activeUsersCount: 2,
    baseMinutesPerUser: 120,
    targetMinutes: 300,
    currentCommunityMinutes: 282,
    progressPercentage: 94,
    isTargetAchieved: false,
  };

  const mockTimeline = {
    cycleYear: 2026,
    teaserStartsAt: '2026-11-12T03:00:00Z',
    eventStartsAt: '2026-11-15T03:00:00Z',
    climaxStartsAt: '2026-11-15T23:00:00Z',
    eventEndsAt: '2026-11-16T03:00:00Z',
    postEventEndsAt: '2026-11-18T03:00:00Z',
    nextCycleDate: '2027-11-15T03:00:00Z',
  };

  const mockEventState: MagikarpEventStateDTO = {
    eventId: 'magikarp_day',
    cycleYear: 2026,
    currentPhase: 'live',
    timeline: mockTimeline,
    communityGoal: mockGoal,
    secondsUntilNextPhase: 3600,
    isDoubleCoinsActive: true,
    isRainVisualActive: true,
    isTeaserVisualActive: false,
  };

  const mockUserProgress: MagikarpUserProgressDTO = {
    userId: 'user-01',
    cycleYear: 2026,
    eventMinutesStudied: 182,
    jumpMeters: 1820,
    claimedMilestoneIds: [],
    highestMiniGameJumpMeters: 1200,
    unlockedGyaradosShiny: false,
    unlockedTieMagikarp: false,
    unlockedFurySkin: false,
    unlockedSwimmerTitle: false,
  };

  const mockMilestones: MagikarpMilestone[] = [
    {
      id: 'm_25min',
      type: 'personal',
      requiredMinutes: 25,
      title: 'Primeiro Salto',
      description: 'Estude 25 minutos.',
      rewardLabel: 'Título: Nadador',
      rewardType: 'TITLE',
      icon: '🌊',
      isUnlocked: true,
      isClaimed: false,
    },
  ];

  it('deve renderizar a barra de evento no rodapé (Fortnite HUD) com minutos e progresso', () => {
    const onOpen = vi.fn();
    render(
      <MagikarpBottomEventBar
        goal={mockGoal}
        phase="live"
        userMinutes={182}
        hasUnclaimedMilestone={true}
        onOpenEventPass={onOpen}
      />
    );

    expect(screen.getByText(/META COLETIVA: A CACHOEIRA/i)).toBeInTheDocument();
    expect(screen.getByText('282')).toBeInTheDocument();
    expect(screen.getByText('300m')).toBeInTheDocument();
    expect(screen.getByText('94%')).toBeInTheDocument();

    fireEvent.click(screen.getByText(/Recompensas!/i));
    expect(onOpen).toHaveBeenCalledTimes(1);
  });

  it('deve renderizar o Magikarp interativo no lago e permitir clicar', () => {
    const onLaunch = vi.fn();
    render(
      <MagikarpLakeCreature
        jumpMeters={1820}
        onLaunchJumpGame={onLaunch}
      />
    );

    const magikarpBtn = screen.getByRole('button');
    expect(magikarpBtn).toBeInTheDocument();

    fireEvent.click(magikarpBtn);
    expect(screen.getByText(/Karp!/i)).toBeInTheDocument();
  });

  it('deve renderizar o overlay de chuva sem erros visuais', () => {
    const { container } = render(<MagikarpRainOverlay />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it('deve renderizar o passe de evento sem menus ou abas confusas', () => {
    const onClose = vi.fn();
    const onClaim = vi.fn();

    render(
      <MagikarpEventModal
        isOpen={true}
        onClose={onClose}
        eventState={mockEventState}
        userProgress={mockUserProgress}
        milestones={mockMilestones}
        onClaimMilestone={onClaim}
        onOpenMiniGame={vi.fn()}
        onOpenClimaxCutscene={vi.fn()}
      />
    );

    expect(screen.getByText(/A Ascensão do Dragão/i)).toBeInTheDocument();
    expect(screen.getByText(/PASSE DE EVENTO AO VIVO/i)).toBeInTheDocument();
    expect(screen.getByText(/Primeiro Salto/i)).toBeInTheDocument();
    expect(screen.getByText(/Resgatar! ⚡/i)).toBeInTheDocument();
  });

  it('deve permitir alternar fases no MagikarpDevSwitcher', () => {
    const onUpdate = vi.fn();
    const onClose = vi.fn();

    render(
      <MagikarpDevSwitcher
        isOpen={true}
        onClose={onClose}
        currentConfig={{}}
        onUpdateConfig={onUpdate}
      />
    );

    expect(screen.getByText(/Professor Ricardo QA Suite/i)).toBeInTheDocument();
    
    // Seleciona fase Teaser
    fireEvent.click(screen.getByText(/Fase 1: Teaser/i));
    fireEvent.click(screen.getByText(/Aplicar Teste/i));

    expect(onUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        forcePhase: 'teaser',
      })
    );
  });
});

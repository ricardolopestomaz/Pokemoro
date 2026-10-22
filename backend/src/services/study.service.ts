import { StudySessionRepository } from '../db/repositories/study-session.repository.js';
import { UserRepository } from '../db/repositories/user.repository.js';
import { PokemonRepository } from '../db/repositories/pokemon.repository.js';
import { CoffeeBreakService } from './coffee-break.service.js';
import { calculateSpawns } from '../engine/spawn-engine.js';
import {
  StartStudySessionRequest,
  StartStudySessionResponse,
  EndStudySessionRequest,
  StudySessionSummaryDTO,
} from '../dtos/study-session.dto.js';

export class StudyService {
  constructor(
    private sessionRepo = new StudySessionRepository(),
    private userRepo = new UserRepository(),
    private pokemonRepo = new PokemonRepository(),
    private coffeeBreakService = new CoffeeBreakService()
  ) {}

  public createSubject(userId: string, name: string, color = '#4CAF50', icon = 'book') {
    return this.sessionRepo.createSubject(userId, name, color, icon);
  }

  public listSubjects(userId: string) {
    return this.sessionRepo.listSubjects(userId);
  }

  public startSession(userId: string, req: StartStudySessionRequest): StartStudySessionResponse {
    return this.sessionRepo.startSession(userId, req);
  }

  public endSession(userId: string, req: EndStudySessionRequest): StudySessionSummaryDTO {
    const today = new Date().toISOString().split('T')[0];
    const { newStreak } = this.userRepo.updateStreak(userId, today);

    const summary = this.sessionRepo.completeSession(userId, req, newStreak);

    // Se o Coffee Break foi desbloqueado, gera a aparição dos Pokémon
    if (summary.isCoffeeBreakUnlocked) {
      const user = this.userRepo.getUserProfile(userId);
      const friendships = this.pokemonRepo.getFriendshipPointsMap(userId);

      const spawns = calculateSpawns({
        focusPower: summary.focusPowerEarned,
        streakDays: newStreak,
        existingFriendships: friendships,
      });

      this.coffeeBreakService.setActiveCoffeeBreak(
        userId,
        summary.sessionId,
        summary.focusPowerEarned,
        user?.activeEnvironment || 'greengrass',
        spawns
      );
    }

    return summary;
  }

  public listRecentSessions(userId: string, limit = 10) {
    return this.sessionRepo.listRecentSessions(userId, limit);
  }
}

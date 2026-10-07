import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { getIO } from '../lib/socket';
import { MatchResultStatus, SportType, LobbyStatus } from '@prisma/client';

export const matchRouter = Router();

const matchResultSchema = z.object({
  lobbyId: z.number().int(),
  durationMins: z.number().int().min(30),
  stats: z.array(
    z.object({
      userId: z.number().int(),
      goals: z.number().int().default(0),
      assists: z.number().int().default(0),
      cleanSheets: z.number().int().default(0),
      saves: z.number().int().default(0),
      tackles: z.number().int().default(0),
      points: z.number().int().default(0),
      rebounds: z.number().int().default(0),
      steals: z.number().int().default(0),
      blocks: z.number().int().default(0),
      threePointers: z.number().int().default(0),
    })
  ).min(4, "Minimum 4 players required for quorum"),
});

matchRouter.post('/result', authMiddleware, validate(matchResultSchema), async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthRequest;
    const { lobbyId, durationMins, stats } = req.body;
    
    // Check if user submitted > 2 results today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const submissionsToday = await prisma.matchResult.count({
      where: {
        submittedById: authReq.user!.userId,
        createdAt: { gte: today },
      },
    });

    if (submissionsToday >= 2) {
      res.status(429).json({ error: 'Rate limit: Maximum 2 match results per day' });
      return;
    }

    const lobby = await prisma.matchLobby.findUnique({
      where: { id: lobbyId },
      include: { members: true },
    });

    if (!lobby) {
      res.status(404).json({ error: 'Lobby not found' });
      return;
    }

    if (lobby.status !== LobbyStatus.COMPLETED) {
      res.status(400).json({ error: 'Lobby must be completed to submit results' });
      return;
    }

    const startTime = Math.max(lobby.scheduledAt.getTime(), lobby.createdAt.getTime());
    const matchEndTime = new Date(startTime + durationMins * 60000);
    if (matchEndTime > new Date()) {
      res.status(400).json({ error: `Match duration (${durationMins} mins) exceeds the time elapsed since lobby creation/start.` });
      return;
    }

    const isMember = lobby.members.some(m => m.userId === authReq.user!.userId);
    if (!isMember) {
      res.status(403).json({ error: 'Must be a member of the lobby to submit results' });
      return;
    }

    // Verify all stats users are members
    const memberIds = lobby.members.map(m => m.userId);
    const validStats = stats.every((s: any) => memberIds.includes(s.userId));
    if (!validStats) {
      res.status(400).json({ error: 'All stats must belong to lobby members' });
      return;
    }

    const existingResult = await prisma.matchResult.findUnique({
      where: { lobbyId },
    });
    if (existingResult) {
      res.status(400).json({ error: 'Result already submitted for this lobby' });
      return;
    }

    const matchResult = await prisma.matchResult.create({
      data: {
        lobbyId,
        pitchId: lobby.pitchId,
        submittedById: authReq.user!.userId,
        sportType: lobby.sportType,
        status: MatchResultStatus.PENDING,
        matchDate: lobby.scheduledAt,
        durationMins,
        playerCount: stats.length,
        stats: {
          create: stats.map((s: any) => ({
            userId: s.userId,
            goals: s.goals,
            assists: s.assists,
            cleanSheets: s.cleanSheets,
            saves: s.saves,
            tackles: s.tackles,
            points: s.points,
            rebounds: s.rebounds,
            steals: s.steals,
            blocks: s.blocks,
            threePointers: s.threePointers,
          })),
        },
      },
    });

    res.status(201).json(matchResult);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

const confirmSchema = z.object({
  confirm: z.boolean(),
});

matchRouter.post('/:id/confirm', authMiddleware, validate(confirmSchema), async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthRequest;
    const { confirm } = req.body;
    const matchId = parseInt(req.params.id as string, 10);

    const matchResult = await prisma.matchResult.findUnique({
      where: { id: matchId },
      include: {
        stats: true,
        confirmations: true,
      },
    });

    if (!matchResult) {
      res.status(404).json({ error: 'Match result not found' });
      return;
    }

    if (matchResult.status !== MatchResultStatus.PENDING) {
      res.status(400).json({ error: 'Match result is not pending' });
      return;
    }

    if (matchResult.submittedById === authReq.user!.userId) {
      res.status(400).json({ error: 'Submitter cannot confirm' });
      return;
    }

    const isParticipant = matchResult.stats.some(s => s.userId === authReq.user!.userId);
    if (!isParticipant) {
      res.status(403).json({ error: 'Must be a participant to confirm' });
      return;
    }

    const existingConfirm = matchResult.confirmations.find(c => c.userId === authReq.user!.userId);
    if (existingConfirm) {
      res.status(400).json({ error: 'Already confirmed or denied' });
      return;
    }

    await prisma.matchConfirmation.create({
      data: {
        matchResultId: matchId,
        userId: authReq.user!.userId,
        confirmed: confirm,
      },
    });

    const confirmations = await prisma.matchConfirmation.findMany({
      where: { matchResultId: matchId },
    });

    const yesCount = confirmations.filter(c => c.confirmed).length;
    const noCount = confirmations.filter(c => !c.confirmed).length;

    if (yesCount >= 2) {
      await prisma.matchResult.update({
        where: { id: matchId },
        data: { status: MatchResultStatus.CONFIRMED },
      });

      // Update user cumulative stats for each participant
      for (const stat of matchResult.stats) {
        await prisma.user.update({
          where: { id: stat.userId },
          data: {
            matchesPlayed: { increment: 1 },
            goalsScored: { increment: stat.goals },
            // Add other stats as necessary
          },
        });
      }
    } else if (noCount >= 2) {
      await prisma.matchResult.update({
        where: { id: matchId },
        data: { status: MatchResultStatus.DISPUTED },
      });
    }

    res.json({ success: true, yesCount, noCount });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

const disputeSchema = z.object({
  reason: z.string().min(10),
});

matchRouter.post('/:id/dispute', authMiddleware, validate(disputeSchema), async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthRequest;
    const { reason } = req.body;
    const matchId = parseInt(req.params.id as string, 10);

    const matchResult = await prisma.matchResult.findUnique({
      where: { id: matchId },
      include: {
        stats: true,
      },
    });

    if (!matchResult) {
      res.status(404).json({ error: 'Match result not found' });
      return;
    }

    if (matchResult.status !== MatchResultStatus.DISPUTED) {
      res.status(400).json({ error: 'Match result must be disputed to apply a slash' });
      return;
    }

    // Verify the user attempting to slash was a participant who denied the match
    const userConfirmation = await prisma.matchConfirmation.findUnique({
      where: { matchResultId_userId: { matchResultId: matchId, userId: authReq.user!.userId } },
    });

    if (!userConfirmation || userConfirmation.confirmed) {
      res.status(403).json({ error: 'Only participants who denied the match can apply a slash' });
      return;
    }

    // Process slash
    const fraudulentUserId = matchResult.submittedById;

    const existingSlash = await prisma.slashRecord.findFirst({
      where: { matchResultId: matchId, slashedUserId: fraudulentUserId },
    });

    if (existingSlash) {
      res.status(400).json({ error: 'Slash already applied for this match' });
      return;
    }

    await prisma.$transaction(async (tx) => {
      // 1. Create slash record
      await tx.slashRecord.create({
        data: {
          matchResultId: matchId,
          slashedUserId: fraudulentUserId,
          issuedByUserId: authReq.user!.userId,
          reason,
          repPenalty: -30,
          statMultiplier: 2.0,
          crownBanDays: 14,
        },
      });

      // 2. Update match result status
      await tx.matchResult.update({
        where: { id: matchId },
        data: { status: MatchResultStatus.SLASHED },
      });

      // 3. Apply penalties to the fraudulent user
      const banUntil = new Date();
      banUntil.setDate(banUntil.getDate() + 14);

      // We should deduct 2x the submitted stats from the fraudulent user's aggregate
      const fraudStats = matchResult.stats.find(s => s.userId === fraudulentUserId);
      const goalsDeduction = fraudStats ? fraudStats.goals * 2 : 0;

      await tx.user.update({
        where: { id: fraudulentUserId },
        data: {
          reputationScore: { decrement: 30 },
          crownBannedUntil: banUntil,
          goalsScored: { decrement: goalsDeduction },
        },
      });
    });

    res.json({ success: true, message: 'Slash applied' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

matchRouter.get('/leaderboard', async (req: Request, res: Response): Promise<void> => {
  try {
    const pitchId = parseInt(req.query.pitchId as string, 10);
    const sportTypeStr = req.query.sportType as string;

    if (isNaN(pitchId) || !sportTypeStr) {
      res.status(400).json({ error: 'pitchId and sportType are required' });
      return;
    }

    const sportType = sportTypeStr as SportType;

    const stats = await prisma.matchStat.findMany({
      where: {
        matchResult: {
          pitchId,
          sportType,
          status: MatchResultStatus.CONFIRMED,
        },
      },
      include: {
        user: {
          select: {
            id: true,
            alias: true,
            footballPosition: true,
            basketballPosition: true,
          }
        },
      },
    });

    // Aggregate stats by user
    const userStats = new Map<number, any>();

    for (const stat of stats) {
      if (!userStats.has(stat.userId)) {
        userStats.set(stat.userId, {
          user: stat.user,
          goals: 0,
          assists: 0,
          cleanSheets: 0,
          saves: 0,
          tackles: 0,
          points: 0,
          rebounds: 0,
          steals: 0,
          blocks: 0,
          confirmedMatches: 0,
        });
      }

      const uStat = userStats.get(stat.userId);
      uStat.goals += stat.goals;
      uStat.assists += stat.assists;
      uStat.cleanSheets += stat.cleanSheets;
      uStat.saves += stat.saves;
      uStat.tackles += stat.tackles;
      uStat.points += stat.points;
      uStat.rebounds += stat.rebounds;
      uStat.steals += stat.steals;
      uStat.blocks += stat.blocks;
      uStat.confirmedMatches += 1;
    }

    const leaderboard = Array.from(userStats.values()).map(u => {
      let score = 0;
      if (sportType === SportType.FOOTBALL) {
        if (u.user.footballPosition === 'FORWARD') score = u.goals + u.assists;
        else if (u.user.footballPosition === 'MIDFIELDER') score = u.assists + u.goals;
        else if (u.user.footballPosition === 'DEFENDER') score = u.tackles + u.cleanSheets;
        else if (u.user.footballPosition === 'GOALKEEPER') score = u.saves + u.cleanSheets;
        else score = u.goals + u.assists; // fallback
      } else {
        if (u.user.basketballPosition === 'GUARD') score = u.points + u.steals;
        else if (u.user.basketballPosition === 'FORWARD') score = u.points + u.rebounds;
        else if (u.user.basketballPosition === 'CENTER') score = u.rebounds + u.blocks;
        else score = u.points + u.rebounds; // fallback
      }
      return { ...u, score };
    });

    leaderboard.sort((a, b) => b.score - a.score);

    // Find reigning king: player with most confirmed stats/matches at that pitch
    let reigningKing = null;
    if (leaderboard.length > 0) {
      const kingByMatches = [...leaderboard].sort((a, b) => b.confirmedMatches - a.confirmedMatches);
      reigningKing = kingByMatches[0].user;
    }

    res.json({ leaderboard, reigningKing });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

matchRouter.get('/stats/:userId', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = parseInt(req.params.userId as string, 10);

    const stats = await prisma.matchStat.findMany({
      where: {
        userId,
        matchResult: {
          status: MatchResultStatus.CONFIRMED,
        },
      },
      include: {
        matchResult: {
          select: { sportType: true },
        },
      },
    });

    const sportStats = {
      [SportType.FOOTBALL]: { matches: 0, goals: 0, assists: 0, cleanSheets: 0, saves: 0, tackles: 0 },
      [SportType.BASKETBALL]: { matches: 0, points: 0, rebounds: 0, steals: 0, blocks: 0, threePointers: 0 },
    };

    for (const stat of stats) {
      const sport = stat.matchResult.sportType;
      // Because TypeScript, ensure the enum is used safely:
      if (sport === SportType.FOOTBALL) {
        sportStats[SportType.FOOTBALL].matches += 1;
        sportStats[SportType.FOOTBALL].goals += stat.goals;
        sportStats[SportType.FOOTBALL].assists += stat.assists;
        sportStats[SportType.FOOTBALL].cleanSheets += stat.cleanSheets;
        sportStats[SportType.FOOTBALL].saves += stat.saves;
        sportStats[SportType.FOOTBALL].tackles += stat.tackles;
      } else if (sport === SportType.BASKETBALL) {
        sportStats[SportType.BASKETBALL].matches += 1;
        sportStats[SportType.BASKETBALL].points += stat.points;
        sportStats[SportType.BASKETBALL].rebounds += stat.rebounds;
        sportStats[SportType.BASKETBALL].steals += stat.steals;
        sportStats[SportType.BASKETBALL].blocks += stat.blocks;
        sportStats[SportType.BASKETBALL].threePointers += stat.threePointers;
      }
    }

    res.json(sportStats);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

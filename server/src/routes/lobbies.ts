import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { getIO } from '../lib/socket';
import { LobbyStatus } from '@prisma/client';

export const lobbyRouter = Router();

const createLobbySchema = z.object({
  pitchId: z.coerce.number().int().positive(),
  teamName: z.string().max(100).optional(),
  title: z.string().max(100).optional(),
  note: z.string().max(100).optional(),
  maxPlayers: z.coerce.number().int().min(2).max(30).default(10),
  scheduledAt: z.string().optional(),
  startsAt: z.string().optional(),
  hasBall: z.boolean().optional(),
}).refine(data => Boolean(data.scheduledAt || data.startsAt), {
  message: 'Kick-off time (scheduledAt or startsAt) is required',
  path: ['scheduledAt'],
}).transform(data => ({
  pitchId: data.pitchId,
  teamName: data.teamName || data.title || data.note,
  maxPlayers: data.maxPlayers,
  scheduledAt: (data.scheduledAt || data.startsAt) as string,
  hasBall: data.hasBall,
}));

// GET /api/lobbies?pitchId=X (Public read)
lobbyRouter.get('/', async (req: Request, res: Response) => {
  try {
    const pitchId = req.query.pitchId ? parseInt(req.query.pitchId as string) : undefined;

    const where: any = {
      OR: [
        { status: { in: ['BUILDING', 'FULL', 'ACTIVE'] } },
        {
          status: 'COMPLETED',
          createdAt: { gte: new Date(Date.now() - 48 * 60 * 60 * 1000) },
        },
      ],
    };
    if (pitchId) where.pitchId = pitchId;

    const lobbies = await prisma.matchLobby.findMany({
      where,
      orderBy: { scheduledAt: 'desc' },
      include: {
        host: {
          select: {
            id: true,
            alias: true,
            reputationScore: true,
            avatarUrl: true,
            hasBall: true,
            ballType: true,
            primarySport: true,
            footballPosition: true,
            basketballPosition: true,
          },
        },
        pitch: { select: { name: true, schoolId: true, sportType: true, hasBallNow: true, ballBroughtBy: true } },
        _count: { select: { members: true } },
        matchResult: {
          include: {
            stats: {
              include: {
                user: {
                  select: {
                    id: true,
                    alias: true,
                    avatarUrl: true,
                    reputationScore: true,
                  },
                },
              },
            },
            confirmations: {
              select: {
                userId: true,
                confirmed: true,
              },
            },
            submittedBy: {
              select: {
                id: true,
                alias: true,
              },
            },
          },
        },
        members: {
          select: {
            user: {
              select: {
                id: true,
                alias: true,
                reputationScore: true,
                avatarUrl: true,
                hasBall: true,
                ballType: true,
                primarySport: true,
                footballPosition: true,
                basketballPosition: true,
              },
            },
          },
        },
      },
    });

    res.json({ lobbies });
  } catch (err) {
    console.error('Fetch lobbies error:', err);
    res.status(500).json({ error: 'Failed to fetch lobbies' });
  }
});

// POST /api/lobbies
lobbyRouter.post('/', authMiddleware, validate(createLobbySchema), async (req: AuthRequest, res: Response) => {
  try {
    const { pitchId, teamName, maxPlayers, scheduledAt, hasBall } = req.body;
    const userId = req.user!.userId;

    const pitch = await prisma.pitch.findUnique({ where: { id: pitchId } });
    if (!pitch) {
      res.status(404).json({ error: 'Pitch not found' });
      return;
    }

    const hostUser = await prisma.user.findUnique({ where: { id: userId } });

    const existingActiveHost = await prisma.matchLobby.findFirst({
      where: {
        hostUserId: userId,
        status: { in: ['BUILDING', 'ACTIVE'] },
      },
    });
    if (existingActiveHost) {
      res.status(400).json({ error: 'You are already hosting an active set. Complete or cancel it before creating another.' });
      return;
    }

    const lobbyHasBall = Boolean(hasBall || hostUser?.hasBall);

    const lobby = await prisma.matchLobby.create({
      data: {
        pitchId,
        hostUserId: userId,
        teamName,
        maxPlayers,
        hasBall: lobbyHasBall,
        scheduledAt: new Date(scheduledAt),
        members: {
          create: { userId }, // Host auto-joins
        },
      },
      include: {
        host: {
          select: {
            id: true,
            alias: true,
            reputationScore: true,
            avatarUrl: true,
            hasBall: true,
            ballType: true,
            primarySport: true,
            footballPosition: true,
            basketballPosition: true,
          },
        },
        _count: { select: { members: true } },
        pitch: { select: { schoolId: true, name: true, sportType: true, hasBallNow: true, ballBroughtBy: true } },
        members: {
          select: {
            user: {
              select: {
                id: true,
                alias: true,
                reputationScore: true,
                avatarUrl: true,
                hasBall: true,
                ballType: true,
                primarySport: true,
                footballPosition: true,
                basketballPosition: true,
              },
            },
          },
        },
      },
    });

    getIO().to(`pitch:${pitchId}`).emit('lobby:updated', lobby);
    // N1P Alert broadcast to the school campus
    getIO().to(`school:${pitch.schoolId}`).emit('n1p:alert', {
      message: `New set building at ${pitch.name}!`,
      pitchId,
      lobbyId: lobby.id
    });

    res.status(201).json({ lobby });
  } catch (err) {
    console.error('Create lobby error:', err);
    res.status(500).json({ error: 'Failed to create lobby' });
  }
});

// POST /api/lobbies/:id/join
lobbyRouter.post('/:id/join', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const lobbyId = parseInt(req.params.id as string);
    const userId = req.user!.userId;

    const lobby = await prisma.matchLobby.findUnique({
      where: { id: lobbyId },
      include: { _count: { select: { members: true } } },
    });

    if (!lobby) {
      res.status(404).json({ error: 'Lobby not found' });
      return;
    }

    if (lobby.status === 'FULL' || lobby.status === 'COMPLETED' || lobby.status === 'CANCELLED') {
      res.status(400).json({ error: `Lobby is ${lobby.status.toLowerCase()}` });
      return;
    }

    if (lobby._count.members >= lobby.maxPlayers) {
      res.status(400).json({ error: 'Lobby is full' });
      return;
    }

    const existing = await prisma.lobbyMember.findUnique({
      where: { lobbyId_userId: { lobbyId, userId } },
    });
    if (existing) {
      res.status(400).json({ error: 'Already in this lobby' });
      return;
    }

    const activeMemberships = await prisma.lobbyMember.count({
      where: {
        userId,
        lobby: {
          status: { in: ['BUILDING', 'ACTIVE'] },
        },
      },
    });
    if (activeMemberships >= 3) {
      res.status(400).json({ error: 'You are already in 3 active sets. Leave or finish one before joining another.' });
      return;
    }

    await prisma.lobbyMember.create({ data: { lobbyId, userId } });

    const joiningUser = await prisma.user.findUnique({ where: { id: userId } });
    let lobbyHasBall = (lobby as any).hasBall;
    if (joiningUser?.hasBall && !lobbyHasBall) {
      lobbyHasBall = true;
      await prisma.matchLobby.update({
        where: { id: lobbyId },
        data: { hasBall: true },
      });
    }

    let newStatus: LobbyStatus = lobby.status;
    const newCount = lobby._count.members + 1;
    if (newCount >= lobby.maxPlayers) {
      newStatus = 'FULL';
      await prisma.matchLobby.update({
        where: { id: lobbyId },
        data: { status: 'FULL' },
      });
    }

    getIO().to(`pitch:${lobby.pitchId}`).emit('lobby:updated', { ...lobby, hasBall: lobbyHasBall, status: newStatus, _count: { members: newCount } });

    res.json({ message: 'Joined lobby', memberCount: newCount, hasBall: lobbyHasBall });
  } catch (err) {
    console.error('Join lobby error:', err);
    res.status(500).json({ error: 'Failed to join lobby' });
  }
});

// POST /api/lobbies/:id/leave
lobbyRouter.post('/:id/leave', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const lobbyId = parseInt(req.params.id as string);
    const userId = req.user!.userId;

    await prisma.lobbyMember.delete({
      where: { lobbyId_userId: { lobbyId, userId } },
    });

    const lobby = await prisma.matchLobby.findUnique({
      where: { id: lobbyId },
      include: {
        _count: { select: { members: true } },
        host: { select: { hasBall: true } },
        members: {
          select: {
            user: { select: { hasBall: true } },
          },
        },
      },
    });

    if (lobby) {
      let newStatus: LobbyStatus = lobby.status;
      if (lobby.status === 'FULL' && lobby._count.members < lobby.maxPlayers) {
        newStatus = 'BUILDING';
      }

      // Re-evaluate if host or any remaining member still has equipment
      const hostHasBall = Boolean(lobby.host?.hasBall);
      const memberHasBall = lobby.members.some((m) => Boolean(m.user?.hasBall));
      const stillHasBall = hostHasBall || memberHasBall;

      await prisma.matchLobby.update({
        where: { id: lobbyId },
        data: {
          status: newStatus,
          hasBall: stillHasBall,
        },
      });

      getIO().to(`pitch:${lobby.pitchId}`).emit('lobby:updated', { ...lobby, status: newStatus, hasBall: stillHasBall });
    }

    res.json({ message: 'Left lobby' });
  } catch (err) {
    console.error('Leave lobby error:', err);
    res.status(500).json({ error: 'Failed to leave lobby' });
  }
});

// PATCH /api/lobbies/:id/status (host only)
lobbyRouter.patch('/:id/status', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const lobbyId = parseInt(req.params.id as string);
    const userId = req.user!.userId;
    const { status } = req.body;

    const lobby = await prisma.matchLobby.findUnique({ where: { id: lobbyId } });
    if (!lobby) {
      res.status(404).json({ error: 'Lobby not found' });
      return;
    }
    if (lobby.hostUserId !== userId) {
      res.status(403).json({ error: 'Only the host can update lobby status' });
      return;
    }

    const updated = await prisma.matchLobby.update({
      where: { id: lobbyId },
      data: { status },
    });

    getIO().to(`pitch:${lobby.pitchId}`).emit('lobby:updated', updated);

    res.json({ lobby: updated });
  } catch (err) {
    console.error('Update lobby status error:', err);
    res.status(500).json({ error: 'Failed to update lobby status' });
  }
});

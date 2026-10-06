import { Router, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { getIO } from '../lib/socket';

export const lobbyRouter = Router();
lobbyRouter.use(authMiddleware);

const createLobbySchema = z.object({
  pitchId: z.number().int().positive(),
  teamName: z.string().max(100).optional(),
  maxPlayers: z.number().int().min(2).max(22).default(10),
  scheduledAt: z.string().datetime(),
});

// GET /api/lobbies?pitchId=X
lobbyRouter.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const pitchId = req.query.pitchId ? parseInt(req.query.pitchId as string) : undefined;

    const where: any = {
      status: { in: ['BUILDING', 'FULL', 'ACTIVE'] },
    };
    if (pitchId) where.pitchId = pitchId;

    const lobbies = await prisma.matchLobby.findMany({
      where,
      orderBy: { scheduledAt: 'asc' },
      include: {
        host: { select: { alias: true } },
        pitch: { select: { name: true, cityId: true } },
        _count: { select: { members: true } },
        members: {
          select: { user: { select: { alias: true, id: true } } },
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
lobbyRouter.post('/', validate(createLobbySchema), async (req: AuthRequest, res: Response) => {
  try {
    const { pitchId, teamName, maxPlayers, scheduledAt } = req.body;
    const userId = req.user!.userId;

    const pitch = await prisma.pitch.findUnique({ where: { id: pitchId } });
    if (!pitch) {
      res.status(404).json({ error: 'Pitch not found' });
      return;
    }

    const lobby = await prisma.matchLobby.create({
      data: {
        pitchId,
        hostUserId: userId,
        teamName,
        maxPlayers,
        scheduledAt: new Date(scheduledAt),
        members: {
          create: { userId }, // Host auto-joins
        },
      },
      include: {
        host: { select: { alias: true } },
        _count: { select: { members: true } },
        pitch: { select: { cityId: true, name: true } }
      },
    });

    getIO().to(`pitch:${pitchId}`).emit('lobby:updated', lobby);
    // N1P Alert broadcast to the city
    getIO().to(`city:${pitch.cityId}`).emit('n1p:alert', {
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
lobbyRouter.post('/:id/join', async (req: AuthRequest, res: Response) => {
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

    await prisma.lobbyMember.create({ data: { lobbyId, userId } });

    let newStatus = lobby.status;
    const newCount = lobby._count.members + 1;
    if (newCount >= lobby.maxPlayers) {
      newStatus = 'FULL';
      await prisma.matchLobby.update({
        where: { id: lobbyId },
        data: { status: 'FULL' },
      });
    }

    getIO().to(`pitch:${lobby.pitchId}`).emit('lobby:updated', { ...lobby, status: newStatus, _count: { members: newCount } });

    res.json({ message: 'Joined lobby', memberCount: newCount });
  } catch (err) {
    console.error('Join lobby error:', err);
    res.status(500).json({ error: 'Failed to join lobby' });
  }
});

// POST /api/lobbies/:id/leave
lobbyRouter.post('/:id/leave', async (req: AuthRequest, res: Response) => {
  try {
    const lobbyId = parseInt(req.params.id as string);
    const userId = req.user!.userId;

    await prisma.lobbyMember.delete({
      where: { lobbyId_userId: { lobbyId, userId } },
    });

    const lobby = await prisma.matchLobby.findUnique({
      where: { id: lobbyId },
      include: { _count: { select: { members: true } } },
    });

    if (lobby) {
      let newStatus = lobby.status;
      if (lobby.status === 'FULL' && lobby._count.members < lobby.maxPlayers) {
        newStatus = 'BUILDING';
        await prisma.matchLobby.update({
          where: { id: lobbyId },
          data: { status: 'BUILDING' },
        });
      }
      getIO().to(`pitch:${lobby.pitchId}`).emit('lobby:updated', { ...lobby, status: newStatus });
    }

    res.json({ message: 'Left lobby' });
  } catch (err) {
    console.error('Leave lobby error:', err);
    res.status(500).json({ error: 'Failed to leave lobby' });
  }
});

// PATCH /api/lobbies/:id/status (host only)
lobbyRouter.patch('/:id/status', async (req: AuthRequest, res: Response) => {
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

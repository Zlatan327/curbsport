import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { validate } from '../middleware/validate';

export const pitchRouter = Router();

// All pitch routes require auth
pitchRouter.use(authMiddleware);

const createPitchSchema = z.object({
  name: z.string().min(2).max(255).trim(),
  fieldType: z.enum(['Paid Turf', 'School Ground', 'Street Arena']),
  priceBracket: z.string().max(50),
  cityId: z.number().int().positive(),
  landmarkDescription: z.string().min(10).max(1000).trim(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
});

const updateStatusSchema = z.object({
  activeStatus: z.enum(['UNKNOWN', 'DRY', 'BUILDING', 'LIVE']),
});

const voteSchema = z.object({
  isUp: z.boolean(),
});

// GET /api/pitches/cities/list (get all available cities)
pitchRouter.get('/cities/list', async (_req: Request, res: Response) => {
  try {
    const cities = await prisma.city.findMany({
      orderBy: { name: 'asc' },
      include: { _count: { select: { pitches: true } } },
    });
    res.json({ cities });
  } catch (err) {
    console.error('Fetch cities error:', err);
    res.status(500).json({ error: 'Failed to fetch cities' });
  }
});

// GET /api/pitches?cityId=X
pitchRouter.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const cityId = req.query.cityId ? parseInt(req.query.cityId as string) : req.user!.cityId;

    const pitches = await prisma.pitch.findMany({
      where: { cityId },
      orderBy: [{ verificationStatus: 'asc' }, { confirmationCount: 'desc' }],
      include: {
        city: { select: { name: true } },
        _count: { select: { votes: true, lobbies: true } },
      },
    });

    res.json({ pitches });
  } catch (err) {
    console.error('Fetch pitches error:', err);
    res.status(500).json({ error: 'Failed to fetch pitches' });
  }
});

// GET /api/pitches/:id
pitchRouter.get('/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id as string);
    const pitch = await prisma.pitch.findUnique({
      where: { id },
      include: {
        city: { select: { name: true } },
        createdBy: { select: { alias: true } },
        _count: { select: { votes: true, lobbies: true, banterMessages: true } },
      },
    });

    if (!pitch) {
      res.status(404).json({ error: 'Pitch not found' });
      return;
    }

    res.json({ pitch });
  } catch (err) {
    console.error('Fetch pitch error:', err);
    res.status(500).json({ error: 'Failed to fetch pitch' });
  }
});

// POST /api/pitches (create pitch)
pitchRouter.post('/', validate(createPitchSchema), async (req: AuthRequest, res: Response) => {
  try {
    const data = req.body;

    const pitch = await prisma.pitch.create({
      data: {
        ...data,
        createdById: req.user!.userId,
        verificationStatus: 'GHOST',
        confirmationCount: 1, // Creator's implicit vote
      },
      include: {
        city: { select: { name: true } },
      },
    });

    res.status(201).json({ pitch });
  } catch (err) {
    console.error('Create pitch error:', err);
    res.status(500).json({ error: 'Failed to create pitch' });
  }
});

// PATCH /api/pitches/:id/status
pitchRouter.patch('/:id/status', validate(updateStatusSchema), async (req: AuthRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id as string);
    const { activeStatus } = req.body;

    const pitch = await prisma.pitch.update({
      where: { id },
      data: { activeStatus },
    });

    res.json({ pitch });
  } catch (err) {
    console.error('Update status error:', err);
    res.status(500).json({ error: 'Failed to update pitch status' });
  }
});

// POST /api/pitches/:id/vote
pitchRouter.post('/:id/vote', validate(voteSchema), async (req: AuthRequest, res: Response) => {
  try {
    const pitchId = parseInt(req.params.id as string);
    const userId = req.user!.userId;
    const { isUp } = req.body;

    // Upsert vote (one per user per pitch)
    await prisma.pitchVote.upsert({
      where: { pitchId_userId: { pitchId, userId } },
      update: { isUp },
      create: { pitchId, userId, isUp },
    });

    // Count upvotes
    const upvoteCount = await prisma.pitchVote.count({
      where: { pitchId, isUp: true },
    });

    const downvoteCount = await prisma.pitchVote.count({
      where: { pitchId, isUp: false },
    });

    // Auto-verify at 3 upvotes
    let newStatus: 'GHOST' | 'COMMUNITY_VERIFIED' | 'FLAGGED' = 'GHOST';
    if (upvoteCount >= 3) {
      newStatus = 'COMMUNITY_VERIFIED';
    }
    if (downvoteCount >= 3) {
      newStatus = 'FLAGGED';
    }

    const pitch = await prisma.pitch.update({
      where: { id: pitchId },
      data: {
        confirmationCount: upvoteCount,
        verificationStatus: newStatus,
      },
    });

    // Award reputation for verification
    if (isUp && upvoteCount === 3) {
      // Award +5 rep to all upvoters
      const upvoters = await prisma.pitchVote.findMany({
        where: { pitchId, isUp: true },
        select: { userId: true },
      });
      await prisma.user.updateMany({
        where: { id: { in: upvoters.map(v => v.userId) } },
        data: { reputationScore: { increment: 5 } },
      });
    }

    res.json({ pitch, upvotes: upvoteCount, downvotes: downvoteCount });
  } catch (err) {
    console.error('Vote error:', err);
    res.status(500).json({ error: 'Failed to vote' });
  }
});

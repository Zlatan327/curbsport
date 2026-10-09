import { Router, Request, Response } from 'express';
import { z } from 'zod';
import rateLimit from 'express-rate-limit';
import { prisma } from '../lib/prisma';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { getIO } from '../lib/socket';

export const pitchRouter = Router();

// Public routes (read-only) and authenticated routes (mutations)

const createPitchSchema = z.object({
  name: z.string().min(2).max(255).trim(),
  fieldType: z.enum(['Paid Turf', 'School Ground', 'Street Arena']).default('Street Arena'),
  priceBracket: z.string().max(50).default('Free'),
  schoolId: z.coerce.number().int().positive().default(1),
  landmarkDescription: z.string().min(4).max(1000).trim().optional(),
  address: z.string().min(4).max(1000).trim().optional(),
  description: z.string().max(1000).trim().optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
}).transform(d => ({
  name: d.name,
  fieldType: d.fieldType,
  priceBracket: d.priceBracket,
  schoolId: d.schoolId,
  landmarkDescription: (d.landmarkDescription || d.address || d.description || 'Community football ground').trim(),
  latitude: d.latitude,
  longitude: d.longitude,
}));

const updateStatusSchema = z.object({
  activeStatus: z.enum(['UNKNOWN', 'DRY', 'BUILDING', 'LIVE']),
});

const voteSchema = z.object({
  isUp: z.boolean(),
});

// GET /api/pitches/schools/list (get all available schools)
pitchRouter.get('/schools/list', async (_req: Request, res: Response) => {
  try {
    const schools = await prisma.school.findMany({
      orderBy: { name: 'asc' },
      include: { _count: { select: { pitches: true } } },
    });
    res.json({ schools });
  } catch (err) {
    console.error('Fetch schools error:', err);
    res.status(500).json({ error: 'Failed to fetch schools' });
  }
});

// GET /api/pitches?schoolId=X
pitchRouter.get('/', async (req: Request, res: Response) => {
  try {
    const schoolId = req.query.schoolId ? parseInt(req.query.schoolId as string) : 1;

    const pitches = await prisma.pitch.findMany({
      where: { schoolId },
      orderBy: [{ verificationStatus: 'asc' }, { confirmationCount: 'desc' }],
      include: {
        school: { select: { name: true } },
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
        school: { select: { name: true } },
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
pitchRouter.post('/', authMiddleware, validate(createPitchSchema), async (req: AuthRequest, res: Response) => {
  try {
    const data = req.body;

    const userPitchesLast24h = await prisma.pitch.count({
      where: {
        createdById: req.user!.userId,
        createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      },
    });
    if (userPitchesLast24h >= 5) {
      res.status(429).json({ error: 'Daily limit reached: You can only add up to 5 pitches per 24 hours.' });
      return;
    }

    const pitch = await prisma.pitch.create({
      data: {
        ...data,
        createdById: req.user!.userId,
        verificationStatus: 'GHOST',
        confirmationCount: 1, // Creator's implicit vote
      },
      include: {
        school: { select: { name: true } },
      },
    });

    res.status(201).json({ pitch });
  } catch (err) {
    console.error('Create pitch error:', err);
    res.status(500).json({ error: 'Failed to create pitch' });
  }
});

// Rate limit status changes: max 3 updates per minute per user to prevent status vandalism
const pitchStatusRateLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 3,
  keyGenerator: (req: any) => (req.user?.userId ? `user_pitch_status_${req.user.userId}` : req.ip || 'unknown'),
  message: { error: 'Please wait before updating pitch ground status again.' },
});

// PATCH /api/pitches/:id/status
pitchRouter.patch('/:id/status', authMiddleware, pitchStatusRateLimit, validate(updateStatusSchema), async (req: AuthRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id as string, 10);
    if (!id || isNaN(id)) {
      res.status(400).json({ error: 'Valid pitch id is required' });
      return;
    }

    const existing = await prisma.pitch.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ error: 'Pitch not found' });
      return;
    }

    const { activeStatus } = req.body;

    const pitch = await prisma.pitch.update({
      where: { id },
      data: { activeStatus },
    });

    getIO().to(`pitch:${id}`).emit('pitch:status_updated', pitch);

    res.json({ pitch });
  } catch (err) {
    console.error('Update status error:', err);
    res.status(500).json({ error: 'Failed to update pitch status' });
  }
});

// POST /api/pitches/:id/vote
pitchRouter.post('/:id/vote', authMiddleware, validate(voteSchema), async (req: AuthRequest, res: Response) => {
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
    // (Removed to prevent infinite reputation exploit via vote toggling)

    res.json({ pitch, upvotes: upvoteCount, downvotes: downvoteCount });
  } catch (err) {
    console.error('Vote error:', err);
    res.status(500).json({ error: 'Failed to vote' });
  }
});

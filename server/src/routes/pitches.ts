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
  imageUrl: z.string().max(2_000_000).optional(),
  sportType: z.enum(['FOOTBALL', 'BASKETBALL']).default('FOOTBALL'),
}).transform(d => ({
  name: d.name,
  fieldType: d.fieldType,
  priceBracket: d.priceBracket,
  schoolId: d.schoolId,
  landmarkDescription: (d.landmarkDescription || d.address || d.description || 'Community sports ground').trim(),
  latitude: d.latitude,
  longitude: d.longitude,
  imageUrl: d.imageUrl,
  sportType: d.sportType,
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

const updateImageSchema = z.object({
  imageUrl: z.string().min(10).max(2_000_000),
});

// PATCH /api/pitches/:id/image
pitchRouter.patch('/:id/image', authMiddleware, validate(updateImageSchema), async (req: AuthRequest, res: Response) => {
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

    const { imageUrl } = req.body;

    const pitch = await prisma.pitch.update({
      where: { id },
      data: { imageUrl },
    });

    getIO().to(`pitch:${id}`).emit('pitch:image_updated', pitch);

    res.json({ pitch });
  } catch (err) {
    console.error('Update pitch image error:', err);
    res.status(500).json({ error: 'Failed to update pitch image' });
  }
});

// Anti-exploit tracker: prevent infinite reputation farming via ball check-in / check-out toggling
const ballCheckinRepHistory = new Map<string, { awardedAt: number; amount: number }>();

// POST /api/pitches/:id/ball-checkin (Ball Owner ground check-in with perks & safe turn-off)
const ballCheckinSchema = z.object({
  hasBallNow: z.boolean().default(true),
  reason: z.enum(['BALL_LEAVING', 'CHECKED_OUT', 'ACCIDENTAL_CLICK', 'MATCH_ENDED', 'BALL_ARRIVED']).optional(),
  note: z.string().max(100).optional(),
});

pitchRouter.post('/:id/ball-checkin', authMiddleware, validate(ballCheckinSchema), async (req: AuthRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id as string, 10);
    const userId = req.user!.userId;
    const { hasBallNow, reason } = req.body;

    const existing = await prisma.pitch.findUnique({
      where: { id },
      include: { school: { select: { name: true } } },
    });
    if (!existing) {
      res.status(404).json({ error: 'Pitch not found' });
      return;
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const isBball = existing.sportType === 'BASKETBALL' || existing.name.toLowerCase().includes('basketball') || existing.name.toLowerCase().includes('court');
    const equipmentLabel = isBball ? 'Basketball' : 'Match ball';
    const locationLabel = isBball ? 'court' : 'ground';
    const repKey = `${userId}:${id}`;

    let updatedPitch;
    if (hasBallNow) {
      const alreadyCheckedIn = Boolean(existing.hasBallNow);
      const lastAward = ballCheckinRepHistory.get(repKey);
      const cooldownMs = 2 * 60 * 60 * 1000; // 2 hour cooldown between check-in rewards
      const isCooldownActive = Boolean(lastAward && (Date.now() - lastAward.awardedAt < cooldownMs));
      let awardedRep = false;

      if (!alreadyCheckedIn && !isCooldownActive) {
        // Award ball owner +10 reputation score & flag user as ball owner
        await prisma.user.update({
          where: { id: userId },
          data: {
            hasBall: true,
            reputationScore: { increment: 10 },
          },
        });
        ballCheckinRepHistory.set(repKey, { awardedAt: Date.now(), amount: 10 });
        awardedRep = true;
      } else {
        await prisma.user.update({
          where: { id: userId },
          data: { hasBall: true },
        });
      }

      updatedPitch = await prisma.pitch.update({
        where: { id },
        data: {
          hasBallNow: true,
          ballBroughtBy: user.alias,
          ballReportedAt: new Date(),
          activeStatus: 'LIVE', // Ball on ground brings match to life!
        },
      });

      // Broadcast live alert to pitch room
      getIO().to(`pitch:${id}`).emit('pitch:ball_spotted', {
        pitchId: id,
        hasBallNow: true,
        ballBroughtBy: user.alias,
        ballReportedAt: new Date(),
        reason: 'BALL_ARRIVED',
        message: `${user.alias} dey ${locationLabel} with ${equipmentLabel.toLowerCase()}!`,
      });
      getIO().to(`pitch:${id}`).emit('pitch:status_updated', updatedPitch);

      // Broadcast alert to whole campus
      getIO().to(`school:${existing.schoolId}`).emit('ball:alert', {
        pitchId: id,
        pitchName: existing.name,
        hasBallNow: true,
        ballBroughtBy: user.alias,
        message: `${isBball ? '🏀' : '⚽'} ${equipmentLabel} on ${locationLabel} at ${existing.name} (brought by ${user.alias})! Pull up!`,
      });

      res.json({
        pitch: updatedPitch,
        message: awardedRep
          ? `Ball checked in! You've been recognized as Ball Owner at ${existing.name}. +10 Reputation awarded!`
          : `Ball confirmed on ${locationLabel} at ${existing.name}!`,
      });
    } else {
      // Ball check-out / leaving or accidental click correction
      const lastAward = ballCheckinRepHistory.get(repKey);
      const wasRecentOwner = existing.ballBroughtBy === user.alias;
      const isImmediateReversal = Boolean(lastAward && (Date.now() - lastAward.awardedAt < 5 * 60 * 1000));

      if (wasRecentOwner && (reason === 'ACCIDENTAL_CLICK' || isImmediateReversal) && lastAward && lastAward.amount > 0) {
        // Revert the mistakenly awarded reputation to prevent toggle exploits
        await prisma.user.update({
          where: { id: userId },
          data: {
            reputationScore: { decrement: lastAward.amount },
          },
        });
        ballCheckinRepHistory.delete(repKey);
      }

      // Check active lobbies to determine appropriate activeStatus
      const activeLobbiesCount = await prisma.matchLobby.count({
        where: {
          pitchId: id,
          status: { in: ['ACTIVE', 'BUILDING'] },
        },
      });
      const newActiveStatus = activeLobbiesCount > 0 ? 'BUILDING' : 'DRY';

      updatedPitch = await prisma.pitch.update({
        where: { id },
        data: {
          hasBallNow: false,
          ballBroughtBy: null,
          ballReportedAt: null,
          activeStatus: existing.activeStatus === 'LIVE' ? newActiveStatus : existing.activeStatus,
        },
      });

      const leavingMessage = reason === 'ACCIDENTAL_CLICK'
        ? `⚠️ Ball check-in at ${existing.name} was marked as accidental click and cleared by ${user.alias}.`
        : `🏃 ${equipmentLabel} at ${existing.name} is leaving / no longer on ${locationLabel} (reported by ${user.alias}).`;

      getIO().to(`pitch:${id}`).emit('pitch:ball_spotted', {
        pitchId: id,
        hasBallNow: false,
        reportedBy: user.alias,
        reason: reason || 'BALL_LEAVING',
        message: leavingMessage,
      });
      getIO().to(`pitch:${id}`).emit('pitch:status_updated', updatedPitch);

      getIO().to(`school:${existing.schoolId}`).emit('ball:alert', {
        pitchId: id,
        pitchName: existing.name,
        hasBallNow: false,
        message: leavingMessage,
      });

      res.json({
        pitch: updatedPitch,
        message: reason === 'ACCIDENTAL_CLICK'
          ? 'Ball status reset and mistake undone.'
          : 'Ball check-out recorded — community notified that equipment has left.',
      });
    }
  } catch (err) {
    console.error('Ball checkin error:', err);
    res.status(500).json({ error: 'Failed to record ball check-in' });
  }
});



import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { validate } from '../middleware/validate';
import rateLimit from 'express-rate-limit';
import { getIO } from '../lib/socket';

export const banterRouter = Router();

// Rate limit banter: 1 message per 3 seconds
// Rate limit banter: 1 message per 3 seconds per user/IP
const banterRateLimit = rateLimit({
  windowMs: 3000,
  max: 1,
  keyGenerator: (req: any) => (req.user?.userId ? `user_${req.user.userId}` : req.ip || 'unknown'),
  message: { error: 'Easy! One banter at a time. Wait small.' },
});

const banterSchema = z.object({
  text: z.string().max(280).trim().optional(),
  message: z.string().max(280).trim().optional(),
  pitchId: z.coerce.number().int().positive().optional(),
}).refine(data => Boolean((data.text && data.text.length > 0) || (data.message && data.message.length > 0)), {
  message: 'Message cannot be empty',
  path: ['text'],
}).transform(data => ({
  text: (data.text || data.message || '').trim(),
}));

// GET /api/banter?pitchId=X&cursor=Y (Public read)
banterRouter.get('/', async (req: Request, res: Response) => {
  try {
    const pitchId = parseInt(req.query.pitchId as string);
    const cursor = req.query.cursor ? parseInt(req.query.cursor as string) : undefined;
    const take = 20;

    if (!pitchId || isNaN(pitchId)) {
      res.status(400).json({ error: 'pitchId is required' });
      return;
    }

    const messages = await prisma.banterMessage.findMany({
      where: { pitchId },
      take: take + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { alias: true, id: true } },
      },
    });

    const hasMore = messages.length > take;
    const data = hasMore ? messages.slice(0, take) : messages;
    const nextCursor = hasMore ? data[data.length - 1].id : null;

    res.json({ messages: data, nextCursor, hasMore });
  } catch (err) {
    console.error('Fetch banter error:', err);
    res.status(500).json({ error: 'Failed to fetch banter' });
  }
});

function sanitizeBanterText(input: string): string {
  let cleaned = input;
  let previous = '';
  // Defeat nested tag injection attempts like <<script>script>
  while (cleaned !== previous) {
    previous = cleaned;
    cleaned = cleaned.replace(/<[^>]*>?/gm, '');
  }
  // Strip non-printable control characters
  return cleaned.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '').trim();
}

// POST /api/banter?pitchId=X
banterRouter.post('/', authMiddleware, banterRateLimit, validate(banterSchema), async (req: AuthRequest, res: Response) => {
  try {
    const rawPitchId = req.query.pitchId || req.body.pitchId;
    const pitchId = parseInt(rawPitchId as string, 10);
    const userId = req.user!.userId;

    if (!pitchId || isNaN(pitchId)) {
      res.status(400).json({ error: 'pitchId is required (in query or body)' });
      return;
    }

    const text = sanitizeBanterText(req.body.text);
    if (!text) {
      res.status(400).json({ error: 'Message cannot be empty or solely HTML markup' });
      return;
    }

    const message = await prisma.banterMessage.create({
      data: { pitchId, userId, text },
      include: {
        user: { select: { alias: true, id: true } },
      },
    });

    // Emit real-time event to everyone in the pitch room
    getIO().to(`pitch:${pitchId}`).emit('banter:new', message);

    res.status(201).json({ message });
  } catch (err) {
    console.error('Post banter error:', err);
    res.status(500).json({ error: 'Failed to post banter' });
  }
});

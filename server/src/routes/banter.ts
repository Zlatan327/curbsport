import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { validate } from '../middleware/validate';
import rateLimit from 'express-rate-limit';
import { getIO } from '../lib/socket';

export const banterRouter = Router();

// Rate limit banter: 1 message per 3 seconds
const banterRateLimit = rateLimit({
  windowMs: 3000,
  max: 1,
  message: { error: 'Easy! One banter at a time. Wait small.' },
});

const banterSchema = z.object({
  text: z.string().min(1).max(280).trim(),
});

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

// POST /api/banter?pitchId=X
banterRouter.post('/', authMiddleware, banterRateLimit, validate(banterSchema), async (req: AuthRequest, res: Response) => {
  try {
    const pitchId = parseInt(req.query.pitchId as string);
    const userId = req.user!.userId;

    if (!pitchId || isNaN(pitchId)) {
      res.status(400).json({ error: 'pitchId query param is required' });
      return;
    }

    // Strip HTML tags for safety
    const text = req.body.text.replace(/<[^>]*>/g, '');

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

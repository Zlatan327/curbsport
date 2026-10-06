import { Router, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { validate } from '../middleware/validate';

export const userRouter = Router();
userRouter.use(authMiddleware);

const updateProfileSchema = z.object({
  alias: z.string().min(2).max(30).trim().optional(),
  favoritePosition: z.string().max(50).optional(),
});

// GET /api/users/me
userRouter.get('/me', async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      select: {
        id: true,
        phone: true,
        alias: true,
        cityId: true,
        favoritePosition: true,
        reputationScore: true,
        createdAt: true,
        city: { select: { name: true, lgaZone: true } },
        _count: { select: { createdPitches: true } },
      },
    });

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json({ user });
  } catch (err) {
    console.error('Fetch profile error:', err);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// PATCH /api/users/me
userRouter.patch('/me', validate(updateProfileSchema), async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const updates = req.body;

    if (updates.alias) {
      const existing = await prisma.user.findUnique({ where: { alias: updates.alias } });
      if (existing && existing.id !== userId) {
        res.status(409).json({ error: 'Alias already taken' });
        return;
      }
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: updates,
      select: {
        id: true,
        alias: true,
        favoritePosition: true,
        reputationScore: true,
      },
    });

    res.json({ user });
  } catch (err) {
    console.error('Update profile error:', err);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

import { Router, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { validate } from '../middleware/validate';

export const userRouter = Router();
userRouter.use(authMiddleware);

const updateProfileSchema = z.object({
  alias: z.string().min(2).max(30).trim().optional(),
  schoolId: z.number().int().positive().optional(),
  footballPosition: z.enum(['GOALKEEPER', 'DEFENDER', 'MIDFIELDER', 'FORWARD']).optional(),
  basketballPosition: z.enum(['GUARD', 'FORWARD', 'CENTER']).optional(),
  heightCm: z.number().int().min(100).max(250).optional(),
  weightKg: z.number().int().min(30).max(200).optional(),
  primarySport: z.enum(['FOOTBALL', 'BASKETBALL']).optional(),
  medicalInfo: z.string().max(500).optional(),
});

// GET /api/users/me
userRouter.get('/me', async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      select: {
        id: true,
        alias: true,
        schoolId: true,
        footballPosition: true,
        basketballPosition: true,
        heightCm: true,
        weightKg: true,
        primarySport: true,
        medicalInfo: true,
        reputationScore: true,
        matchesPlayed: true,
        goalsScored: true,
        manOfTheMatch: true,
        createdAt: true,
        school: { select: { name: true, institutionType: true } },
        _count: { select: { createdPitches: true } },
        physicalHistory: { orderBy: { createdAt: 'desc' } },
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

    if (updates.heightCm !== undefined || updates.weightKg !== undefined || updates.medicalInfo !== undefined) {
      // Find the current user to see if it changed
      const currentUser = await prisma.user.findUnique({ where: { id: userId } });
      if (
        currentUser && 
        (updates.heightCm !== undefined && updates.heightCm !== currentUser.heightCm ||
         updates.weightKg !== undefined && updates.weightKg !== currentUser.weightKg ||
         updates.medicalInfo !== undefined && updates.medicalInfo !== currentUser.medicalInfo)
      ) {
        await prisma.physicalStatHistory.create({
          data: {
            userId,
            heightCm: updates.heightCm ?? currentUser.heightCm,
            weightKg: updates.weightKg ?? currentUser.weightKg,
            medicalInfo: updates.medicalInfo ?? currentUser.medicalInfo,
          }
        });
      }
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: updates,
      select: {
        id: true,
        alias: true,
        schoolId: true,
        footballPosition: true,
        basketballPosition: true,
        heightCm: true,
        weightKg: true,
        primarySport: true,
        medicalInfo: true,
        reputationScore: true,
        matchesPlayed: true,
        goalsScored: true,
        manOfTheMatch: true,
        school: { select: { name: true, institutionType: true } },
        physicalHistory: { orderBy: { createdAt: 'desc' } },
      },
    });

    res.json({ user });
  } catch (err) {
    console.error('Update profile error:', err);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

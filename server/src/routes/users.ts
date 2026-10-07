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
  avatarUrl: z.string().max(4_000_000).optional(),
});

// GET /api/users/me
userRouter.get('/me', async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      select: {
        id: true,
        alias: true,
        avatarUrl: true,
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
        lastSchoolChangeAt: true,
        lastAliasChangeAt: true,
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
    const updates = { ...req.body };

    const currentUser = await prisma.user.findUnique({ where: { id: userId } });
    if (!currentUser) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // 1. Anti-Gaming Lockdown: School Transfer Window (14-day cooldown)
    if (updates.schoolId !== undefined && updates.schoolId !== currentUser.schoolId) {
      if (currentUser.lastSchoolChangeAt) {
        const cooldownDays = 14;
        const cooldownMs = cooldownDays * 24 * 60 * 60 * 1000;
        const timeSince = Date.now() - new Date(currentUser.lastSchoolChangeAt).getTime();
        if (timeSince < cooldownMs) {
          const daysLeft = Math.ceil((cooldownMs - timeSince) / (24 * 60 * 60 * 1000));
          res.status(400).json({
            error: `Campus transfer lockdown active. To prevent leaderboard manipulation, you can only change your school once every 14 days. Please wait ${daysLeft} more day(s).`,
            daysLeft,
          });
          return;
        }
      }
      updates.lastSchoolChangeAt = new Date();
    }

    // 2. Anti-Gaming Lockdown: Alias Renaming (7-day cooldown)
    if (updates.alias !== undefined && updates.alias !== currentUser.alias) {
      const existing = await prisma.user.findUnique({ where: { alias: updates.alias } });
      if (existing && existing.id !== userId) {
        res.status(409).json({ error: 'Alias already taken by another baller' });
        return;
      }

      if (currentUser.lastAliasChangeAt) {
        const aliasCooldownDays = 7;
        const aliasCooldownMs = aliasCooldownDays * 24 * 60 * 60 * 1000;
        const timeSinceAlias = Date.now() - new Date(currentUser.lastAliasChangeAt).getTime();
        if (timeSinceAlias < aliasCooldownMs) {
          const daysLeft = Math.ceil((aliasCooldownMs - timeSinceAlias) / (24 * 60 * 60 * 1000));
          res.status(400).json({
            error: `Baller name lockdown active. You can only change your alias once every 7 days. Please wait ${daysLeft} more day(s).`,
            daysLeft,
          });
          return;
        }
      }
      updates.lastAliasChangeAt = new Date();
    }

    // 3. Track Physical/Medical History
    if (updates.heightCm !== undefined || updates.weightKg !== undefined || updates.medicalInfo !== undefined) {
      if (
        (updates.heightCm !== undefined && updates.heightCm !== currentUser.heightCm) ||
        (updates.weightKg !== undefined && updates.weightKg !== currentUser.weightKg) ||
        (updates.medicalInfo !== undefined && updates.medicalInfo !== currentUser.medicalInfo)
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
        avatarUrl: true,
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
        lastSchoolChangeAt: true,
        lastAliasChangeAt: true,
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

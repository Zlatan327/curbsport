import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { validate } from '../middleware/validate';
import { authMiddleware, AuthRequest } from '../middleware/auth';

export const authRouter = Router();

const registerSchema = z.object({
  alias: z.string().min(2).max(30).trim(),
  password: z.string().min(6).max(100),
  schoolId: z.number().int().positive(),
  favoritePosition: z.string().max(50).optional(),
});

const loginSchema = z.object({
  alias: z.string().min(2).max(30).trim(),
  password: z.string().min(1),
});

// POST /api/auth/register
authRouter.post('/register', validate(registerSchema), async (req: Request, res: Response) => {
  try {
    const { alias, password, schoolId, favoritePosition } = req.body;

    const school = await prisma.school.findUnique({ where: { id: schoolId } });
    if (!school) {
      res.status(400).json({ error: 'Invalid school' });
      return;
    }

    const existingAlias = await prisma.user.findUnique({ where: { alias } });
    if (existingAlias) {
      res.status(409).json({ error: 'Username (alias) already taken. Try another one!' });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: {
        alias,
        passwordHash,
        schoolId,
        favoritePosition: favoritePosition || 'Midfielder',
      },
      select: {
        id: true,
        alias: true,
        schoolId: true,
        favoritePosition: true,
        reputationScore: true,
        matchesPlayed: true,
        goalsScored: true,
        manOfTheMatch: true,
        createdAt: true,
        school: { select: { name: true, institutionType: true } },
      },
    });

    const token = jwt.sign(
      { userId: user.id, schoolId: user.schoolId, alias: user.alias },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: '365d' }
    );

    res.status(201).json({ token, user });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// POST /api/auth/login
authRouter.post('/login', validate(loginSchema), async (req: Request, res: Response) => {
  try {
    const { alias, password } = req.body;

    const user = await prisma.user.findUnique({
      where: { alias },
      include: { school: { select: { name: true, institutionType: true } } },
    });

    if (!user) {
      res.status(401).json({ error: 'Invalid username or password' });
      return;
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      res.status(401).json({ error: 'Invalid username or password' });
      return;
    }

    const token = jwt.sign(
      { userId: user.id, schoolId: user.schoolId, alias: user.alias },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: '365d' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        alias: user.alias,
        schoolId: user.schoolId,
        favoritePosition: user.favoritePosition,
        reputationScore: user.reputationScore,
        matchesPlayed: user.matchesPlayed,
        goalsScored: user.goalsScored,
        manOfTheMatch: user.manOfTheMatch,
        school: user.school,
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed' });
  }
});

// GET /api/auth/me
authRouter.get('/me', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      select: {
        id: true,
        alias: true,
        schoolId: true,
        favoritePosition: true,
        reputationScore: true,
        matchesPlayed: true,
        goalsScored: true,
        manOfTheMatch: true,
        createdAt: true,
        school: { select: { name: true, institutionType: true } },
        favoritePitches: {
          include: {
            pitch: true
          }
        }
      },
    });

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json({ user });
  } catch (err) {
    console.error('Fetch user error:', err);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

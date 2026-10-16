import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';
import { userStore } from '../db/userStore';
import { generateId } from '../utils/id';
import { config } from '../config';
import { PRECONFIGURED_STUDENTS, getStudentById } from '../data/students';
import { generateActionPlan } from '../services/actionPlan';
import { analysisStore } from '../db/analysisStore';
import { UserRecord } from '../models/types';

const router = Router();

/**
 * POST /api/v1/auth/signup
 * Production user registration with password hashing and JWT token issuance.
 */
router.post(
  '/signup',
  [
    body('name').trim().notEmpty().withMessage('Full name is required'),
    body('email').isEmail().normalizeEmail().withMessage('A valid email address is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
    body('targetRole').optional().trim(),
    body('githubUsername').optional().trim(),
  ],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        status: 'error',
        message: errors.array()[0].msg,
        errors: errors.array(),
      });
      return;
    }

    try {
      const { name, email, password, targetRole, githubUsername, bio } = req.body;
      const cleanEmail = email.toLowerCase().trim();

      // Check if user already exists
      const existing = await userStore.getUserByEmail(cleanEmail);
      if (existing) {
        res.status(409).json({
          status: 'error',
          message: 'An account with this email address already exists. Please login instead.',
        });
        return;
      }

      // Hash password
      const saltRounds = 10;
      const passwordHash = await bcrypt.hash(password, saltRounds);

      const now = new Date().toISOString();
      const newUser: UserRecord = {
        id: generateId(),
        name: name.trim(),
        email: cleanEmail,
        passwordHash,
        role: targetRole || 'Software Engineering Student',
        targetRoles: targetRole ? [targetRole.trim()] : ['Full Stack Developer', 'Software Engineer Intern'],
        githubUsername: (githubUsername || '').replace(/^@/, '').trim(),
        bio: bio || '',
        createdAt: now,
        updatedAt: now,
      };

      await userStore.saveUser(newUser);

      // Sign JWT
      const token = jwt.sign(
        { userId: newUser.id, email: newUser.email },
        config.jwtSecret,
        { expiresIn: '7d' }
      );

      const publicUser = userStore.toPublicUser(newUser);

      res.status(201).json({
        status: 'success',
        message: 'Account created successfully',
        data: {
          user: publicUser,
          token,
        },
      });
    } catch (err: any) {
      console.error('Signup error:', err);
      res.status(500).json({
        status: 'error',
        message: err.message || 'Failed to create account',
      });
    }
  }
);

/**
 * POST /api/v1/auth/login
 * User login with password verification and JWT token issuance.
 */
router.post(
  '/login',
  [
    body('email').isEmail().normalizeEmail().withMessage('A valid email address is required'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        status: 'error',
        message: errors.array()[0].msg,
        errors: errors.array(),
      });
      return;
    }

    try {
      const { email, password } = req.body;
      const cleanEmail = email.toLowerCase().trim();

      const user = await userStore.getUserByEmail(cleanEmail);
      if (!user) {
        res.status(401).json({
          status: 'error',
          message: 'Invalid email or password',
        });
        return;
      }

      // Verify password
      const isMatch = await bcrypt.compare(password, user.passwordHash);
      if (!isMatch) {
        res.status(401).json({
          status: 'error',
          message: 'Invalid email or password',
        });
        return;
      }

      // Sign JWT
      const token = jwt.sign(
        { userId: user.id, email: user.email },
        config.jwtSecret,
        { expiresIn: '7d' }
      );

      const publicUser = userStore.toPublicUser(user);

      res.status(200).json({
        status: 'success',
        message: `Welcome back, ${publicUser.name}`,
        data: {
          user: publicUser,
          token,
        },
      });
    } catch (err: any) {
      console.error('Login error:', err);
      res.status(500).json({
        status: 'error',
        message: err.message || 'Failed to log in',
      });
    }
  }
);

/**
 * GET /api/v1/auth/me
 * Returns the currently authenticated user profile.
 */
router.get('/me', (req: Request, res: Response) => {
  if (!req.user) {
    res.status(401).json({
      status: 'error',
      message: 'Not authenticated',
    });
    return;
  }

  res.status(200).json({
    status: 'success',
    data: req.user,
  });
});

/**
 * POST /api/v1/auth/logout
 * Client-side logout acknowledgment.
 */
router.post('/logout', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'success',
    message: 'Logged out successfully',
  });
});

/**
 * GET /api/v1/auth/action-plan
 * Generates and returns a personalized career action plan for the authenticated student.
 */
router.get('/action-plan', async (req: Request, res: Response) => {
  try {
    const student = req.user;
    if (!student) {
      res.status(401).json({ status: 'error', message: 'Unauthorized' });
      return;
    }

    const analyses = await analysisStore.getAllAnalyses(req.userId);
    let latestAssessments: any[] = [];
    if (analyses.length > 0) {
      const latestVer = await analysisStore.getLatestAssessmentVersion(analyses[0].id);
      if (latestVer?.assessments) {
        latestAssessments = latestVer.assessments;
      }
    }

    const plan = generateActionPlan(student, latestAssessments);

    res.status(200).json({
      status: 'success',
      data: plan,
    });
  } catch (err: any) {
    res.status(500).json({
      status: 'error',
      message: err.message || 'Failed to generate personalized action plan',
    });
  }
});

/**
 * GET /api/v1/auth/students
 * Returns all real registered users plus test accounts.
 */
router.get('/students', async (_req: Request, res: Response) => {
  try {
    const dbUsers = await userStore.getAllUsers();
    const publicDbUsers = dbUsers.map(u => userStore.toPublicUser(u));

    // Combine with preconfigured test accounts (avoiding duplicate IDs)
    const existingIds = new Set(publicDbUsers.map(u => u.id));
    const combined = [
      ...publicDbUsers,
      ...PRECONFIGURED_STUDENTS.filter(s => !existingIds.has(s.id)),
    ];

    res.status(200).json({
      status: 'success',
      data: combined,
    });
  } catch (err: any) {
    res.status(200).json({
      status: 'success',
      data: PRECONFIGURED_STUDENTS,
    });
  }
});

/**
 * POST /api/v1/auth/switch
 * Dev switch helper
 */
router.post('/switch', async (req: Request, res: Response) => {
  const { studentId, userId } = req.body;
  const targetId = (studentId || userId || '').trim();

  if (!targetId) {
    res.status(400).json({
      status: 'error',
      message: 'studentId or userId is required',
    });
    return;
  }

  // Look up in database
  const dbUser = await userStore.getUser(targetId);
  if (dbUser) {
    const pub = userStore.toPublicUser(dbUser);
    const token = jwt.sign(
      { userId: pub.id, email: pub.email },
      config.jwtSecret,
      { expiresIn: '7d' }
    );
    res.status(200).json({
      status: 'success',
      message: `Switched to ${pub.name}`,
      data: { user: pub, token },
    });
    return;
  }

  // Fallback to preconfigured
  const student = getStudentById(targetId);
  if (student) {
    const token = jwt.sign(
      { userId: student.id, email: student.email },
      config.jwtSecret,
      { expiresIn: '7d' }
    );
    res.status(200).json({
      status: 'success',
      message: `Switched to ${student.name}`,
      data: { user: student, token },
    });
    return;
  }

  res.status(404).json({
    status: 'error',
    message: `Account with ID '${targetId}' not found`,
  });
});

export default router;

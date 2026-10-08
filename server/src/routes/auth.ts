import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient, Role } from '@prisma/client';
import { z } from 'zod';
import { authenticate, AuthRequest } from '../middlewares';

const router = Router();
const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretjwtkey';

const registerSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6)
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string()
});

router.post('/register', async (req, res, next) => {
  try {
    const data = registerSchema.parse(req.body);
    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) return res.status(400).json({ error: 'Email in use' });

    const hash = await bcrypt.hash(data.password, 10);
    const user = await prisma.user.create({
      data: { name: data.name, email: data.email, password_hash: hash, role: Role.CITIZEN }
    });
    res.json({ id: user.id, email: user.email });
  } catch (err) { next(err); }
});

router.post('/login', async (req, res, next) => {
  try {
    const data = loginSchema.parse(req.body);
    const user = await prisma.user.findUnique({ where: { email: data.email } });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const valid = await bcrypt.compare(data.password, user.password_hash);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

    const accessToken = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '15m' });
    const refreshToken = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '7d' });

    res.cookie('refresh_token', refreshToken, { httpOnly: true, maxAge: 7*24*60*60*1000 });
    res.json({ accessToken, user: { id: user.id, name: user.name, role: user.role } });
  } catch (err) { next(err); }
});

router.post('/refresh', async (req, res, next) => {
  try {
    const token = req.cookies.refresh_token;
    if (!token) return res.status(401).json({ error: 'No refresh token' });

    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const user = await prisma.user.findUnique({ where: { id: decoded.id } });
    if (!user) return res.status(401).json({ error: 'Invalid token' });

    const accessToken = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '15m' });
    res.json({ accessToken });
  } catch (err) { next(err); }
});

router.post('/logout', (req, res) => {
  res.clearCookie('refresh_token');
  res.json({ success: true });
});

router.get('/me', authenticate, (req: AuthRequest, res) => {
  res.json({ user: req.user });
});

router.post('/forgot-password', async (req, res, next) => {
  try {
    const { email } = req.body;
    console.log(`[Email Stub] Reset password link sent to ${email}: http://localhost:5173/reset-password?token=stub`);
    res.json({ success: true });
  } catch (err) { next(err); }
});

export default router;

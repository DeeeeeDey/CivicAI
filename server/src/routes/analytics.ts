import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

router.get('/summary', async (req, res, next) => {
  try {
    const total = await prisma.complaint.count();
    const resolved = await prisma.complaint.count({ where: { status: 'VERIFIED' } });
    res.json({ total, resolved });
  } catch (err) { next(err); }
});

export default router;

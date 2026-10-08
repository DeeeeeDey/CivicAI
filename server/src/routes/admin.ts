import { Router } from 'express';
import { PrismaClient, Role } from '@prisma/client';
import { authenticate, requireRole } from '../middlewares';

const router = Router();
const prisma = new PrismaClient();
router.use(authenticate, requireRole(Role.ADMIN));

router.get('/users', async (req, res, next) => {
  try {
    const users = await prisma.user.findMany();
    res.json(users);
  } catch (err) { next(err); }
});

export default router;

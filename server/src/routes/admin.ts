import { Router } from 'express';
import { PrismaClient, Role } from '@prisma/client';
import { authenticate, requireRole } from '../middlewares';

const router = Router();
const prisma = new PrismaClient();
router.use(authenticate, requireRole(Role.ADMIN));

router.get('/stats', async (req, res, next) => {
  try {
    const totalUsers = await prisma.user.count();
    const totalComplaints = await prisma.complaint.count();
    const resolvedComplaints = await prisma.complaint.count({ where: { status: 'RESOLVED' } });
    
    // Group users by role
    const usersByRoleRaw = await prisma.user.groupBy({
       by: ['role'],
       _count: { role: true }
    });
    const usersByRole = usersByRoleRaw.reduce((acc, curr) => {
       acc[curr.role] = curr._count.role;
       return acc;
    }, {} as Record<string, number>);

    res.json({
       totalUsers,
       totalComplaints,
       resolvedComplaints,
       usersByRole
    });
  } catch (err) { next(err); }
});

router.get('/users', async (req, res, next) => {
  try {
    const users = await prisma.user.findMany({
       orderBy: { createdAt: 'desc' }
    });
    res.json(users);
  } catch (err) { next(err); }
});

router.patch('/users/:id/role', async (req, res, next) => {
  try {
    const { role } = req.body;
    if (!Object.values(Role).includes(role)) {
       return res.status(400).json({ error: 'Invalid role' });
    }
    const updated = await prisma.user.update({
       where: { id: req.params.id },
       data: { role }
    });
    res.json(updated);
  } catch (err) { next(err); }
});

export default router;

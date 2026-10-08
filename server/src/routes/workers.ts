import { Router } from 'express';
import { PrismaClient, Role } from '@prisma/client';
import { authenticate, requireRole, AuthRequest } from '../middlewares';
import { transitionComplaint } from '../services/stateMachine';

const router = Router();
const prisma = new PrismaClient();
router.use(authenticate, requireRole(Role.WORKER));

router.get('/tasks', async (req: AuthRequest, res, next) => {
  try {
    const tasks = await prisma.assignment.findMany({
      where: { workerId: req.user.id, completedAt: null },
      include: { complaint: true }
    });
    res.json(tasks);
  } catch (err) { next(err); }
});

router.post('/:id/start', async (req: AuthRequest, res, next) => {
  try {
    const comp = await transitionComplaint(req.params.id, 'IN_PROGRESS', req.user.id, 'Worker started job');
    res.json(comp);
  } catch (err) { next(err); }
});

router.post('/:id/resolve', async (req: AuthRequest, res, next) => {
  try {
    const { proofImageUrl, description, latitude, longitude } = req.body;
    
    await prisma.resolution.create({
      data: {
        complaintId: req.params.id,
        workerId: req.user.id,
        proofImageUrl,
        description,
        latitude,
        longitude,
        verificationStatus: 'PENDING'
      }
    });

    const comp = await transitionComplaint(req.params.id, 'RESOLVED', req.user.id, 'Worker uploaded proof');
    res.json(comp);
  } catch (err) { next(err); }
});

export default router;

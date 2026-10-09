import { Router } from 'express';
import { PrismaClient, Role } from '@prisma/client';
import { authenticate, requireRole, AuthRequest } from '../middlewares';
import { transitionComplaint, InvalidStateTransitionError } from '../services/stateMachine';

const router = Router();
const prisma = new PrismaClient();
router.use(authenticate, requireRole(Role.OFFICER, Role.ADMIN));

router.get('/stats', async (req: AuthRequest, res, next) => {
  try {
    const pendingReview = await prisma.complaint.count({ where: { status: 'REPORTED' } });
    const activeTasks = await prisma.complaint.count({ where: { status: 'IN_PROGRESS' } });
    
    // Very simple SLA check: REPORTED over 48 hours ago
    const twoDaysAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);
    const slaBreaches = await prisma.complaint.count({
      where: {
        status: { in: ['REPORTED', 'UNDER_REVIEW'] },
        createdAt: { lt: twoDaysAgo }
      }
    });

    res.json({ pendingReview, activeTasks, slaBreaches });
  } catch (err) { next(err); }
});

router.get('/workers', async (req: AuthRequest, res, next) => {
  try {
    const workers = await prisma.user.findMany({
      where: { role: 'WORKER' },
      select: { id: true, name: true, email: true }
    });
    res.json(workers);
  } catch (err) { next(err); }
});

router.post('/:id/status', async (req: AuthRequest, res, next) => {
  try {
    const { status, notes } = req.body;
    const comp = await transitionComplaint(req.params.id, status, req.user.id, notes);
    res.json(comp);
  } catch (err) {
    if (err instanceof InvalidStateTransitionError) {
      return res.status(409).json({ error: err.message });
    }
    next(err);
  }
});

router.post('/:id/override', async (req: AuthRequest, res, next) => {
  try {
    const { categoryId, departmentId, severity, reason } = req.body;
    if (!reason) return res.status(400).json({ error: 'Reason required' });

    const comp = await prisma.complaint.update({
      where: { id: req.params.id },
      data: { categoryId, departmentId, severity }
    });

    await prisma.auditLog.create({
      data: {
        userId: req.user.id,
        complaintId: comp.id,
        action: 'OVERRIDE',
        details: JSON.stringify({ categoryId, departmentId, severity, reason })
      }
    });
    
    res.json(comp);
  } catch (err) { next(err); }
});

router.post('/:id/assign', async (req: AuthRequest, res, next) => {
  try {
    const { workerId } = req.body;
    await prisma.assignment.create({
      data: { complaintId: req.params.id, officerId: req.user.id, workerId }
    });
    const comp = await transitionComplaint(req.params.id, 'ASSIGNED', req.user.id, `Assigned to worker`);
    res.json(comp);
  } catch (err) { next(err); }
});

export default router;

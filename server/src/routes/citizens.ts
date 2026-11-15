import { Router } from 'express';
import { PrismaClient, Role } from '@prisma/client';
import { authenticate, requireRole, AuthRequest } from '../middlewares';
import { transitionComplaint } from '../services/stateMachine';

const router = Router();
const prisma = new PrismaClient();
router.use(authenticate, requireRole(Role.CITIZEN));

router.get('/notifications', async (req: AuthRequest, res, next) => {
  try {
    const notifications = await prisma.notification.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' }
    });
    res.json(notifications);
  } catch (err) { next(err); }
});

router.get('/notifications/unread-count', async (req: AuthRequest, res, next) => {
  try {
    const count = await prisma.notification.count({
      where: { userId: req.user.id, read: false }
    });
    res.json({ unreadCount: count });
  } catch (err) { next(err); }
});

router.post('/notifications/read-all', async (req: AuthRequest, res, next) => {
  try {
    await prisma.notification.updateMany({
      where: { userId: req.user.id, read: false },
      data: { read: true }
    });
    res.json({ success: true });
  } catch (err) { next(err); }
});

router.post('/notifications/:id/read', async (req: AuthRequest, res, next) => {
  try {
    const notificationId = req.params.id as string;
    await prisma.notification.updateMany({
      where: { id: notificationId, userId: req.user.id },
      data: { read: true }
    });
    res.json({ success: true });
  } catch (err) { next(err); }
});

router.post('/:id/verify', async (req: AuthRequest, res, next) => {
  try {
    const { isResolved, rating, reason } = req.body;
    const complaintId = req.params.id as string;
    
    if (isResolved) {
      const comp = await transitionComplaint(complaintId, 'VERIFIED', req.user.id, 'Citizen verified');
      await prisma.resolution.updateMany({
        where: { complaintId },
        data: { verificationStatus: 'VERIFIED', citizenRating: rating }
      });
      res.json(comp);
    } else {
      const comp = await transitionComplaint(complaintId, 'REOPENED', req.user.id, `Citizen rejected: ${reason}`);
      res.json(comp);
    }
  } catch (err) { next(err); }
});

export default router;

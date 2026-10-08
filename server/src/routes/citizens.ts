import { Router } from 'express';
import { PrismaClient, Role } from '@prisma/client';
import { authenticate, requireRole, AuthRequest } from '../middlewares';
import { transitionComplaint } from '../services/stateMachine';

const router = Router();
const prisma = new PrismaClient();
router.use(authenticate, requireRole(Role.CITIZEN));

router.post('/:id/verify', async (req: AuthRequest, res, next) => {
  try {
    const { isResolved, rating, reason } = req.body;
    
    if (isResolved) {
      const comp = await transitionComplaint(req.params.id, 'VERIFIED', req.user.id, 'Citizen verified');
      await prisma.resolution.updateMany({
        where: { complaintId: req.params.id },
        data: { verificationStatus: 'VERIFIED', citizenRating: rating }
      });
      res.json(comp);
    } else {
      const comp = await transitionComplaint(req.params.id, 'REOPENED', req.user.id, `Citizen rejected: ${reason}`);
      res.json(comp);
    }
  } catch (err) { next(err); }
});

export default router;

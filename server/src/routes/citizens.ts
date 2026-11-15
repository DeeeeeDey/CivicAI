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

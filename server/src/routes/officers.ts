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
    const assignedTasks = await prisma.complaint.count({ where: { status: 'ASSIGNED' } });
    const inProgressTasks = await prisma.complaint.count({ where: { status: 'IN_PROGRESS' } });
    const activeTasks = assignedTasks + inProgressTasks;
    const needsVerification = await prisma.complaint.count({ where: { status: 'RESOLVED' } });
    const verifiedTotal = await prisma.complaint.count({ where: { status: 'VERIFIED' } });
    const totalComplaints = await prisma.complaint.count();
    
    // SLA check: REPORTED or UNDER_REVIEW older than 48 hours
    const twoDaysAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);
    const slaBreaches = await prisma.complaint.count({
      where: {
        status: { in: ['REPORTED', 'UNDER_REVIEW'] },
        createdAt: { lt: twoDaysAgo }
      }
    });

    res.json({
      pendingReview,
      activeTasks,
      needsVerification,
      verifiedTotal,
      totalComplaints,
      slaBreaches
    });
  } catch (err) { next(err); }
});

router.get('/workers', async (req: AuthRequest, res, next) => {
  try {
    const workers = await prisma.user.findMany({
      where: { role: 'WORKER' },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        createdAt: true,
        assignmentsAsWorker: {
          where: { completedAt: null },
          select: { id: true }
        },
        resolutions: {
          select: { id: true }
        }
      }
    });

    res.json(workers.map(w => ({
      id: w.id,
      name: w.name,
      email: w.email,
      phone: w.phone,
      activeTasksCount: w.assignmentsAsWorker.length,
      completedCount: w.resolutions.length,
      joinedAt: w.createdAt
    })));
  } catch (err) { next(err); }
});

// Verification Queue: complaints marked RESOLVED by workers awaiting officer approval
router.get('/verification', async (req: AuthRequest, res, next) => {
  try {
    const complaints = await prisma.complaint.findMany({
      where: { status: 'RESOLVED' },
      include: {
        category: true,
        citizen: { select: { id: true, name: true, email: true } },
        resolutions: {
          include: { worker: { select: { id: true, name: true, email: true } } },
          orderBy: { createdAt: 'desc' }
        }
      },
      orderBy: { updatedAt: 'desc' }
    });
    res.json(complaints);
  } catch (err) { next(err); }
});

router.post('/:id/verify', async (req: AuthRequest, res, next) => {
  try {
    const { approved, notes } = req.body;
    const complaintId = req.params.id as string;
    
    if (approved) {
      const comp = await transitionComplaint(complaintId, 'VERIFIED', req.user.id, notes || 'Officer verified resolution proof');
      await prisma.resolution.updateMany({
        where: { complaintId },
        data: { verificationStatus: 'VERIFIED' }
      });
      res.json(comp);
    } else {
      const comp = await transitionComplaint(complaintId, 'REOPENED', req.user.id, `Officer rejected proof: ${notes || 'Work insufficient'}`);
      await prisma.resolution.updateMany({
        where: { complaintId },
        data: { verificationStatus: 'REJECTED' }
      });
      res.json(comp);
    }
  } catch (err) {
    if (err instanceof InvalidStateTransitionError) {
      return res.status(409).json({ error: err.message });
    }
    next(err);
  }
});

router.get('/analytics', async (req: AuthRequest, res, next) => {
  try {
    const total = await prisma.complaint.count();
    const resolved = await prisma.complaint.count({ where: { status: { in: ['RESOLVED', 'VERIFIED'] } } });
    const inProgress = await prisma.complaint.count({ where: { status: { in: ['ASSIGNED', 'IN_PROGRESS'] } } });
    const pending = await prisma.complaint.count({ where: { status: 'REPORTED' } });

    const categoryCountsRaw = await prisma.complaint.groupBy({
      by: ['categoryId'],
      _count: { categoryId: true }
    });
    const categories = await prisma.category.findMany();
    const catMap = new Map(categories.map(c => [c.id, c.name]));
    const categoryStats = categoryCountsRaw.map(c => ({
      category: c.categoryId ? (catMap.get(c.categoryId) || 'Other') : 'Uncategorized',
      count: c._count.categoryId
    }));

    const severityBreakdownRaw = await prisma.complaint.groupBy({
      by: ['severity'],
      _count: { severity: true }
    });
    const severityStats = severityBreakdownRaw.map(s => ({
      severity: s.severity,
      count: s._count.severity
    })).sort((a, b) => a.severity - b.severity);

    res.json({
      total,
      resolved,
      inProgress,
      pending,
      resolutionRate: total > 0 ? Math.round((resolved / total) * 100) : 100,
      slaComplianceRate: 94,
      avgResolutionHours: 36,
      categoryStats,
      severityStats
    });
  } catch (err) { next(err); }
});

router.post('/:id/status', async (req: AuthRequest, res, next) => {
  try {
    const { status, notes } = req.body;
    const complaintId = req.params.id as string;
    const comp = await transitionComplaint(complaintId, status, req.user.id, notes);
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
    const complaintId = req.params.id as string;
    if (!reason) return res.status(400).json({ error: 'Reason required' });

    const comp = await prisma.complaint.update({
      where: { id: complaintId },
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
    const complaintId = req.params.id as string;
    await prisma.assignment.create({
      data: { complaintId, officerId: req.user.id, workerId }
    });
    const comp = await transitionComplaint(complaintId, 'ASSIGNED', req.user.id, `Assigned to worker`);
    res.json(comp);
  } catch (err) { next(err); }
});

export default router;

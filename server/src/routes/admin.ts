import { Router } from 'express';
import { PrismaClient, Role } from '@prisma/client';
import { authenticate, requireRole, AuthRequest } from '../middlewares';
import { purgeExpiredResolvedComplaints } from '../services/retention';

const router = Router();
const prisma = new PrismaClient();
router.use(authenticate, requireRole(Role.ADMIN));

// In-memory / dynamic system settings
let systemSettings = {
  slaTargetHours: 48,
  aiConfidenceThreshold: 75,
  emergencyBroadcast: false,
  emergencyMessage: '',
  allowPublicTracking: true,
  autoEmailNotifications: true
};

// 1. Comprehensive System Stats & Overview
router.get('/stats', async (req, res, next) => {
  try {
    const totalUsers = await prisma.user.count();
    const totalComplaints = await prisma.complaint.count();
    const resolvedComplaints = await prisma.complaint.count({ where: { status: { in: ['RESOLVED', 'VERIFIED'] } } });
    const pendingReview = await prisma.complaint.count({ where: { status: 'REPORTED' } });
    const inProgress = await prisma.complaint.count({ where: { status: 'IN_PROGRESS' } });
    const assigned = await prisma.complaint.count({ where: { status: 'ASSIGNED' } });
    
    // Simple SLA breach check (> 48h in REPORTED/UNDER_REVIEW)
    const breachThreshold = new Date(Date.now() - (systemSettings.slaTargetHours || 48) * 60 * 60 * 1000);
    const slaBreaches = await prisma.complaint.count({
      where: {
        status: { in: ['REPORTED', 'UNDER_REVIEW'] },
        createdAt: { lt: breachThreshold }
      }
    });

    // Group users by role
    const usersByRoleRaw = await prisma.user.groupBy({
      by: ['role'],
      _count: { role: true }
    });
    const usersByRole = usersByRoleRaw.reduce((acc, curr) => {
      acc[curr.role] = curr._count.role;
      return acc;
    }, {} as Record<string, number>);

    // Recent 6 complaints
    const recentComplaints = await prisma.complaint.findMany({
      take: 6,
      orderBy: { createdAt: 'desc' },
      include: {
        category: true,
        citizen: { select: { name: true, email: true } }
      }
    });

    // Breakdown by category
    const categoryCountsRaw = await prisma.complaint.groupBy({
      by: ['categoryId'],
      _count: { categoryId: true }
    });
    const categories = await prisma.category.findMany();
    const categoryMap = new Map(categories.map(c => [c.id, c.name]));
    const categoryBreakdown = categoryCountsRaw.map(c => ({
      name: c.categoryId ? (categoryMap.get(c.categoryId) || 'Other') : 'Uncategorized',
      count: c._count.categoryId
    }));

    res.json({
      totalUsers,
      totalComplaints,
      resolvedComplaints,
      pendingReview,
      inProgress,
      assigned,
      slaBreaches,
      usersByRole,
      recentComplaints,
      categoryBreakdown
    });
  } catch (err) { next(err); }
});

// 2. User Management
router.get('/users', async (req, res, next) => {
  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        createdAt: true,
        _count: {
          select: { complaints: true, assignmentsAsWorker: true }
        }
      }
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
    const userId = req.params.id as string;
    const updated = await prisma.user.update({
      where: { id: userId },
      data: { role }
    });
    res.json(updated);
  } catch (err) { next(err); }
});

// 3. Master Complaints Explorer
router.get('/complaints', async (req, res, next) => {
  try {
    const complaints = await prisma.complaint.findMany({
      include: {
        category: true,
        citizen: { select: { id: true, name: true, email: true } },
        assignments: {
          include: { worker: { select: { id: true, name: true, email: true } } }
        },
        resolutions: { orderBy: { createdAt: 'desc' } }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(complaints);
  } catch (err) { next(err); }
});

router.delete('/complaints/:id', async (req, res, next) => {
  try {
    const complaintId = req.params.id as string;
    // Delete cascading references first
    await prisma.auditLog.deleteMany({ where: { complaintId } });
    await prisma.statusHistory.deleteMany({ where: { complaintId } });
    await prisma.complaintSupporter.deleteMany({ where: { complaintId } });
    await prisma.assignment.deleteMany({ where: { complaintId } });
    await prisma.resolution.deleteMany({ where: { complaintId } });
    await prisma.aiAnalysis.deleteMany({ where: { complaintId } });
    await prisma.comment.deleteMany({ where: { complaintId } });
    await prisma.complaint.delete({ where: { id: complaintId } });

    res.json({ success: true, message: 'Complaint purged successfully' });
  } catch (err) { next(err); }
});

router.post('/retention/purge', async (req, res, next) => {
  try {
    const result = await purgeExpiredResolvedComplaints();
    res.json(result);
  } catch (err) { next(err); }
});

// 4. Platform Settings
router.get('/settings', (req, res) => {
  res.json({
    settings: systemSettings,
    services: {
      database: 'Connected (PostgreSQL / Supabase)',
      aiEngine: process.env.GEMINI_API_KEY ? 'Active (Google Gemini)' : 'Unconfigured',
      emailService: process.env.RESEND_API_KEY ? 'Active (Resend)' : 'Not Configured (Optional)',
      cloudStorage: process.env.SUPABASE_URL ? 'Active (Supabase Storage)' : 'Local'
    }
  });
});

router.post('/settings', (req, res) => {
  const {
    slaTargetHours,
    aiConfidenceThreshold,
    emergencyBroadcast,
    emergencyMessage,
    allowPublicTracking,
    autoEmailNotifications
  } = req.body;

  if (slaTargetHours !== undefined) systemSettings.slaTargetHours = Number(slaTargetHours);
  if (aiConfidenceThreshold !== undefined) systemSettings.aiConfidenceThreshold = Number(aiConfidenceThreshold);
  if (emergencyBroadcast !== undefined) systemSettings.emergencyBroadcast = Boolean(emergencyBroadcast);
  if (emergencyMessage !== undefined) systemSettings.emergencyMessage = String(emergencyMessage);
  if (allowPublicTracking !== undefined) systemSettings.allowPublicTracking = Boolean(allowPublicTracking);
  if (autoEmailNotifications !== undefined) systemSettings.autoEmailNotifications = Boolean(autoEmailNotifications);

  res.json({ success: true, settings: systemSettings });
});

export default router;

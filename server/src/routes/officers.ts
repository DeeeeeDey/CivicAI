import { sendClassificationUpdateEmail, sendDiscardUpdateEmail, sendStatusUpdateEmail } from '../services/email';
import { Router } from 'express';
import { PrismaClient, Role } from '@prisma/client';
import { authenticate, requireRole, AuthRequest } from '../middlewares';
import { transitionComplaint, InvalidStateTransitionError } from '../services/stateMachine';

const router = Router();
const prisma = new PrismaClient();
router.use(authenticate, requireRole(Role.OFFICER, Role.ADMIN));


router.get('/categories', async (req: AuthRequest, res, next) => {
  try {
    const categories = await prisma.category.findMany({
      include: { department: true },
      orderBy: { name: 'asc' }
    });
    res.json(categories);
  } catch (err) { next(err); }
});

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

const reclassifyHandler = async (req: AuthRequest, res: any, next: any) => {
  try {
    const complaintId = req.params.id as string;
    const { categoryId, categoryName, severity, departmentId, reason } = req.body;
    if (!reason || !reason.trim()) {
      return res.status(400).json({ error: 'Reason for reclassification is required.' });
    }

    const comp = await prisma.complaint.findUnique({
      where: { id: complaintId },
      include: { category: true, citizen: true }
    });
    if (!comp) return res.status(404).json({ error: 'Complaint not found' });

    const oldCatName = comp.category?.name || 'General';

    // Resolve target category
    let targetCatId = categoryId;
    let targetCatName = categoryName;

    if (categoryName && !categoryId) {
      let catRecord = await prisma.category.findUnique({ where: { name: categoryName.trim() } });
      if (!catRecord) {
        catRecord = await prisma.category.create({
          data: { name: categoryName.trim() }
        });
      }
      targetCatId = catRecord.id;
      targetCatName = catRecord.name;
    } else if (categoryId) {
      const catRecord = await prisma.category.findUnique({ where: { id: categoryId } });
      if (catRecord) targetCatName = catRecord.name;
    }

    const updated = await prisma.complaint.update({
      where: { id: complaintId },
      data: {
        categoryId: targetCatId,
        departmentId: departmentId || comp.departmentId,
        severity: typeof severity === 'number' ? severity : comp.severity
      },
      include: { category: true, citizen: true }
    });

    // 1. Audit log
    await prisma.auditLog.create({
      data: {
        userId: req.user.id,
        complaintId: comp.id,
        action: 'RECLASSIFIED',
        details: JSON.stringify({
          fromCategory: oldCatName,
          toCategory: targetCatName,
          severity: updated.severity,
          reason
        })
      }
    });

    // 2. Status History
    await prisma.statusHistory.create({
      data: {
        complaintId: comp.id,
        status: comp.status,
        notes: `Officer reclassified category from "${oldCatName}" to "${targetCatName}". Reason: ${reason}`
      }
    });

    // 3. Notify reporting citizen via in-app notification and email
    if (comp.citizen?.email) {
      sendClassificationUpdateEmail(
        comp.citizen.email,
        comp.publicId,
        oldCatName,
        targetCatName || 'Updated Category',
        reason,
        comp.citizenId
      ).catch(e => console.warn('Non-fatal: email send failed:', e));
    }

    // 4. Notify citizens of merged duplicate tickets
    const mergedTickets = await prisma.complaint.findMany({
      where: {
        status: 'REJECTED',
        aiAnalysis: { duplicateOf: comp.publicId }
      },
      include: { citizen: true }
    });
    for (const m of mergedTickets) {
      if (m.citizen?.email && m.citizenId !== comp.citizenId) {
        sendClassificationUpdateEmail(
          m.citizen.email,
          comp.publicId,
          oldCatName,
          targetCatName || 'Updated Category',
          `Update on your merged issue #${m.publicId}: Primary ticket was reclassified. Reason: ${reason}`,
          m.citizenId
        ).catch(e => console.warn('Non-fatal: email send to merged citizen failed:', e));
      }
    }

    res.json(updated);
  } catch (err) { next(err); }
};

router.post('/:id/reclassify', reclassifyHandler);
router.post('/:id/override', reclassifyHandler);

router.post('/:id/discard', async (req: AuthRequest, res, next) => {
  try {
    const complaintId = req.params.id as string;
    const { reason, markImproperCategory } = req.body;
    if (!reason || !reason.trim()) {
      return res.status(400).json({ error: 'Reason is required to discard a report as false/invalid.' });
    }

    const comp = await prisma.complaint.findUnique({
      where: { id: complaintId },
      include: { category: true, citizen: true }
    });
    if (!comp) return res.status(404).json({ error: 'Complaint not found' });

    // Optionally mark category as Improper / Non-Civic
    let categoryUpdate: any = {};
    if (markImproperCategory) {
      let improperCat = await prisma.category.findUnique({ where: { name: 'Improper / Non-Civic Category' } });
      if (!improperCat) {
        improperCat = await prisma.category.create({ data: { name: 'Improper / Non-Civic Category' } });
      }
      categoryUpdate.categoryId = improperCat.id;
    }

    // Cancel active assignments on this ticket
    await prisma.assignment.updateMany({
      where: { complaintId, completedAt: null },
      data: { completedAt: new Date() }
    });

    const updated = await prisma.complaint.update({
      where: { id: complaintId },
      data: {
        status: 'REJECTED',
        ...categoryUpdate
      },
      include: { category: true, citizen: true }
    });

    // 1. Audit Log
    await prisma.auditLog.create({
      data: {
        userId: req.user.id,
        complaintId: comp.id,
        action: 'DISCARD_FALSE_REPORT',
        details: JSON.stringify({ reason, markImproperCategory: !!markImproperCategory })
      }
    });

    // 2. Status History
    await prisma.statusHistory.create({
      data: {
        complaintId: comp.id,
        status: 'REJECTED',
        notes: `Officer discarded ticket as false/invalid: ${reason}`
      }
    });

    // 3. Notify citizen via in-app & email
    if (comp.citizen?.email) {
      sendDiscardUpdateEmail(
        comp.citizen.email,
        comp.publicId,
        reason,
        comp.citizenId
      ).catch(e => console.warn('Non-fatal: email send failed:', e));
    }

    // 4. Notify merged child tickets
    const mergedTickets = await prisma.complaint.findMany({
      where: {
        status: 'REJECTED',
        aiAnalysis: { duplicateOf: comp.publicId }
      },
      include: { citizen: true }
    });
    for (const m of mergedTickets) {
      if (m.citizen?.email && m.citizenId !== comp.citizenId) {
        sendDiscardUpdateEmail(
          m.citizen.email,
          comp.publicId,
          `Update on your merged issue #${m.publicId}: Primary ticket was discarded as false/invalid. Reason: ${reason}`,
          m.citizenId
        ).catch(e => console.warn('Non-fatal: email send to merged citizen failed:', e));
      }
    }

    res.json(updated);
  } catch (err) { next(err); }
});

router.post('/:id/assign', async (req: AuthRequest, res, next) => {
  try {
    const { workerId, notes } = req.body;
    const complaintId = req.params.id as string;

    const compBefore = await prisma.complaint.findUnique({ where: { id: complaintId } });
    if (!compBefore) return res.status(404).json({ error: 'Complaint not found' });

    let comp = compBefore;
    if (compBefore.status !== 'ASSIGNED') {
      comp = await transitionComplaint(complaintId, 'ASSIGNED', req.user.id, notes || `Assigned to worker`);
    }

    await prisma.assignment.updateMany({
      where: { complaintId, completedAt: null },
      data: { completedAt: new Date() }
    });

    await prisma.assignment.create({
      data: { complaintId, officerId: req.user.id, workerId }
    });

    res.json(comp);
  } catch (err) { next(err); }
});

// Duplicates Queue: complaints with high duplicate probability
router.get('/duplicates', async (req: AuthRequest, res, next) => {
  try {
    const candidates = await prisma.complaint.findMany({
      where: {
        status: { in: ['REPORTED', 'UNDER_REVIEW', 'ASSIGNED', 'IN_PROGRESS'] },
        aiAnalysis: {
          OR: [
            { duplicateProbability: { gte: 0.4 } },
            { duplicateOf: { not: null } }
          ]
        }
      },
      include: {
        category: true,
        citizen: { select: { id: true, name: true, email: true } },
        aiAnalysis: true,
        supporters: true
      },
      orderBy: { createdAt: 'desc' }
    });

    // Populate details of the referenced target ticket for each duplicate
    const enriched = await Promise.all(candidates.map(async (c) => {
      let targetTicket: any = null;
      const targetId = c.aiAnalysis?.duplicateOf;
      if (targetId) {
        targetTicket = await prisma.complaint.findFirst({
          where: {
            OR: [
              { publicId: targetId },
              { id: targetId }
            ]
          },
          include: {
            category: true,
            citizen: { select: { id: true, name: true, email: true } },
            assignments: {
              where: { completedAt: null },
              include: { worker: { select: { name: true, email: true } } }
            }
          }
        });
      }

      return {
        ...c,
        matchedTicket: targetTicket
      };
    }));

    res.json(enriched);
  } catch (err) { next(err); }
});

router.post('/duplicates/:id/merge', async (req: AuthRequest, res, next) => {
  try {
    const complaintId = req.params.id as string;
    const { targetPublicId, notes } = req.body;

    const duplicateComp = await prisma.complaint.findUnique({
      where: { id: complaintId },
      include: { citizen: true, supporters: true, aiAnalysis: true }
    });
    if (!duplicateComp) return res.status(404).json({ error: 'Duplicate complaint not found' });

    const primaryPublicId = targetPublicId || duplicateComp.aiAnalysis?.duplicateOf;
    if (!primaryPublicId) return res.status(400).json({ error: 'Primary complaint reference required' });

    const primaryComp = await prisma.complaint.findFirst({
      where: {
        OR: [
          { publicId: primaryPublicId },
          { id: primaryPublicId }
        ]
      },
      include: { citizen: true }
    });
    if (!primaryComp) return res.status(404).json({ error: 'Primary complaint not found' });

    // 1. Move all supporters from duplicate to primary ticket
    for (const sup of duplicateComp.supporters) {
      await prisma.complaintSupporter.upsert({
        where: {
          complaintId_userId: { complaintId: primaryComp.id, userId: sup.userId }
        },
        update: {},
        create: { complaintId: primaryComp.id, userId: sup.userId }
      });
    }

    // 2. Also register the reporting citizen of duplicate as supporter of primary
    if (duplicateComp.citizenId) {
      await prisma.complaintSupporter.upsert({
        where: {
          complaintId_userId: { complaintId: primaryComp.id, userId: duplicateComp.citizenId }
        },
        update: {},
        create: { complaintId: primaryComp.id, userId: duplicateComp.citizenId }
      });
    }

    // 3. Mark duplicate complaint as REJECTED with clear notes
    const updatedComp = await prisma.complaint.update({
      where: { id: complaintId },
      data: { status: 'REJECTED' }
    });

    await prisma.statusHistory.create({
      data: {
        complaintId: duplicateComp.id,
        status: 'REJECTED',
        notes: `Merged into primary ticket #${primaryComp.publicId}. ${notes || 'Duplicate report merged by triage officer.'}`
      }
    });

    await prisma.aiAnalysis.updateMany({
      where: { complaintId: duplicateComp.id },
      data: { duplicateProbability: 1.0, duplicateOf: primaryComp.publicId }
    });

    // 4. Log in AuditLog
    await prisma.auditLog.create({
      data: {
        userId: req.user.id,
        complaintId: duplicateComp.id,
        action: 'DUPLICATE_MERGED',
        details: JSON.stringify({
          primaryComplaintId: primaryComp.id,
          primaryPublicId: primaryComp.publicId,
          notes: notes || 'Merged by municipal officer'
        })
      }
    });

    // 5. Notify BOTH complaint holders of the merge
    const { sendStatusUpdateEmail } = await import('../services/email');

    // 5a. Notify duplicate ticket holder
    if (duplicateComp.citizen?.email) {
      sendStatusUpdateEmail(
        duplicateComp.citizen.email,
        duplicateComp.publicId,
        'REJECTED',
        `Merged into primary ticket #${primaryComp.publicId}. You are subscribed to #${primaryComp.publicId} and will receive all progress and resolution updates.`,
        duplicateComp.citizenId
      ).catch(e => console.error('Failed to notify duplicate citizen on merge:', e));
    }

    // 5b. Notify primary ticket holder
    if (primaryComp.citizen?.email && primaryComp.citizenId !== duplicateComp.citizenId) {
      sendStatusUpdateEmail(
        primaryComp.citizen.email,
        primaryComp.publicId,
        primaryComp.status,
        `Another community report (${duplicateComp.publicId}) has been merged into your ticket #${primaryComp.publicId}, prioritizing municipal field dispatch.`,
        primaryComp.citizenId
      ).catch(e => console.error('Failed to notify primary citizen on merge:', e));
    }

    res.json({ success: true, primaryComplaint: primaryComp, mergedComplaint: updatedComp });
  } catch (err) { next(err); }
});

router.post('/duplicates/:id/dismiss', async (req: AuthRequest, res, next) => {
  try {
    const complaintId = req.params.id as string;
    const { reason } = req.body;

    await prisma.aiAnalysis.updateMany({
      where: { complaintId },
      data: { duplicateProbability: 0, duplicateOf: null }
    });

    await prisma.statusHistory.create({
      data: {
        complaintId,
        status: 'UNDER_REVIEW',
        notes: `Duplicate flag dismissed by triage officer. ${reason || 'Officer confirmed this is a distinct issue.'}`
      }
    });

    await prisma.auditLog.create({
      data: {
        userId: req.user.id,
        complaintId,
        action: 'DUPLICATE_FLAG_DISMISSED',
        details: JSON.stringify({ reason: reason || 'Distinct civic issue confirmed' })
      }
    });

    res.json({ success: true });
  } catch (err) { next(err); }
});

export default router;

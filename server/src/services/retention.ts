import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const RETENTION_DAYS = 30;

export const getRetentionCutoffDate = () => {
  return new Date(Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000);
};

/**
 * Prunes resolved and verified issues that are older than 30 days.
 * Ensures only active and recently resolved complaints (<= 30 days) remain in the system.
 */
export const purgeExpiredResolvedComplaints = async () => {
  try {
    const cutoff = getRetentionCutoffDate();

    // Find all complaints resolved/verified older than 30 days
    const expiredComplaints = await prisma.complaint.findMany({
      where: {
        status: { in: ['RESOLVED', 'VERIFIED'] },
        OR: [
          { updatedAt: { lt: cutoff } },
          {
            resolutions: {
              some: { createdAt: { lt: cutoff } }
            }
          }
        ]
      },
      select: { id: true, publicId: true }
    });

    if (expiredComplaints.length === 0) {
      return { purgedCount: 0, purgedPublicIds: [] };
    }

    const ids = expiredComplaints.map(c => c.id);
    const publicIds = expiredComplaints.map(c => c.publicId);

    // Delete cascading child records
    await prisma.$transaction([
      prisma.auditLog.deleteMany({ where: { complaintId: { in: ids } } }),
      prisma.statusHistory.deleteMany({ where: { complaintId: { in: ids } } }),
      prisma.complaintSupporter.deleteMany({ where: { complaintId: { in: ids } } }),
      prisma.assignment.deleteMany({ where: { complaintId: { in: ids } } }),
      prisma.resolution.deleteMany({ where: { complaintId: { in: ids } } }),
      prisma.aiAnalysis.deleteMany({ where: { complaintId: { in: ids } } }),
      prisma.comment.deleteMany({ where: { complaintId: { in: ids } } }),
      prisma.complaint.deleteMany({ where: { id: { in: ids } } })
    ]);

    console.log(`[Retention Policy] Purged ${ids.length} resolved complaints older than ${RETENTION_DAYS} days:`, publicIds);
    return { purgedCount: ids.length, purgedPublicIds: publicIds };
  } catch (err) {
    console.error('[Retention Policy] Error purging expired resolved complaints:', err);
    return { purgedCount: 0, error: err };
  }
};

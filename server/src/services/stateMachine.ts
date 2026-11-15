import { ComplaintStatus, PrismaClient } from '@prisma/client';
import { sendStatusUpdateEmail } from './email';

const prisma = new PrismaClient();

const validTransitions: Record<ComplaintStatus, ComplaintStatus[]> = {
  REPORTED: ['UNDER_REVIEW', 'ASSIGNED', 'REJECTED'],
  UNDER_REVIEW: ['ASSIGNED', 'REJECTED'],
  ASSIGNED: ['IN_PROGRESS', 'UNDER_REVIEW', 'ASSIGNED'],
  IN_PROGRESS: ['RESOLVED', 'IN_PROGRESS'],
  RESOLVED: ['VERIFIED', 'REOPENED', 'RESOLVED'],

  REOPENED: ['ASSIGNED'],
  VERIFIED: [],
  REJECTED: [],
};

export class InvalidStateTransitionError extends Error {
  constructor(from: ComplaintStatus, to: ComplaintStatus) {
    super(`Invalid transition from ${from} to ${to}`);
    this.name = 'InvalidStateTransitionError';
  }
}

export const transitionComplaint = async (
  complaintId: string, 
  targetStatus: ComplaintStatus, 
  userId: string, 
  notes?: string
) => {
  const complaint = await prisma.complaint.findUnique({ where: { id: complaintId }, include: { citizen: true } });
  if (!complaint) throw new Error('Complaint not found');

  const allowed = validTransitions[complaint.status];
  if (!allowed.includes(targetStatus)) {
    throw new InvalidStateTransitionError(complaint.status, targetStatus);
  }

  // Perform transition
  const updated = await prisma.$transaction(async (tx) => {
    const comp = await tx.complaint.update({
      where: { id: complaintId },
      data: { status: targetStatus }
    });

    await tx.statusHistory.create({
      data: {
        complaintId,
        status: targetStatus,
        notes: notes || `Transitioned to ${targetStatus}`
      }
    });

    await tx.auditLog.create({
      data: {
        userId,
        complaintId,
        action: 'STATUS_CHANGE',
        details: JSON.stringify({ from: complaint.status, to: targetStatus })
      }
    });

    // Notify citizen via in-app
    await tx.notification.create({
      data: {
        userId: comp.citizenId,
        title: 'Complaint Update',
        message: `Your complaint ${comp.publicId} is now ${targetStatus}.`,
        link: `/track/${comp.publicId}`
      }
    });
    
    // Notify citizen via Email
    if (complaint.citizen && complaint.citizen.email) {
      // Fire and forget (don't block the transaction)
      sendStatusUpdateEmail(complaint.citizen.email, comp.publicId, targetStatus, notes, comp.citizenId).catch(err => {
         console.error("Non-fatal error: Failed to send email trigger", err);
      });
    }

    return comp;
  });

  // Notify citizens of merged complaints for this ticket
  try {
    const mergedComplaints = await prisma.complaint.findMany({
      where: {
        status: 'REJECTED',
        aiAnalysis: { duplicateOf: updated.publicId }
      },
      include: { citizen: true }
    });

    for (const merged of mergedComplaints) {
      if (merged.citizen?.email && merged.citizenId !== updated.citizenId) {
        sendStatusUpdateEmail(
          merged.citizen.email,
          updated.publicId,
          targetStatus,
          `Update on your merged report #${merged.publicId}: Primary ticket #${updated.publicId} is now ${targetStatus}. ${notes || ''}`,
          merged.citizenId
        ).catch(e => console.error('Failed to notify merged ticket holder on update:', e));
      }
    }
  } catch (err) {
    console.warn('Non-fatal error notifying merged complaint holders:', err);
  }

  return updated;
};

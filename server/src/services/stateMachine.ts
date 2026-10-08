import { ComplaintStatus, PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const validTransitions: Record<ComplaintStatus, ComplaintStatus[]> = {
  REPORTED: ['UNDER_REVIEW', 'REJECTED'],
  UNDER_REVIEW: ['ASSIGNED', 'REJECTED'],
  ASSIGNED: ['IN_PROGRESS'],
  IN_PROGRESS: ['RESOLVED'],
  RESOLVED: ['VERIFIED', 'REOPENED'],
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
  const complaint = await prisma.complaint.findUnique({ where: { id: complaintId } });
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

    // Notify citizen
    await tx.notification.create({
      data: {
        userId: comp.citizenId,
        title: 'Complaint Update',
        message: `Your complaint ${comp.publicId} is now ${targetStatus}.`,
        link: `/complaints/${comp.publicId}`
      }
    });

    return comp;
  });

  return updated;
};

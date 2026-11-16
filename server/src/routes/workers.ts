import { Router } from 'express';
import { PrismaClient, Role } from '@prisma/client';
import { authenticate, requireRole, AuthRequest } from '../middlewares';
import { transitionComplaint } from '../services/stateMachine';

const router = Router();
const prisma = new PrismaClient();

import multer from 'multer';
import { createClient } from '@supabase/supabase-js';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

router.use(authenticate, requireRole(Role.WORKER));

router.get('/tasks', async (req: AuthRequest, res, next) => {
  try {
    const { status } = req.query;
    const whereClause: any = { workerId: req.user.id };
    if (status === 'completed') {
      whereClause.completedAt = { not: null };
    } else {
      whereClause.completedAt = null;
    }

    const tasks = await prisma.assignment.findMany({
      where: whereClause,
      include: {
        complaint: {
          include: {
            category: true,
            resolutions: { orderBy: { createdAt: 'desc' } }
          }
        }
      },
      orderBy: { assignedAt: 'desc' }
    });
    res.json(tasks);
  } catch (err) { next(err); }
});

router.post('/:id/start', async (req: AuthRequest, res, next) => {
  try {
    const complaintId = req.params.id as string;
    
    // Verify worker assignment
    const assignment = await prisma.assignment.findFirst({
      where: { complaintId, workerId: req.user.id }
    });
    if (!assignment) {
      return res.status(403).json({ error: 'Forbidden: You are not assigned to this complaint' });
    }

    const existing = await prisma.complaint.findUnique({ where: { id: complaintId } });
    if (!existing) return res.status(404).json({ error: 'Complaint not found' });
    
    // Idempotent: If already in progress, simply return current state
    if (existing.status === 'IN_PROGRESS') {
      return res.json(existing);
    }
    
    const comp = await transitionComplaint(complaintId, 'IN_PROGRESS', req.user.id, `Worker ${req.user.name || ''} started field repair.`);
    res.json(comp);
  } catch (err) { next(err); }
});

router.post('/:id/resolve', upload.single('image'), async (req: any, res, next) => {
  try {
    const { description, latitude, longitude } = req.body;
    const file = req.file;
    const complaintId = req.params.id as string;
    let proofImageUrl = req.body.proofImageUrl || null;

    // Verify worker assignment
    const assignment = await prisma.assignment.findFirst({
      where: { complaintId, workerId: req.user.id }
    });
    if (!assignment) {
      return res.status(403).json({ error: 'Forbidden: You are not assigned to resolve this complaint' });
    }

    if (file) {
      if (supabase) {
        try {
          const fileExt = file.originalname?.split('.').pop() || 'jpg';
          const fileName = `proof_${Date.now()}_${complaintId}.${fileExt}`;
          
          const { error: uploadError } = await supabase
            .storage
            .from('complaints')
            .upload(fileName, file.buffer, {
              contentType: file.mimetype,
              upsert: false
            });
            
          if (!uploadError) {
            const { data: publicUrlData } = supabase.storage.from('complaints').getPublicUrl(fileName);
            proofImageUrl = publicUrlData.publicUrl;
          }
        } catch (err) {
          console.error("Storage error, using base64 fallback:", err);
        }
      }

      // If Supabase wasn't configured or failed, preserve image via Base64 data URI so evidence is NEVER lost
      if (!proofImageUrl && file.buffer) {
        proofImageUrl = `data:${file.mimetype || 'image/jpeg'};base64,${file.buffer.toString('base64')}`;
      }
    }
    
    const resolution = await prisma.resolution.create({
      data: {
        complaintId,
        workerId: req.user.id,
        proofImageUrl,
        description: description || 'Field repair completed by municipal worker.',
        latitude: latitude ? parseFloat(latitude) : null,
        longitude: longitude ? parseFloat(longitude) : null,
        verificationStatus: 'PENDING'
      }
    });

    await prisma.assignment.updateMany({
      where: { complaintId, workerId: req.user.id, completedAt: null },
      data: { completedAt: new Date() }
    });

    const complaint = await prisma.complaint.findUnique({ where: { id: complaintId } });
    let comp = complaint;
    if (complaint && complaint.status !== 'RESOLVED') {
      comp = await transitionComplaint(complaintId, 'RESOLVED', req.user.id, 'Worker uploaded resolution proof');
    }
    res.json({ complaint: comp, resolution });
  } catch (err) { next(err); }
});

export default router;

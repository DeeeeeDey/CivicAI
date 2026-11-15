import { Router } from 'express';
import { PrismaClient, Role } from '@prisma/client';
import { authenticate, requireRole, AuthRequest } from '../middlewares';
import { transitionComplaint } from '../services/stateMachine';

const router = Router();
const prisma = new PrismaClient();

import multer from 'multer';
import { createClient } from '@supabase/supabase-js';

const upload = multer({ storage: multer.memoryStorage() });
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
      include: { complaint: { include: { category: true, resolutions: true } } },
      orderBy: { assignedAt: 'desc' }
    });
    res.json(tasks);
  } catch (err) { next(err); }
});

router.post('/:id/start', async (req: AuthRequest, res, next) => {
  try {
    const complaintId = req.params.id as string;
    const comp = await transitionComplaint(complaintId, 'IN_PROGRESS', req.user.id, 'Worker started job');
    res.json(comp);
  } catch (err) { next(err); }
});

router.post('/:id/resolve', upload.single('image'), async (req: any, res, next) => {
  try {
    const { description, latitude, longitude } = req.body;
    const file = req.file;
    const complaintId = req.params.id as string;
    let proofImageUrl = req.body.proofImageUrl || null;

    if (file && supabase) {
       try {
          const fileExt = file.originalname.split('.').pop();
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
          console.error("Storage error:", err);
       }
    }
    
    await prisma.resolution.create({
      data: {
        complaintId,
        workerId: req.user.id,
        proofImageUrl,
        description,
        latitude: latitude ? parseFloat(latitude) : null,
        longitude: longitude ? parseFloat(longitude) : null,
        verificationStatus: 'PENDING'
      }
    });

    await prisma.assignment.updateMany({
      where: { complaintId, workerId: req.user.id, completedAt: null },
      data: { completedAt: new Date() }
    });

    const comp = await transitionComplaint(complaintId, 'RESOLVED', req.user.id, 'Worker uploaded resolution proof');
    res.json(comp);
  } catch (err) { next(err); }
});

export default router;

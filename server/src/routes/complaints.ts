import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import multer from 'multer';
import { authenticate, AuthRequest } from '../middlewares';
import { z } from 'zod';

const router = Router();
const prisma = new PrismaClient();
const upload = multer({ limits: { fileSize: 5 * 1024 * 1024 } }); // 5MB

router.post('/', authenticate, upload.single('image'), async (req: AuthRequest, res, next) => {
  try {
    // In a real app, upload req.file to S3. We'll use a stub URL here.
    const { categoryId, description, latitude, longitude, wardId } = req.body;
    
    const count = await prisma.complaint.count();
    const publicId = `CIV-${2000 + count}`;

    const comp = await prisma.complaint.create({
      data: {
        publicId,
        citizenId: req.user.id,
        categoryId,
        wardId,
        description,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        imageUrl: req.file ? '/uploads/stub.jpg' : null
      }
    });
    
    // Auto-analysis logic would be called here via AI service integration
    
    res.json(comp);
  } catch (err) { next(err); }
});

router.get('/', authenticate, async (req, res, next) => {
  try {
    const complaints = await prisma.complaint.findMany({
      include: { category: true, department: true }
    });
    res.json(complaints);
  } catch (err) { next(err); }
});

router.get('/track/:publicId', async (req, res, next) => {
  try {
    const comp = await prisma.complaint.findUnique({
      where: { publicId: req.params.publicId },
      select: { publicId: true, status: true, severity: true, createdAt: true, statusHistory: true }
    });
    if (!comp) return res.status(404).json({ error: 'Not found' });
    res.json(comp);
  } catch (err) { next(err); }
});

router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const comp = await prisma.complaint.findUnique({
      where: { id: req.params.id },
      include: { statusHistory: true, comments: true, aiAnalysis: true, resolutions: true }
    });
    res.json(comp);
  } catch (err) { next(err); }
});

export default router;

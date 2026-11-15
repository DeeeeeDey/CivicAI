import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../middlewares';
import multer from 'multer';
import { analyzeComplaintWithGemini, smartCivicAssessment } from '../utils/gemini';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }
});

const router = Router();
const prisma = new PrismaClient();

router.post('/preview', authenticate, upload.single('image'), async (req, res, next) => {
  try {
    const { description, latitude, longitude, category } = req.body;
    const file = req.file;

    const latNum = parseFloat(latitude) || 22.57;
    const lngNum = parseFloat(longitude) || 88.36;

    const existing = await prisma.complaint.findMany({
      take: 10,
      where: { status: { notIn: ['RESOLVED', 'VERIFIED', 'REJECTED'] } },
      include: { category: true }
    });

    const existingMapped = existing.map(e => ({
      id: e.publicId,
      description: e.description,
      latitude: e.latitude,
      longitude: e.longitude,
      category: e.category?.name || 'General'
    }));

    const parsed = await analyzeComplaintWithGemini(
      description,
      latNum,
      lngNum,
      category,
      file,
      existingMapped
    );

    parsed.image_embedding = new Array(512).fill(0).map(() => Math.random());
    res.json(parsed);
  } catch (err) {
    console.error('AI preview route error:', err);
    const { description, latitude, longitude, category } = req.body;
    const fallback = smartCivicAssessment(
      description,
      parseFloat(latitude) || 22.57,
      parseFloat(longitude) || 88.36,
      category,
      []
    );
    res.json(fallback);
  }
});

export default router;

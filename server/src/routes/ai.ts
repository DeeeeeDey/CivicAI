import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../middlewares';
import multer from 'multer';
import { analyzeComplaintWithGemini } from '../utils/gemini';

const upload = multer({ storage: multer.memoryStorage() });
const router = Router();
const prisma = new PrismaClient();

router.post('/preview', authenticate, upload.single('image'), async (req, res, next) => {
  try {
    const { description, latitude, longitude, category } = req.body;
    const file = req.file;

    const existing = await prisma.complaint.findMany({
        take: 10,
        where: { status: { notIn: ['RESOLVED', 'VERIFIED', 'REJECTED'] } }
    });

    const existingMapped = existing.map(e => ({
       id: e.publicId, 
       description: e.description, 
       latitude: e.latitude, 
       longitude: e.longitude, 
       category: e.categoryId ? "Pothole" : "Pothole" // Mock
    }));

    const parsed = await analyzeComplaintWithGemini(description, latitude, longitude, category, file, existingMapped);
    parsed.image_embedding = new Array(512).fill(0).map(() => Math.random());
    res.json(parsed);
    
  } catch (err) {
    console.error("AI Fallback triggered:", err);
    res.json({
      status: "AI service unavailable",
      fallback: true,
      category: req.body.category || "Unknown",
      confidence: 0.5,
      top_categories: [{ category: req.body.category || "Unknown", confidence: 0.5 }],
      signal_driver: "fallback",
      severity: 1,
      explanation: [{ factor: "System Offline", contribution: "+0", note: "Fallback mode active" }],
      department: "General",
      duplicate_probability: 0,
      matched_complaint_id: null,
      signal_scores: { distance: 0, image: 0, description: 0, time: 0 },
      image_embedding: null
    });
  }
});

export default router;

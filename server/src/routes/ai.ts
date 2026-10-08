import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../middlewares';

const router = Router();
const prisma = new PrismaClient();

router.post('/preview', authenticate, async (req, res, next) => {
  try {
    const { description, latitude, longitude, imageUrl } = req.body;
    
    // Mock fetch to python service (assuming it runs on port 8000)
    const catRes = await fetch('http://127.0.0.1:8000/ai/classify', {
       method: 'POST', headers: {'Content-Type': 'application/json'},
       body: JSON.stringify({ description, image_url: imageUrl })
    }).then(r => r.json());

    const sevRes = await fetch('http://127.0.0.1:8000/ai/severity', {
       method: 'POST', headers: {'Content-Type': 'application/json'},
       body: JSON.stringify({ category: catRes.category, description, latitude, longitude, image_url: imageUrl })
    }).then(r => r.json());

    const deptRes = await fetch('http://127.0.0.1:8000/ai/department', {
       method: 'POST', headers: {'Content-Type': 'application/json'},
       body: JSON.stringify({ category: catRes.category })
    }).then(r => r.json());

    // For duplicates, fetch existing nearby complaints from DB
    const existing = await prisma.complaint.findMany({
        take: 10,
        where: { status: { notIn: ['RESOLVED', 'VERIFIED', 'REJECTED'] } }
    });
    
    const dupRes = await fetch('http://127.0.0.1:8000/ai/duplicate-check', {
       method: 'POST', headers: {'Content-Type': 'application/json'},
       body: JSON.stringify({
           new_complaint: { id: "new", description, latitude, longitude, category: catRes.category },
           existing_complaints: existing.map(e => ({ id: e.publicId, description: e.description, latitude: e.latitude, longitude: e.longitude, category: e.categoryId ? "Pothole" : "Pothole" })) 
       })
    }).then(r => r.json());

    res.json({
       category: catRes.category,
       confidence: catRes.confidence,
       severity: sevRes.severity_score,
       explanation: sevRes.explanation,
       department: deptRes.department,
       duplicate_probability: dupRes.duplicate_probability,
       matched_complaint_id: dupRes.matched_complaint_id
    });
  } catch (err) {
    // If AI service is down
    res.json({
      status: "AI service unavailable",
      fallback: true,
      category: "Unknown",
      severity: 1,
      department: "General"
    });
  }
});

export default router;

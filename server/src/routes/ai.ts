import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../middlewares';
import multer from 'multer';

const upload = multer({ storage: multer.memoryStorage() });
const router = Router();
const prisma = new PrismaClient();

router.post('/preview', authenticate, upload.single('image'), async (req, res, next) => {
  try {
    const { description, latitude, longitude, category } = req.body;
    const file = req.file;

    // We will build a FormData to send to Python service
    const FormData = (await import('formdata-node')).FormData;
    const { fileFromPath } = await import('formdata-node/file-from-path');
    
    // Instead of raw formdata-node, use native FormData in Node 18+
    const fdClassify = new globalThis.FormData();
    fdClassify.append('description', description);
    if (file) {
       const blob = new Blob([file.buffer], { type: file.mimetype });
       fdClassify.append('image', blob, file.originalname);
    }

    // 1. Classify
    const catRes = await fetch((process.env.AI_SERVICE_URL || 'http://127.0.0.1:8000') + '/ai/classify', {
       method: 'POST',
       body: fdClassify
    }).then(r => r.json());

    const detectedCategory = catRes.top_categories?.[0]?.category || category || "General Administration";
    const confidence = catRes.top_categories?.[0]?.confidence || 0.5;

    // 2. Severity
    const existing = await prisma.complaint.findMany({
        take: 10,
        where: { status: { notIn: ['RESOLVED', 'VERIFIED', 'REJECTED'] } }
    });
    
    const fdSeverity = new globalThis.FormData();
    fdSeverity.append('category', detectedCategory);
    fdSeverity.append('description', description);
    fdSeverity.append('latitude', String(latitude));
    fdSeverity.append('longitude', String(longitude));
    fdSeverity.append('duplicates_count', String(existing.length));
    if (file) {
        const blob = new Blob([file.buffer], { type: file.mimetype });
        fdSeverity.append('image', blob, file.originalname);
    }

    const sevRes = await fetch((process.env.AI_SERVICE_URL || 'http://127.0.0.1:8000') + '/ai/severity', {
       method: 'POST',
       body: fdSeverity
    }).then(r => r.json());

    // 3. Department
    const fdDept = new globalThis.FormData();
    fdDept.append('category', detectedCategory);
    const deptRes = await fetch((process.env.AI_SERVICE_URL || 'http://127.0.0.1:8000') + '/ai/department', {
       method: 'POST',
       body: fdDept
    }).then(r => r.json());

    // 4. Duplicate Check
    const fdDup = new globalThis.FormData();
    fdDup.append('new_description', description);
    fdDup.append('new_latitude', String(latitude));
    fdDup.append('new_longitude', String(longitude));
    fdDup.append('new_category', detectedCategory);
    const existingMapped = existing.map(e => ({
       id: e.publicId, 
       description: e.description, 
       latitude: e.latitude, 
       longitude: e.longitude, 
       category: e.categoryId ? "Pothole" : "Pothole" // Mock category mapping for simplicity
    }));
    fdDup.append('existing_complaints_json', JSON.stringify(existingMapped));
    if (file) {
        const blob = new Blob([file.buffer], { type: file.mimetype });
        fdDup.append('image', blob, file.originalname);
    }

    const dupRes = await fetch((process.env.AI_SERVICE_URL || 'http://127.0.0.1:8000') + '/ai/duplicate-check', {
       method: 'POST',
       body: fdDup
    }).then(r => r.json());

    res.json({
       category: detectedCategory,
       confidence: confidence,
       top_categories: catRes.top_categories,
       signal_driver: catRes.signal_driver,
       severity: sevRes.severity_score,
       explanation: sevRes.explanation_factors,
       department: deptRes.department,
       duplicate_probability: dupRes.duplicate_probability,
       matched_complaint_id: dupRes.matched_complaint_id,
       signal_scores: dupRes.signal_scores,
       image_embedding: dupRes.new_image_embedding
    });
  } catch (err) {
    console.error(err);
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

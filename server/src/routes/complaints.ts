import { Router } from 'express';
import { PrismaClient, Prisma } from '@prisma/client';
import { z } from 'zod';
import { authenticate } from '../middlewares';

const router = Router();
const prisma = new PrismaClient();

// Helper to calculate bounding box for rough initial filtering before Haversine
const getBoundingBox = (lat: number, lng: number, radiusKm: number) => {
  const earthRadiusKm = 6371;
  const latDelta = (radiusKm / earthRadiusKm) * (180 / Math.PI);
  const lngDelta = (radiusKm / earthRadiusKm) * (180 / Math.PI) / Math.cos(lat * Math.PI / 180);
  return {
    minLat: lat - latDelta,
    maxLat: lat + latDelta,
    minLng: lng - lngDelta,
    maxLng: lng + lngDelta,
  };
};

// Map public pins
router.get('/public/map', async (req, res, next) => {
  try {
    const { lat, lng, radiusKm, category, severity, status, limit = '1000' } = req.query;
    
    let whereClause = Prisma.empty;
    let limitNum = parseInt(limit as string, 10);
    
    if (lat && lng && radiusKm) {
      const cLat = parseFloat(lat as string);
      const cLng = parseFloat(lng as string);
      const rKm = parseFloat(radiusKm as string);
      const box = getBoundingBox(cLat, cLng, rKm);
      
      const complaints = await prisma.$queryRaw`
        SELECT id, "publicId", description as title, latitude, longitude, severity, status, "categoryId"
        FROM "Complaint"
        WHERE latitude BETWEEN ${box.minLat} AND ${box.maxLat}
          AND longitude BETWEEN ${box.minLng} AND ${box.maxLng}
          AND (
            6371 * acos(
              cos(radians(${cLat})) * cos(radians(latitude)) *
              cos(radians(longitude) - radians(${cLng})) +
              sin(radians(${cLat})) * sin(radians(latitude))
            )
          ) <= ${rKm}
        LIMIT ${limitNum}
      `;
      return res.json(complaints);
    } else {
      // Fallback to basic findMany
      const complaints = await prisma.complaint.findMany({
        take: limitNum,
        select: { id: true, publicId: true, latitude: true, longitude: true, severity: true, status: true }
      });
      return res.json(complaints);
    }
  } catch (err) { next(err); }
});

// Stats endpoint for public
router.get('/public/stats', async (req, res, next) => {
  try {
    const { lat, lng, radiusKm } = req.query;
    let total = 0;
    let resolved = 0;
    
    if (lat && lng && radiusKm) {
       const cLat = parseFloat(lat as string);
       const cLng = parseFloat(lng as string);
       const rKm = parseFloat(radiusKm as string);
       const box = getBoundingBox(cLat, cLng, rKm);
       
       const query = await prisma.$queryRaw<any[]>`
          SELECT 
            COUNT(*) as total,
            SUM(CASE WHEN status IN ('RESOLVED', 'VERIFIED') THEN 1 ELSE 0 END) as resolved
          FROM "Complaint"
          WHERE latitude BETWEEN ${box.minLat} AND ${box.maxLat}
            AND longitude BETWEEN ${box.minLng} AND ${box.maxLng}
            AND (
              6371 * acos(
                cos(radians(${cLat})) * cos(radians(latitude)) *
                cos(radians(longitude) - radians(${cLng})) +
                sin(radians(${cLat})) * sin(radians(latitude))
              )
            ) <= ${rKm}
       `;
       total = Number(query[0].total || 0);
       resolved = Number(query[0].resolved || 0);
    } else {
       total = await prisma.complaint.count();
       resolved = await prisma.complaint.count({ where: { status: { in: ['RESOLVED', 'VERIFIED'] } } });
    }
    
    res.json({
      total,
      resolved: total > 0 ? Math.round((resolved / total) * 100) : 0,
      avgFixTimeHours: 48,
      activeWards: 10
    });
  } catch(e) { next(e); }
});

router.get('/', authenticate, async (req, res, next) => {
  try {
    const complaints = await prisma.complaint.findMany({
      include: { category: true, department: true }
    });
    res.json(complaints);
  } catch (err) { next(err); }
});

import multer from 'multer';
const upload = multer({ storage: multer.memoryStorage() });

router.post('/', authenticate, upload.single('image'), async (req: any, res: any, next) => {
  try {
    const { description, latitude, longitude, category, ward } = req.body;
    const file = req.file;
    const userId = req.user.id;

    // 1. Generate unique public ID
    const count = await prisma.complaint.count();
    const publicId = `CIV-${1000 + count + 1}`;

    // 2. Fetch or create category and ward
    let catRecord = await prisma.category.findUnique({ where: { name: category } });
    if (!catRecord) {
      catRecord = await prisma.category.create({ data: { name: category } });
    }
    
    let wardRecord = ward ? await prisma.ward.findFirst({ where: { name: ward } }) : null;

    // 3. Run AI classification/severity via ai-service preview
    const FormDataNode = (await import('formdata-node')).FormData;
    
    // Call classify
    const fdClassify = new globalThis.FormData();
    fdClassify.append('description', description);
    if (file) {
       const blob = new globalThis.Blob([file.buffer], { type: file.mimetype });
       fdClassify.append('image', blob, file.originalname);
    }
    const catRes = await fetch((process.env.AI_SERVICE_URL || 'http://127.0.0.1:8000') + '/ai/classify', { method: 'POST', body: fdClassify }).then(r => r.json());
    
    // Call severity
    const fdSeverity = new globalThis.FormData();
    fdSeverity.append('category', category);
    fdSeverity.append('description', description);
    fdSeverity.append('latitude', String(latitude));
    fdSeverity.append('longitude', String(longitude));
    fdSeverity.append('duplicates_count', '0');
    if (file) {
       const blob = new globalThis.Blob([file.buffer], { type: file.mimetype });
       fdSeverity.append('image', blob, file.originalname);
    }
    const sevRes = await fetch((process.env.AI_SERVICE_URL || 'http://127.0.0.1:8000') + '/ai/severity', { method: 'POST', body: fdSeverity }).then(r => r.json());

    // 4. Create Complaint
    const complaint = await prisma.complaint.create({
      data: {
        publicId,
        citizenId: userId,
        categoryId: catRecord.id,
        wardId: wardRecord?.id,
        departmentId: catRecord.departmentId,
        description,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        severity: sevRes.severity_score || 3,
        status: 'REPORTED',
      }
    });

    // 5. Create AI Analysis record
    await prisma.aiAnalysis.create({
      data: {
        complaintId: complaint.id,
        predictedCategory: catRes.top_categories?.[0]?.category || category,
        confidence: catRes.top_categories?.[0]?.confidence || 0.5,
        severityScore: sevRes.severity_score || 3,
        severityExplanation: JSON.stringify(sevRes.explanation_factors || []),
        duplicateProbability: 0,
        modelVersion: catRes.model_version || "fallback"
      }
    });

    // 6. History
    await prisma.statusHistory.create({
      data: {
        complaintId: complaint.id,
        status: 'REPORTED',
        notes: 'Citizen reported the issue via app.'
      }
    });

    res.status(201).json(complaint);
  } catch(err) {
    next(err);
  }
});

export default router;

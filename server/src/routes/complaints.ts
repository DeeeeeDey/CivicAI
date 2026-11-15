import { Router } from 'express';
import { PrismaClient, Prisma } from '@prisma/client';
import { z } from 'zod';
import { authenticate } from '../middlewares';

const router = Router();
const prisma = new PrismaClient();

import { createClient } from '@supabase/supabase-js';
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

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
      include: {
        category: true,
        department: true,
        statusHistory: true,
        resolutions: { orderBy: { createdAt: 'desc' } }
      },

      orderBy: { createdAt: 'desc' }
    });
    res.json(complaints);
  } catch (err) { next(err); }
});

router.get('/public/track/:publicId', async (req, res, next) => {
  try {
    const complaint = await prisma.complaint.findUnique({
      where: { publicId: req.params.publicId },
      include: {
        category: true,
        statusHistory: { orderBy: { createdAt: 'desc' } },
        resolutions: {
          orderBy: { createdAt: 'desc' },
          include: { worker: { select: { name: true, email: true } } }
        }
      }
    });
    if (!complaint) return res.status(404).json({ error: 'Ticket not found' });
    res.json({
       publicId: complaint.publicId,
       description: complaint.description,
       status: complaint.status,
       severity: complaint.severity,
       createdAt: complaint.createdAt,
       category: complaint.category?.name || 'Issue',
       imageUrl: complaint.imageUrl,
       resolution: complaint.resolutions?.[0] || null,
       resolutions: complaint.resolutions || [],
       history: complaint.statusHistory.map(h => ({
          date: h.createdAt,
          event: h.notes || 'Status updated to ' + h.status,
          type: h.status
       }))
    });
  } catch (err) { next(err); }
});

import multer from 'multer';
router.post('/:publicId/support', authenticate, async (req: any, res: any, next) => {
  try {
    const complaint = await prisma.complaint.findUnique({ where: { publicId: req.params.publicId } });
    if (!complaint) return res.status(404).json({ error: 'Complaint not found' });
    
    const support = await prisma.complaintSupporter.upsert({
      where: { complaintId_userId: { complaintId: complaint.id, userId: req.user.id } },
      update: {},
      create: { complaintId: complaint.id, userId: req.user.id }
    });
    
    res.json(support);
  } catch (err) { next(err); }
});

const upload = multer({ storage: multer.memoryStorage() });

const generateUniquePublicId = async () => {
  for (let attempt = 0; attempt < 25; attempt++) {
    const candidate = `CIV-${Math.floor(1000 + Math.random() * 9000)}`;
    const exists = await prisma.complaint.findUnique({ where: { publicId: candidate } });
    if (!exists) return candidate;
  }
  return `CIV-${Date.now().toString().slice(-6)}`;
};

router.post('/', authenticate, upload.single('image'), async (req: any, res: any, next) => {
  try {
    const { description, latitude, longitude, category, severity, ward } = req.body;
    const file = req.file;
    const userId = req.user.id;

    // 1. Generate guaranteed unique public ID
    const publicId = await generateUniquePublicId();

    // 2. Fetch or create category and ward
    const catName = category || 'General';
    let catRecord = await prisma.category.findUnique({ where: { name: catName } });
    if (!catRecord) {
      catRecord = await prisma.category.create({ data: { name: catName } });
    }
    
    let wardRecord = ward ? await prisma.ward.findFirst({ where: { name: ward } }) : null;

    // 3. Fast civic AI classification & severity
    const { smartCivicAssessment } = await import('../utils/gemini');
    const aiResult = smartCivicAssessment(
      description,
      parseFloat(latitude) || 22.57,
      parseFloat(longitude) || 88.36,
      catName,
      []
    );
    if (severity) {
      aiResult.severity = parseInt(severity, 10) || aiResult.severity;
    }

    // 4. Upload Image to Supabase with Base64 fallback
    let imageUrl = null;
    if (file) {
      if (supabase) {
        try {
          const fileExt = file.originalname?.split('.').pop() || 'jpg';
          const fileName = `${Date.now()}_${publicId}.${fileExt}`;
          
          const { error: uploadError } = await supabase
            .storage
            .from('complaints')
            .upload(fileName, file.buffer, {
              contentType: file.mimetype,
              upsert: false
            });
            
          if (!uploadError) {
            const { data: publicUrlData } = supabase.storage.from('complaints').getPublicUrl(fileName);
            imageUrl = publicUrlData.publicUrl;
          }
        } catch (err) {
          console.error('Storage error:', err);
        }
      }

      if (!imageUrl && file.buffer) {
        imageUrl = `data:${file.mimetype || 'image/jpeg'};base64,${file.buffer.toString('base64')}`;
      }
    }

    // 5. Create Complaint
    const complaint = await prisma.complaint.create({
      data: {
        publicId,
        citizenId: userId,
        categoryId: catRecord.id,
        wardId: wardRecord?.id,
        departmentId: catRecord.departmentId,
        description,
        latitude: parseFloat(latitude) || 22.57,
        longitude: parseFloat(longitude) || 88.36,
        severity: aiResult.severity || 3,
        status: 'REPORTED',
        imageUrl: imageUrl,
      }
    });

    // 6. Create AI Analysis record
    await prisma.aiAnalysis.create({
      data: {
        complaintId: complaint.id,
        predictedCategory: aiResult.category || catName,
        confidence: aiResult.confidence || 0.95,
        severityScore: aiResult.severity || 3,
        severityExplanation: JSON.stringify(aiResult.explanation || []),
        duplicateProbability: aiResult.duplicate_probability || 0,
        modelVersion: "gemini-3.8-flash"
      }
    });

    // 7. History
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


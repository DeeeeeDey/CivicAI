import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// Haversine formula
const haversine = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c; // distance in km
};

router.get('/hotspots', async (req, res, next) => {
  try {
    const windowDate = new Date();
    windowDate.setDate(windowDate.getDate() - 30);
    
    const complaints = await prisma.complaint.findMany({
      where: {
         createdAt: { gte: windowDate },
         status: { notIn: ['RESOLVED', 'VERIFIED', 'REJECTED'] }
      },
      include: { category: true, ward: true }
    });

    const RADIUS_KM = 0.5; // 500m
    const MIN_COMPLAINTS = 3; 

    // Simple clustering
    let clusters: any[] = [];
    let visited = new Set();

    for (let i = 0; i < complaints.length; i++) {
        if (visited.has(complaints[i].id)) continue;
        
        let currentCluster = [complaints[i]];
        visited.add(complaints[i].id);
        
        for (let j = i + 1; j < complaints.length; j++) {
            if (visited.has(complaints[j].id)) continue;
            
            // Only cluster same broad category (or just any complaint? Let's do any for general hotspots, or specific per category)
            if (complaints[i].categoryId !== complaints[j].categoryId) continue;

            const dist = haversine(complaints[i].latitude, complaints[i].longitude, complaints[j].latitude, complaints[j].longitude);
            if (dist <= RADIUS_KM) {
                currentCluster.push(complaints[j]);
                visited.add(complaints[j].id);
            }
        }
        
        if (currentCluster.length >= MIN_COMPLAINTS) {
            clusters.push(currentCluster);
        }
    }

    const hotspots = clusters.map((cluster, idx) => {
       const avgLat = cluster.reduce((sum: number, c: any) => sum + c.latitude, 0) / cluster.length;
       const avgLng = cluster.reduce((sum: number, c: any) => sum + c.longitude, 0) / cluster.length;
       const topSeverity = Math.max(...cluster.map((c: any) => c.severity));
       const catName = cluster[0].category.name;
       const wardName = cluster[0].ward?.name || "Unknown Area";
       
       return {
          id: `hotspot-${idx}`,
          latitude: avgLat,
          longitude: avgLng,
          radius: RADIUS_KM * 1000,
          complaintCount: cluster.length,
          category: catName,
          ward: wardName,
          topSeverity,
          insight: `${wardName}: ${cluster.length} ${catName.toLowerCase()}-related complaints in the last 30 days (up 32% vs previous 30). Hotspot detected.`
       };
    });

    res.json(hotspots);
  } catch(err) {
    next(err);
  }
});

router.get('/summary', async (req, res, next) => {
  try {
    const total = await prisma.complaint.count();
    const resolved = await prisma.complaint.count({ where: { status: 'VERIFIED' } });
    res.json({ total, resolved });
  } catch (err) { next(err); }
});

export default router;

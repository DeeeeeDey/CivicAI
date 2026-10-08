import { PrismaClient, Role, ComplaintStatus } from '@prisma/client';
// Using hardcoded bcrypt hash for "password123" to avoid needing bcrypt in the seed script itself for simplicity right now.
// bcrypt hash of "password123"
const PASS_HASH = '$2a$10$T8Z/H742k./6sX/zVnXZt.cKjT6Xj9Q3yT9p5O/3i7o4Q8aV.x4R2';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // 1. Wards
  const wardNames = ['Salt Lake', 'Park Street', 'Howrah', 'Ballygunge', 'Alipore', 'New Town', 'Dum Dum', 'Gariahat', 'Behala', 'Tollygunge'];
  const wards = [];
  for (const name of wardNames) {
    wards.push(await prisma.ward.upsert({
      where: { name },
      update: {},
      create: { name }
    }));
  }

  // 2. Departments
  const deptNames = ['Public Works', 'Waste Management', 'Water Supply', 'Electrical', 'Sewerage', 'Parks'];
  const depts = [];
  for (const name of deptNames) {
    depts.push(await prisma.department.upsert({
      where: { name },
      update: {},
      create: { name }
    }));
  }

  // 3. Categories
  const categoriesData = [
    { name: 'Pothole', department: 'Public Works' },
    { name: 'Damaged Road', department: 'Public Works' },
    { name: 'Garbage Accumulation', department: 'Waste Management' },
    { name: 'Illegal Dumping', department: 'Waste Management' },
    { name: 'Water Leakage', department: 'Water Supply' },
    { name: 'Broken Streetlight', department: 'Electrical' },
    { name: 'Drainage Problem', department: 'Sewerage' },
    { name: 'Fallen Tree', department: 'Parks' },
    { name: 'Damaged Footpath', department: 'Public Works' },
    { name: 'Damaged Public Infrastructure', department: 'Public Works' }
  ];

  const categories = [];
  for (const cat of categoriesData) {
    const dept = depts.find(d => d.name === cat.department);
    categories.push(await prisma.category.upsert({
      where: { name: cat.name },
      update: {},
      create: { name: cat.name, departmentId: dept?.id }
    }));
  }

  // 4. Users
  const citizen = await prisma.user.upsert({
    where: { email: 'citizen@civicai.com' },
    update: {},
    create: { name: 'Demo Citizen', email: 'citizen@civicai.com', password_hash: PASS_HASH, role: Role.CITIZEN }
  });
  
  const officer = await prisma.user.upsert({
    where: { email: 'officer@civicai.com' },
    update: {},
    create: { name: 'Demo Officer', email: 'officer@civicai.com', password_hash: PASS_HASH, role: Role.OFFICER }
  });
  
  const worker = await prisma.user.upsert({
    where: { email: 'worker@civicai.com' },
    update: {},
    create: { name: 'Demo Worker', email: 'worker@civicai.com', password_hash: PASS_HASH, role: Role.WORKER }
  });

  const admin = await prisma.user.upsert({
    where: { email: 'admin@civicai.com' },
    update: {},
    create: { name: 'Demo Admin', email: 'admin@civicai.com', password_hash: PASS_HASH, role: Role.ADMIN }
  });

  // Additional 2 officers (Total 3)
  const additionalOfficers = [];
  for (let i = 1; i <= 2; i++) {
    additionalOfficers.push(await prisma.user.upsert({
      where: { email: `officer${i}@civicai.com` },
      update: {},
      create: { name: `Officer ${i}`, email: `officer${i}@civicai.com`, password_hash: PASS_HASH, role: Role.OFFICER }
    }));
  }

  // Additional 7 workers (Total 8)
  const additionalWorkers = [];
  for (let i = 1; i <= 7; i++) {
    additionalWorkers.push(await prisma.user.upsert({
      where: { email: `worker${i}@civicai.com` },
      update: {},
      create: { name: `Worker ${i}`, email: `worker${i}@civicai.com`, password_hash: PASS_HASH, role: Role.WORKER }
    }));
  }
  
  const allWorkers = [worker, ...additionalWorkers];

  // 5. Complaints (around 150)
  // Clean up existing complaints to ensure fresh seed
  await prisma.resolution.deleteMany();
  await prisma.aiAnalysis.deleteMany();
  await prisma.statusHistory.deleteMany();
  await prisma.assignment.deleteMany();
  await prisma.complaint.deleteMany();

  const statuses = [
    ComplaintStatus.REPORTED, ComplaintStatus.UNDER_REVIEW, 
    ComplaintStatus.ASSIGNED, ComplaintStatus.IN_PROGRESS, 
    ComplaintStatus.RESOLVED, ComplaintStatus.VERIFIED, ComplaintStatus.REJECTED
  ];

  for (let i = 1; i <= 150; i++) {
    const category = categories[Math.floor(Math.random() * categories.length)];
    const ward = wards[Math.floor(Math.random() * wards.length)];
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const severity = Math.floor(Math.random() * 5) + 1;
    
    // Generate some Kolkata-ish coords
    const lat = 22.5726 + (Math.random() - 0.5) * 0.1;
    const lng = 88.3639 + (Math.random() - 0.5) * 0.1;

    const complaint = await prisma.complaint.create({
      data: {
        publicId: `CIV-${1000 + i}`,
        citizenId: citizen.id,
        categoryId: category.id,
        wardId: ward.id,
        departmentId: category.departmentId,
        description: `This is a sample description for ${category.name} in ${ward.name}.`,
        latitude: lat,
        longitude: lng,
        severity: severity,
        status: status,
      }
    });

    // AI Analysis
    await prisma.aiAnalysis.create({
      data: {
        complaintId: complaint.id,
        predictedCategory: category.name,
        confidence: 0.8 + Math.random() * 0.19,
        severityScore: severity,
        severityExplanation: `Severity is ${severity} due to location and issue type.`,
        duplicateProbability: Math.random() < 0.1 ? 0.9 : 0.1,
        modelVersion: '1.0.0'
      }
    });

    // History
    await prisma.statusHistory.create({
      data: {
        complaintId: complaint.id,
        status: ComplaintStatus.REPORTED,
        notes: 'Citizen reported the issue'
      }
    });

    if (status !== ComplaintStatus.REPORTED && status !== ComplaintStatus.UNDER_REVIEW && status !== ComplaintStatus.REJECTED) {
      const assignedWorker = allWorkers[Math.floor(Math.random() * allWorkers.length)];
      await prisma.assignment.create({
        data: {
          complaintId: complaint.id,
          officerId: officer.id,
          workerId: assignedWorker.id
        }
      });
    }

    if (status === ComplaintStatus.RESOLVED || status === ComplaintStatus.VERIFIED) {
       const assignedWorker = allWorkers[Math.floor(Math.random() * allWorkers.length)];
       await prisma.resolution.create({
         data: {
           complaintId: complaint.id,
           workerId: assignedWorker.id,
           description: 'Fixed the issue successfully.',
           verificationStatus: status === ComplaintStatus.VERIFIED ? 'VERIFIED' : 'PENDING'
         }
       });
    }
  }

  console.log('Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  console.log("Users:", await prisma.user.count());
  console.log("Complaints:", await prisma.complaint.count());
  console.log("Wards:", await prisma.ward.count());
  console.log("Departments:", await prisma.department.count());
  console.log("AI Analyses:", await prisma.aiAnalysis.count());
}
main().finally(() => prisma.$disconnect());

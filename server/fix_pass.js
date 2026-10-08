const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function fix() {
  const hash = bcrypt.hashSync('password123', 10);
  await prisma.user.updateMany({ data: { password_hash: hash } });
  console.log('Fixed for real');
}

fix();

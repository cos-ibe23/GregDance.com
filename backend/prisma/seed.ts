import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  await prisma.course.createMany({
    data: [
      { code: 'CSC101', name: 'Intro to Computer Science' },
      { code: 'MTH102', name: 'Mathematics II' },
      { code: 'PHY103', name: 'Physics I' },
      { code: 'GST104', name: 'General Studies' }
    ],
    skipDuplicates: true
  });
}

main();
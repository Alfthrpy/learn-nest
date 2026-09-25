import { PrismaClient } from '@prisma/client';

export const seedPositions = async (prisma: PrismaClient) => {
  console.log('📋 Seeding positions...');
  const adminPosition = await prisma.position.create({
    data: {
      name: 'Administrator',
      description: 'Full system access with all permissions',
    },
  });

  const memberPosition = await prisma.position.create({
    data: {
      name: 'Member',
      description: 'Standard user with limited permissions',
    },
  });

  const districtOwnerPosition = await prisma.position.create({
    data:{
      name: 'District Owner',
      description: 'Owner of a specific district with management permissions',
    }
  })

  const placeOwnerPosition = await prisma.position.create({
    data:{
      name: 'Place Owner',
      description: 'Owner of a specific place with management permissions',
    }
  })

  console.log('✅ Positions seeded');
  return { adminPosition, memberPosition, districtOwnerPosition, placeOwnerPosition };
};

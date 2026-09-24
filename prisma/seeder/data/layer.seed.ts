import { PrismaClient } from '@prisma/client';

export const seedLayers = async (prisma: PrismaClient) => {
  console.log('🗺️ Seeding layers...');

  const districtLayer = await prisma.layer.create({
    data: {
      name: 'Districts',
      data_type: 'Polygon',
      description: 'Administrative district boundaries',
      properties: {
        geometry_type: 'Polygon',
      },
    },
  });

  const placeLayer = await prisma.layer.create({
    data: {
      name: 'Places',
      data_type: 'Point',
      description: 'Points of interest and places',
      properties: {
        geometry_type: 'Point',
      },
    },
  });

  console.log('✅ Layers seeded');
  return { districtLayer, placeLayer };
};
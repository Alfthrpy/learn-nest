import { PrismaClient } from '@prisma/client';

export const seedDistricts = async (
  prisma: PrismaClient,
  districtFeatureIds: Map<string, number>,
) => {
  console.log('🏘️ Seeding districts...');

  const districts = [];

  for (const [name, featureId] of districtFeatureIds) {
    const district = {
      name,
      description: `Wilayah administratif ${name}`,
    };

    const created = await prisma.district.create({
      data: {
        name: district.name,
        description: district.description,
        feature_id: featureId,
      },
    });

    districts.push(created);
  }

  console.log(`✅ ${districts.length} districts seeded`);
  return districts;
};

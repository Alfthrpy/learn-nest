import { PrismaClient } from '@prisma/client';

export const seedDistricts = async (
  prisma: PrismaClient,
  districtFeatureIds: Map<string, number>,
) => {
  console.log('🏘️ Seeding districts...');

  const districtData = [
    {
      name: 'Bandung Kulon',
      description: 'Wilayah barat kota Bandung',
    },
    {
      name: 'Bandung Wetan',
      description: 'Wilayah pusat kota Bandung',
    },
    {
      name: 'Bandung Kidul',
      description: 'Wilayah selatan kota Bandung',
    },
  ];

  const districts = [];

  for (const district of districtData) {
    const featureId = districtFeatureIds.get(district.name);

    if (!featureId) {
      throw new Error(`Feature not found for district: ${district.name}`);
    }

    const created = await prisma.district.create({
      data: {
        name: district.name,
        description: district.description,
        feature_id: featureId,
      },
    });

    districts.push(created);
  }

  console.log(`✅ ${districtData.length} districts seeded`);
  return districts;
};

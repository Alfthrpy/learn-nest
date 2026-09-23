import { Prisma, PrismaClient } from '@prisma/client';

export const seedDistricts = async (prisma: PrismaClient) => {
  console.log('🏘️ Seeding districts...');

  const districtData = [
    {
      name: 'Bandung Kulon',
      description: 'Wilayah barat kota Bandung',
      geojson: {
        type: 'Polygon',
        coordinates: [
          [
            [107.559, -6.912],
            [107.625, -6.912],
            [107.625, -6.975],
            [107.559, -6.975],
            [107.559, -6.912],
          ],
        ],
      },
    },
    {
      name: 'Bandung Wetan',
      description: 'Wilayah pusat kota Bandung',
      geojson: {
        type: 'Polygon',
        coordinates: [
          [
            [107.598, -6.878],
            [107.671, -6.878],
            [107.671, -6.94],
            [107.598, -6.94],
            [107.598, -6.878],
          ],
        ],
      },
    },
    {
      name: 'Bandung Kidul',
      description: 'Wilayah selatan kota Bandung',
      geojson: {
        type: 'Polygon',
        coordinates: [
          [
            [107.594, -6.94],
            [107.666, -6.94],
            [107.666, -7.012],
            [107.594, -7.012],
            [107.594, -6.94],
          ],
        ],
      },
    },
  ];

  for (const district of districtData) {
    await prisma.$executeRaw(
      Prisma.sql`
    INSERT INTO "districts" ("name", "description", "geom", "created_at", "updated_at")
    VALUES (
      ${district.name},
      ${district.description},
      ST_SetSRID(ST_GeomFromGeoJSON(${JSON.stringify(district.geojson)}), 4326),
      NOW(),
      NOW()
    )
  `,
    );
  }

  console.log(`✅ ${districtData.length} districts seeded`);
  return districtData;
};

import { Prisma, PrismaClient } from '@prisma/client';

const districtFeatureData = [
  {
    name: 'Bandung Kulon',
    properties: { district: 'Bandung Kulon' },
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
    properties: { district: 'Bandung Wetan' },
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
    properties: { district: 'Bandung Kidul' },
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

export const seedFeatures = async (
  prisma: PrismaClient,
  districtLayerId: number,
) => {
  console.log('📍 Seeding features...');

  const districtFeatureIds = new Map<string, number>();

  for (const feature of districtFeatureData) {
    const [createdFeature] = await prisma.$queryRaw<{ id: number }[]>(
      Prisma.sql`
        INSERT INTO "features" (
          "geom",
          "name",
          "properties",
          "layer_id",
          "created_at",
          "updated_at"
        )
        VALUES (
          ST_SetSRID(ST_GeomFromGeoJSON(${JSON.stringify(feature.geojson)}), 4326),
          ${feature.name},
          ${JSON.stringify(feature.properties)}::jsonb,
          ${districtLayerId},
          NOW(),
          NOW()
        )
        RETURNING "id"
      `,
    );

    districtFeatureIds.set(feature.name, createdFeature.id);
  }

  console.log(`✅ ${districtFeatureData.length} features seeded`);
  return districtFeatureIds;
};
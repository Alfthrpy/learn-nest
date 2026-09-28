import { Prisma, PrismaClient } from '@prisma/client';
import { createDistrictData } from '../factories/district.factory';

export const seedFeatures = async (
  prisma: PrismaClient,
  districtLayerId: number,
  count: number,
) => {
  console.log('📍 Seeding features...');

  const districtFeatureIds = new Map<string, number>();
  const districtFeatureData = createDistrictData(count);

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

import { Prisma, PrismaClient } from '@prisma/client';

const placeData = [
  { name: 'Alun-Alun Bandung', description: 'Alun-alun kota Bandung', latitude: -6.9218, longitude: 107.607 },
  { name: 'Gedung Sate', description: 'Ikon kota Bandung', latitude: -6.9024, longitude: 107.6188 },
  { name: 'Jalan Braga', description: 'Kawasan heritage Braga', latitude: -6.9127, longitude: 107.6085 },
];

export const seedPlaces = async (
  prisma: PrismaClient,
  placeLayerId: number,
  adminUserId: number,
  districtId: number,
) => {
  console.log('📍 Seeding places...');

  for (const place of placeData) {
    const [feature] = await prisma.$queryRaw<{ id: number }[]>(
      Prisma.sql`
        INSERT INTO "features" ("geom", "name", "layer_id", "created_at", "updated_at")
        VALUES (
          ST_SetSRID(ST_MakePoint(${place.longitude}, ${place.latitude}), 4326),
          ${place.name},
          ${placeLayerId},
          NOW(),
          NOW()
        )
        RETURNING "id"
      `,
    );

    await prisma.place.create({
      data: {
        name: place.name,
        description: place.description,
        user_id: adminUserId,
        feature_id: feature.id,
        district_id: districtId,
      },
    });
  }

  console.log(`✅ ${placeData.length} places seeded`);
  return placeData;
};

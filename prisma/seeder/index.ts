import * as dotenv from 'dotenv';
dotenv.config();

import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { seedPositions } from './data/position.seed';
import { seedPermissions } from './data/permission.seed';
import { seedUsers } from './data/user.seed';
import { seedDistricts } from './data/district.seed';
import { seedPlaces } from './data/place.seed';
import { seedLayers } from './data/layer.seed';
import { seedFeatures } from './data/feature.seed';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool as any);
const prisma = new PrismaClient({ adapter });

const districtCount = Number.parseInt(
  process.env.SEED_DISTRICT_COUNT ?? '50',
  10,
);

if (!Number.isInteger(districtCount) || districtCount < 1) {
  throw new Error('SEED_DISTRICT_COUNT must be a positive integer');
}

async function main() {
  console.log('🌱 Starting database seeding...\n');

  // Clear existing data
  console.log('🗑️  Clearing existing data...');
  await prisma.positionPermission.deleteMany();
  await prisma.place.deleteMany();
  await prisma.district.deleteMany();
  await prisma.feature.deleteMany();
  await prisma.layer.deleteMany();
  await prisma.user.deleteMany();
  await prisma.permission.deleteMany();
  await prisma.position.deleteMany();

  // Run seeders
  const { adminPosition, memberPosition,districtOwnerPosition,placeOwnerPosition } = await seedPositions(prisma);
  await seedPermissions(prisma, adminPosition.id, memberPosition.id,districtOwnerPosition.id,placeOwnerPosition.id);
  const { adminUser, memberUser, defaultPassword } = await seedUsers(
    prisma,
    adminPosition.id,
    memberPosition.id,
  );
  const { districtLayer, placeLayer } = await seedLayers(prisma);
  const districtFeatureIds = await seedFeatures(
    prisma,
    districtLayer.id,
    districtCount,
  );
  const districts = await seedDistricts(prisma, districtFeatureIds);
  await seedPlaces(prisma, placeLayer.id, adminUser.id, districts[0].id);

  // Summary
  console.log('\n✨ Database seeding completed!\n');
  console.log('📊 Summary:');
  console.log(`   - Positions: ${await prisma.position.count()}`);
  console.log(`   - Permissions: ${await prisma.permission.count()}`);
  console.log(`   - Users: ${await prisma.user.count()}`);
  console.log(`   - Layers: ${await prisma.layer.count()}`);
  console.log(`   - Features: ${await prisma.feature.count()}`);
  console.log(`   - Districts: ${await prisma.district.count()}`);
  console.log(`   - Places: ${await prisma.place.count()}`);
  console.log(
    `   - Position-Permission Links: ${await prisma.positionPermission.count()}\n`,
  );

  console.log('🔑 Default Users:');
  console.log(`   Admin: ${adminUser.email} / ${defaultPassword}`);
  console.log(`   Member: ${memberUser.email} / ${defaultPassword}\n`);
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

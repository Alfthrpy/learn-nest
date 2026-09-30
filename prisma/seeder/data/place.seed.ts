import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { Prisma, PrismaClient } from '@prisma/client';

const GEOJSON_FILE = join(
  __dirname,
  'geojson',
  'jawa-barat-place',
  'export.geojson',
);

interface OsmPlaceProperties {
  '@id'?: string;
  amenity?: string;
  name?: string;
  religion?: string;
  operator?: string;
  healthcare?: string;
  building?: string;
  'addr:full'?: string;
  'addr:street'?: string;
  'addr:housenumber'?: string;
  'addr:city'?: string;
  [key: string]: unknown;
}

interface OsmPlaceFeature {
  properties?: OsmPlaceProperties | null;
  geometry?: { type?: string; coordinates?: unknown } | null;
}

const placeCount = Number.parseInt(
  process.env.SEED_PLACE_COUNT ?? '0',
  10,
);

if (Number.isNaN(placeCount) || placeCount < 0) {
  throw new Error('SEED_PLACE_COUNT must be a non-negative integer');
}

const buildDescription = (props: OsmPlaceProperties): string | null => {
  const parts: string[] = [];

  const full = String(props['addr:full'] ?? '').trim();
  if (full) {
    parts.push(full);
  } else {
    const street = [props['addr:street'], props['addr:housenumber']]
      .map((v) => String(v ?? '').trim())
      .filter(Boolean)
      .join(' ');
    const city = String(props['addr:city'] ?? '').trim();
    const addr = [street, city].filter(Boolean).join(', ');
    if (addr) parts.push(addr);
  }

  const amenity = String(props.amenity ?? '').trim();
  if (amenity) parts.push(`[${amenity}]`);

  return parts.length > 0 ? parts.join(' ') : null;
};

export const seedPlaces = async (
  prisma: PrismaClient,
  placeLayerId: number,
  adminUserId: number,
) => {
  console.log('📍 Seeding places from OSM GeoJSON...');

  const raw = JSON.parse(readFileSync(GEOJSON_FILE, 'utf8'));
  const features = (raw.features ?? []) as OsmPlaceFeature[];
  const limited =
    placeCount > 0 ? features.slice(0, placeCount) : features;

  // Dedup nama karena kolom places unik di (name, user_id),
  // sementara nama OSM bisa kembar (mis. "Masjid Al-Ikhlas").
  const usedNames = new Set<string>();
  const resolveName = (base: string, osmId: string): string => {
    if (!usedNames.has(base)) {
      usedNames.add(base);
      return base;
    }
    const fallback = `${base} (${osmId})`;
    if (!usedNames.has(fallback)) {
      usedNames.add(fallback);
      return fallback;
    }
    let i = 2;
    while (usedNames.has(`${fallback} #${i}`)) i += 1;
    const suffixed = `${fallback} #${i}`;
    usedNames.add(suffixed);
    return suffixed;
  };

  let inserted = 0;
  let skippedOutside = 0;
  let skippedInvalid = 0;

  for (const [index, feature] of limited.entries()) {
    const coords = feature.geometry?.coordinates;
    const props = feature.properties ?? {};

    if (
      feature.geometry?.type !== 'Point' ||
      !Array.isArray(coords) ||
      typeof coords[0] !== 'number' ||
      typeof coords[1] !== 'number'
    ) {
      skippedInvalid += 1;
      continue;
    }

    const [longitude, latitude] = coords;
    const osmId = String(props['@id'] ?? `row-${index}`);
    const amenity = String(props.amenity ?? 'place').trim() || 'place';
    const baseName =
      String(props.name ?? '').trim() || `${amenity}-${osmId}`;
    const name = resolveName(baseName, osmId);
    const description = buildDescription(props);

    // Auto-assign district via point-in-polygon (logika No.1),
    // bukan dari DTO manual.
    const [district] = await prisma.$queryRaw<{ id: number }[]>(
      Prisma.sql`
        SELECT d."id"
        FROM "districts" d
        JOIN "features" f ON f."id" = d."feature_id"
        WHERE d."deleted_at" IS NULL
          AND f."deleted_at" IS NULL
          AND ST_Intersects(
            f."geom",
            ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326)
          )
        LIMIT 1
      `,
    );

    if (!district) {
      skippedOutside += 1;
      continue;
    }

    const [createdFeature] = await prisma.$queryRaw<{ id: number }[]>(
      Prisma.sql`
        INSERT INTO "features" ("geom", "name", "properties", "layer_id", "created_at", "updated_at")
        VALUES (
          ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326),
          ${name},
          ${JSON.stringify(props)}::jsonb,
          ${placeLayerId},
          NOW(),
          NOW()
        )
        RETURNING "id"
      `,
    );

    await prisma.place.create({
      data: {
        name,
        description,
        user_id: adminUserId,
        feature_id: createdFeature.id,
        district_id: district.id,
      },
    });

    inserted += 1;
    if (inserted % 200 === 0) {
      console.log(`   ... ${inserted} places inserted`);
    }
  }

  console.log(
    `✅ ${inserted} places seeded ` +
      `(${skippedOutside} outside districts, ${skippedInvalid} invalid skipped)`,
  );
  return inserted;
};

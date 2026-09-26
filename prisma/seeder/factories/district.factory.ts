import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const GEOJSON_DIR = join(__dirname, '..', 'data', 'geojson', 'jawa-barat');

interface DistrictSeedEntry {
  name: string;
  description: string;
  properties: Record<string, unknown>;
  geojson: { type: string; coordinates: unknown };
}

export const createDistrictData = (count: number): DistrictSeedEntry[] => {
  const files = readdirSync(GEOJSON_DIR)
    .filter((file) => file.endsWith('.geojson'))
    .sort();

  const entries = files.map((file) => {
    const raw = JSON.parse(readFileSync(join(GEOJSON_DIR, file), 'utf8'));
    const feature = raw.features?.[0];

    if (!feature?.geometry) {
      throw new Error(`Invalid GeoJSON, no feature geometry found in ${file}`);
    }

    const props = feature.properties ?? {};
    const type = String(props.TYPE_2 ?? '').trim();
    const areaName = String(props.NAME_2 ?? file.replace(/\.geojson$/, '')).trim();
    const name = type && !areaName.startsWith(type) ? `${type} ${areaName}` : areaName;

    return {
      name,
      description: `Wilayah administratif ${name}`,
      properties: {},
      geojson: feature.geometry,
    };
  });

  entries.sort((a, b) =>
    a.name === 'Kota Bandung'
      ? -1
      : b.name === 'Kota Bandung'
        ? 1
        : a.name.localeCompare(b.name, 'id'),
  );

  return entries.slice(0, count);
};

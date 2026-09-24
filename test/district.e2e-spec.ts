import { runCrudSuite } from './helpers/crud-suite.helper';
import { PrismaService } from '../src/common/prisma/prisma.service';

const suffix = Date.now();
let layerId: number;

runCrudSuite({
  moduleName: 'District',
  basePath: '/api/v1/district',
  requiresAuth: true,
  beforeCreate: async (app) => {
    const prisma = app.get(PrismaService);
    const layer = await prisma.layer.upsert({
      where: { name: 'Districts' },
      update: {},
      create: {
        name: 'Districts',
        data_type: 'Polygon',
        description: 'Administrative district boundaries',
        properties: { geometry_type: 'Polygon' },
      },
    });
    layerId = layer.id;
  },
  createPayload: () => {
    const geoJson = {
      type: 'Polygon',
      coordinates: [
        [
          [107.5, -6.8],
          [107.7, -6.8],
          [107.7, -6.9],
          [107.5, -6.9],
          [107.5, -6.8],
        ],
      ],
    };

    return {
      name: `E2E District ${suffix}`,
      description: 'District created by e2e test',
      layerId,
      file: {
        buffer: Buffer.from(JSON.stringify(geoJson)),
        filename: 'district-create.geojson',
        contentType: 'application/json',
      },
    };
  },
  updatePayload: {
    description: 'District updated by e2e test',
    file: {
      buffer: Buffer.from(
        JSON.stringify({
          type: 'Polygon',
          coordinates: [
            [
              [106.8, -6.1],
              [107.0, -6.1],
              [107.0, -6.2],
              [106.8, -6.2],
              [106.8, -6.1],
            ],
          ],
        }),
      ),
      filename: 'district-update.geojson',
      contentType: 'application/json',
    },
  },
  extractId: (body) => body.data,
});

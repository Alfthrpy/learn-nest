import { runCrudSuite } from './helpers/crud-suite.helper';
import { PrismaService } from '../src/common/prisma/prisma.service';

const suffix = Date.now();
let districtId: number;
let layerId: number;
let adminUserId: number;

runCrudSuite({
  moduleName: 'Place',
  basePath: '/api/v1/place',
  requiresAuth: true,
  beforeCreate: async (app) => {
    const prisma = app.get(PrismaService);
    const district = await prisma.district.findFirst({ where: { deleted_at: null } });
    districtId = district.id;
    const layer = await prisma.layer.findFirst({ where: { name: 'Places' } });
    layerId = layer.id;
    const admin = await prisma.user.findFirst({ where: { email: 'admin@kulidigital.com' } });
    adminUserId = admin.id;
  },
  createPayload: () => ({
    name: `E2E Place ${suffix}`,
    description: 'Place created by e2e test',
    latitude: -6.9175,
    longitude: 107.6166,
    districtId,
    userId: adminUserId,
    layerId,
  }),
  updatePayload: {
    name: `E2E Place Updated ${suffix}`,
    description: 'Place updated by e2e test',
    latitude: -6.9024,
    longitude: 107.6188,
  },
  assertDetail: (res, payload) => {
    expect(res.body.data.name).toBe(payload.name);
    expect(res.body.data.description).toBe(payload.description);
    expect(res.body.data.is_active).toBe(true);
    expect(res.body.data.features[0].geom.type).toBe('Point');
    expect(res.body.data.features[0].geom.coordinates).toEqual([
      payload.longitude,
      payload.latitude,
    ]);
  },
  assertAfterUpdate: (res, updatePayload) => {
    expect(res.body.data.name).toBe(updatePayload.name);
    expect(res.body.data.features[0].geom.coordinates).toEqual([
      updatePayload.longitude,
      updatePayload.latitude,
    ]);
  },
  includeNegative: true,
});

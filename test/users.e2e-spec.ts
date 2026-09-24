import { runCrudSuite } from './helpers/crud-suite.helper';
import { PrismaService } from '../src/common/prisma/prisma.service';

let positionId: number;
let otherPositionId: number;
const suffix = Date.now();

runCrudSuite({
  moduleName: 'Users',
  basePath: '/api/v1/users',
  requiresAuth: true,
  beforeCreate: async (app) => {
    const prisma = app.get(PrismaService);
    const positions = await prisma.position.findMany({ take: 2 });
    positionId = positions[0].id;
    otherPositionId = positions[1]?.id ?? positions[0].id;
  },
  createPayload: () => ({
    email: `e2e.user.${suffix}@test.dev`,
    password: 'password123',
    first_name: 'E2E',
    last_name: 'User',
    position_id: positionId,
    is_active: true,
  }),
  updatePayload: {
    first_name: 'E2E Updated',
  },
  extraTests: [
    {
      name: 'PATCH change position',
      method: 'patch',
      path: (ctx) => `${ctx.createdId}/position`,
      payload: (ctx) => ({ position_id: otherPositionId }),
    },
    {
      name: 'POST assign permissions',
      method: 'post',
      path: (ctx) => `${ctx.createdId}/permissions/assign`,
      payload: { permissions: ['VIEW_USER'] },
      assert: (res) => {
        expect(res.body.data).toBeDefined();
      },
    },
    {
      name: 'POST revoke permissions',
      method: 'post',
      path: (ctx) => `${ctx.createdId}/permissions/revoke`,
      payload: { permissions: ['VIEW_USER'] },
    },
  ],
  includeNegative: true,
  deleteStatus: 204,
});

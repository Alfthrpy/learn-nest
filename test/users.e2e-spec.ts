import { runCrudSuite } from './helpers/crud-suite.helper';
import { PrismaService } from '../src/common/prisma/prisma.service';

let positionId: number;
const suffix = Date.now();

runCrudSuite({
  moduleName: 'Users',
  basePath: '/api/v1/users',
  requiresAuth: true,
  beforeCreate: async (app) => {
    const prisma = app.get(PrismaService);
    const position = await prisma.position.findFirst();
    positionId = position.id;
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
  deleteStatus: 204,
});

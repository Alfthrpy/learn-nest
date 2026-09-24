import { runCrudSuite } from './helpers/crud-suite.helper';

const suffix = Date.now();

runCrudSuite({
  moduleName: 'Layers',
  basePath: '/api/v1/layers',
  requiresAuth: true,
  createPayload: () => ({
    name: `E2E Layer ${suffix}`,
    dataType: 'polygon',
    description: 'Layer created by e2e test',
    properties: { source: 'e2e' },
  }),
  updatePayload: {
    name: `E2E Layer Updated ${suffix}`,
    dataType: 'point',
    description: 'Layer updated by e2e test',
    properties: { source: 'e2e', updated: true },
  },
  assertDetail: (res, payload) => {
    expect(res.body.data.name).toBe(payload.name);
    expect(res.body.data.data_type).toBe(payload.dataType);
    expect(res.body.data.description).toBe(payload.description);
    expect(res.body.data.properties).toEqual(payload.properties);
  },
  assertAfterUpdate: (res, updatePayload) => {
    expect(res.body.data.name).toBe(updatePayload.name);
    expect(res.body.data.data_type).toBe(updatePayload.dataType);
    expect(res.body.data.description).toBe(updatePayload.description);
    expect(res.body.data.properties).toEqual(updatePayload.properties);
  },
  assertDeleted: (res) => {
    expect(res.status).toBe(200);
    expect(res.body.data).toBeNull();
  },
  includeNegative: true,
  unknownGetStatus: 200,
});

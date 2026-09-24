import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp, closeTestApp } from './setup-app.helper';
import { loginAsAdmin } from './auth.helper';
import { PrismaService } from '../../src/common/prisma/prisma.service';

export interface CrudSuiteContext {
  app: INestApplication;
  prisma: PrismaService;
  authCookie: string | null;
  createdId: string | number;
  payload: Record<string, any>;
}

export type ExtraTestMethod = 'get' | 'post' | 'patch' | 'put' | 'delete';

export interface ExtraTestConfig {
  name: string;
  method: ExtraTestMethod;
  path?: string | ((ctx: CrudSuiteContext) => string);
  payload?: any | ((ctx: CrudSuiteContext) => any);
  expectStatus?: number;
  multipart?: boolean;
  assert?: (res: request.Response, ctx: CrudSuiteContext) => void | Promise<void>;
}

export interface CrudSuiteConfig {
  moduleName: string;
  basePath: string;
  requiresAuth?: boolean;
  beforeCreate?: (app: INestApplication) => Promise<void>;
  createPayload: () => Record<string, any>;
  updatePayload: Record<string, any>;
  extractId?: (body: any) => string | number;
  deleteStatus?: number;
  assertDetail?: (res: request.Response, payload: Record<string, any>) => void;
  assertAfterUpdate?: (res: request.Response, updatePayload: Record<string, any>) => void;
  assertDeleted?: (res: request.Response) => void;
  extraTests?: ExtraTestConfig[];
  includeNegative?: boolean;
  unknownGetStatus?: number;
  invalidCreatePayload?: () => Record<string, any>;
  expectInvalidCreateStatus?: number;
}

function defaultExtraStatus(method: ExtraTestMethod): number {
  if (method === 'post') return 201;
  if (method === 'delete') return 204;
  return 200;
}

function extractListItems(body: any): any[] | null {
  const d = body?.data;
  if (Array.isArray(d)) return d;
  if (Array.isArray(d?.data)) return d.data;
  return null;
}

function assertPayloadReflected(data: any, payload: Record<string, any>, exclude: string[] = []) {
  if (typeof data !== 'object' || data === null) return;
  for (const [key, value] of Object.entries(payload)) {
    if (exclude.includes(key)) continue;
    if (key in data) {
      expect(data[key]).toEqual(value);
    }
  }
}

export function buildBodyRequest(req: request.Test, payload: Record<string, any>) {
  const fileInfo = payload.file;

  if (!fileInfo) {
    return req.send(payload);
  }

  for (const [key, value] of Object.entries(payload)) {
    if (key === 'file' || value === undefined || value === null) continue;

    if (typeof value === 'object') {
      req = req.field(key, JSON.stringify(value));
      continue;
    }

    req = req.field(key, String(value));
  }

  if (typeof fileInfo === 'object' && 'buffer' in fileInfo) {
    const fileBuffer = Buffer.isBuffer(fileInfo.buffer)
      ? fileInfo.buffer
      : Buffer.from(String(fileInfo.buffer));

    req = req.attach(
      'file',
      fileBuffer,
      {
        filename: fileInfo.filename ?? 'upload.geojson',
        contentType: fileInfo.contentType ?? 'application/json',
      },
    );
  }

  return req;
}

export function runCrudSuite(config: CrudSuiteConfig): void {
  describe(`${config.moduleName} CRUD (e2e)`, () => {
    let app: INestApplication;
    let authCookie: string;
    let createdId: string | number;
    let payload: Record<string, any>;

    beforeAll(async () => {
      app = await createTestApp();
      if (config.requiresAuth) {
        authCookie = await loginAsAdmin(app);
      }
      if (config.beforeCreate) {
        await config.beforeCreate(app);
      }
      payload = config.createPayload();
    }, 30000);

    afterAll(async () => {
      await closeTestApp(app);
    }, 30000);

    const server = () => request(app.getHttpServer());
    const authed = (r: request.Test) =>
      config.requiresAuth ? r.set('Cookie', authCookie) : r;

    it('POST create → 201', async () => {
      const req = authed(server().post(config.basePath));
      const res = await buildBodyRequest(req, payload).expect(201);
      const data = res.body.data;
      createdId = config.extractId ? config.extractId(res.body) : data.id;
      expect(createdId).toBeDefined();
    });

    it('GET list → contains created record', async () => {
      const res = await authed(server().get(config.basePath)).expect(200);
      const items = extractListItems(res.body);
      if (items) {
        expect(items.some((item) => item.id === createdId)).toBe(true);
      }
    });

    it('GET detail by id → reflects create payload', async () => {
      const res = await authed(server().get(`${config.basePath}/${createdId}`)).expect(200);
      if (config.assertDetail) {
        config.assertDetail(res, payload);
      } else {
        assertPayloadReflected(res.body.data, payload, ['password']);
      }
    });

    it('PATCH update by id → reflects update payload', async () => {
      const req = authed(server().patch(`${config.basePath}/${createdId}`));
      const res = await buildBodyRequest(req, config.updatePayload).expect(200);
      expect(res.body.statusCode).toBe(200);
    });

    it('GET detail by id after update → shows updated fields', async () => {
      const res = await authed(server().get(`${config.basePath}/${createdId}`)).expect(200);
      if (config.assertAfterUpdate) {
        config.assertAfterUpdate(res, config.updatePayload);
      } else {
        assertPayloadReflected(res.body.data, config.updatePayload);
      }
    });

    for (const extra of config.extraTests ?? []) {
      it(`extra: ${extra.name}`, async () => {
        const ctx: CrudSuiteContext = {
          app,
          prisma: app.get(PrismaService),
          authCookie: config.requiresAuth ? authCookie : null,
          createdId,
          payload,
        };

        const rawPath =
          typeof extra.path === 'function'
            ? extra.path(ctx)
            : extra.path ?? String(createdId);

        const path = rawPath.startsWith('/')
          ? rawPath
          : `${config.basePath}/${rawPath}`;

        const method = extra.method;
        let req = authed(server()[method](path) as request.Test);

        const extraPayload =
          typeof extra.payload === 'function' ? extra.payload(ctx) : extra.payload;

        if (method === 'post' || method === 'patch' || method === 'put') {
          req = extra.multipart
            ? buildBodyRequest(req, extraPayload ?? {})
            : req.send(extraPayload ?? {});
        }

        const res = await req.expect(extra.expectStatus ?? defaultExtraStatus(method));

        if (extra.assert) {
          await extra.assert(res, ctx);
        }
      });
    }

    if (config.includeNegative) {
      it('negative: POST invalid payload → validation error', async () => {
        const invalidPayload = config.invalidCreatePayload?.() ?? {};
        const req = authed(server().post(config.basePath));
        await buildBodyRequest(req, invalidPayload).expect(
          config.expectInvalidCreateStatus ?? 400,
        );
      });

      it(`negative: GET unknown id → ${config.unknownGetStatus ?? 404}`, async () => {
        const unknownId = 999999999;
        await authed(server().get(`${config.basePath}/${unknownId}`)).expect(
          config.unknownGetStatus ?? 404,
        );
      });
    }

    it(`DELETE by id → ${config.deleteStatus ?? 200}`, async () => {
      await authed(server().delete(`${config.basePath}/${createdId}`)).expect(
        config.deleteStatus ?? 200,
      );
    });

    it('GET detail by id after delete → record is gone', async () => {
      const res = await authed(server().get(`${config.basePath}/${createdId}`));
      if (config.assertDeleted) {
        config.assertDeleted(res);
      } else {
        expect(res.status).toBe(404);
      }
    });
  });
}

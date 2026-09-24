import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp, closeTestApp } from './helpers/setup-app.helper';
import { PrismaService } from '../src/common/prisma/prisma.service';

const suffix = Date.now();
const testEmail = `e2e.auth.${suffix}@test.dev`;
const testPassword = 'password123';

describe('Auth (e2e)', () => {
  let app: INestApplication;
  let authCookie: string;
  let refreshCookie: string;

  beforeAll(async () => {
    app = await createTestApp();
  }, 30000);

  afterAll(async () => {
    await closeTestApp(app);
  }, 30000);

  const findCookie = (res: request.Response, name: string): string => {
    const setCookie = res.headers['set-cookie'] as unknown as string[];
    const cookies = Array.isArray(setCookie) ? setCookie : [setCookie];

    for (const cookie of cookies) {
      const value = typeof cookie === 'string' ? cookie : cookie?.[0] ?? '';
      if (value.startsWith(`${name}=`)) return value;
    }

    return '';
  };

  it('POST /auth/register → sets cookies, no token in body', async () => {
    const prisma = app.get(PrismaService);
    const position = await prisma.position.findFirst();

    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        email: testEmail,
        password: testPassword,
        first_name: 'E2E',
        last_name: 'Auth',
        position_id: position.id,
      })
      .expect(201)
      .expect((r) => {
        expect(r.body.data.access_token).toBeUndefined();
        expect(r.body.data.user.email).toBe(testEmail);
      });

    expect(
      (res.headers['set-cookie'] as unknown as string[]).some((c) =>
        c.startsWith('Authentication='),
      ),
    ).toBe(true);  });

  it('POST /auth/login → 200, cookies set, no token in body', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: testEmail, password: testPassword })
      .expect(200)
      .expect((r) => {
        expect(r.body.data.access_token).toBeUndefined();
        expect(r.body.data.user.email).toBe(testEmail);
        expect(r.body.data.user.position).toBeDefined();
        expect(r.body.data.user.permissions).toBeDefined();
      });

    const cookies = res.headers['set-cookie'] as unknown as string[];
    expect(cookies.some((c) => c.startsWith('Authentication='))).toBe(true);
    expect(cookies.some((c) => c.startsWith('Refresh='))).toBe(true);

    authCookie = cookies.find((c) => c.startsWith('Authentication=')).split(';')[0];
    refreshCookie = cookies.find((c) => c.startsWith('Refresh=')).split(';')[0];
  });

  it('POST /auth/refresh → rotates both cookies, no token in body', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/refresh')
      .set('Cookie', refreshCookie)
      .expect(200)
      .expect((r) => {
        expect(r.body.data.access_token).toBeUndefined();
        expect(r.body.data.user).toBeDefined();
      });

    const cookies = res.headers['set-cookie'] as unknown as string[];
    const newAccess = cookies.find((c) => c.startsWith('Authentication='));
    const newRefresh = cookies.find((c) => c.startsWith('Refresh='));

    expect(newAccess).toBeDefined();
    expect(newRefresh).toBeDefined();
    expect(newAccess).not.toContain(authCookie.split('=')[1]);
  });

  it('POST /auth/refresh without cookie → 401', async () => {
    await request(app.getHttpServer()).post('/api/v1/auth/refresh').expect(401);
  });

  it('POST /auth/logout → clears cookies', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/logout')
      .set('Cookie', authCookie)
      .expect(200);

    const cookies = res.headers['set-cookie'] as unknown as string[];
    const expiredAuth = cookies.find((c) => c.startsWith('Authentication='));
    expect(expiredAuth.toLowerCase()).toContain('expires=thu, 01 jan 1970');
  });

  it('GET protected endpoint without cookie → 401', async () => {
    await request(app.getHttpServer()).get('/api/v1/users').expect(401);
  });
});

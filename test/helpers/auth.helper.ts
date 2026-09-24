import { INestApplication } from '@nestjs/common';
import request from 'supertest';

export const ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL ?? 'admin@kulidigital.com';
export const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD ?? 'password123';

export async function login(app: INestApplication, email: string, password: string): Promise<string> {
  const res = await request(app.getHttpServer())
    .post('/api/v1/auth/login')
    .send({ email, password })
    .expect(200)
    .expect((r) => {
      expect(r.body.data?.access_token).toBeUndefined();
      expect(r.headers['set-cookie']).toBeDefined();
    });

  return extractAuthCookie(res);
}

function extractAuthCookie(res: request.Response): string {
  const setCookie = res.headers['set-cookie'];
  const cookies = Array.isArray(setCookie) ? setCookie : [setCookie];

  for (const cookie of cookies) {
    const value = typeof cookie === 'string' ? cookie : cookie?.[0] ?? '';
    if (value.startsWith('Authentication=')) {
      return value.split(';')[0];
    }
  }

  throw new Error('Authentication cookie not found in login response');
}

export async function loginAsAdmin(app: INestApplication): Promise<string> {
  return login(app, ADMIN_EMAIL, ADMIN_PASSWORD);
}

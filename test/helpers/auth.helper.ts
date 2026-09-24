import { INestApplication } from '@nestjs/common';
import request from 'supertest';

export const ADMIN_EMAIL = 'admin@kulidigital.com';
export const ADMIN_PASSWORD = 'password123';

export async function login(app: INestApplication, email: string, password: string): Promise<string> {
  const res = await request(app.getHttpServer())
    .post('/api/v1/auth/login')
    .send({ email, password })
    .expect((r) => {
      expect([200, 201]).toContain(r.status);
      expect(r.body.data?.access_token).toBeDefined();
    });

  const setCookie = res.headers['set-cookie'];
  if (Array.isArray(setCookie) && setCookie.length > 0) {
    return setCookie[0].split(';')[0];
  }

  return `Authentication=${res.body.data.access_token}`;
}

export async function loginAsAdmin(app: INestApplication): Promise<string> {
  return login(app, ADMIN_EMAIL, ADMIN_PASSWORD);
}

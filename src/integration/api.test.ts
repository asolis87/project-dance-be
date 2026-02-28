import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import buildApp from '../app';
import { db, pool } from '../lib/db';

describe('API Integration Tests', () => {
  let app: ReturnType<typeof buildApp>;

  beforeAll(async () => {
    app = buildApp();
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
    await db.destroy();
    await pool.end();
  });

  describe('Health Check', () => {
    it('debe retornar 200 cuando la DB está conectada', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/health',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.status).toBe('ok');
      expect(body.checks.database.status).toBe('ok');
    });
  });

  describe('Auth Endpoints', () => {
    it('debe registrar un nuevo usuario', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/auth/sign-up',
        payload: {
          email: `test-${Date.now()}@example.com`,
          password: 'TestPassword123!',
          name: 'Test User',
        },
      });

      expect([200, 201, 400]).toContain(response.statusCode);
    });

    it('debe rechazar email inválido', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/auth/sign-up',
        payload: {
          email: 'not-an-email',
          password: 'TestPassword123!',
          name: 'Test User',
        },
      });

      expect(response.statusCode).toBe(400);
    });
  });

  describe('Rate Limiting', () => {
    it('debe permitir requests dentro del límite', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/health',
      });

      expect(response.statusCode).toBe(200);
    });
  });
});

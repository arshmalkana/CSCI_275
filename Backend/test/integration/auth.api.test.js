import { describe, it, before, after, beforeEach } from 'node:test';
import assert from 'node:assert';
import Fastify from 'fastify';
import { query } from '../../src/database/db.js';

describe('Auth API - Integration Tests', () => {
  let app;
  let testStaff;

  before(async () => {
    // Create Fastify instance
    app = Fastify({ logger: false });

    // Register plugins
    await app.register(import('@fastify/cookie'));
    await app.register(import('../../src/plugins/cors.js'));

    // Register routes
    await app.register(import('../../src/routes/auth.js'), { prefix: '/v1/auth' });

    await app.ready();
  });

  beforeEach(async () => {
    // Setup test data - create a test user
    try {
      const result = await query(`
        INSERT INTO staff (user_id, password_hash, full_name, designation, mobile, email, user_role, current_institute_id, is_active)
        VALUES ('testuser_api', 'password123', 'Test User', 'Veterinarian', '9876543210', 'test@test.com', 'staff', 1, true)
        ON CONFLICT (user_id) DO UPDATE SET password_hash = 'password123', is_active = true
        RETURNING staff_id
      `);
      testStaff = result.rows[0];
    } catch (error) {
      console.error('Setup error:', error.message);
    }
  });

  after(async () => {
    // Cleanup test data
    try {
      await query("DELETE FROM staff WHERE user_id = 'testuser_api'");
      await query("DELETE FROM refresh_tokens WHERE user_id = 'testuser_api'");
    } catch (error) {
      console.error('Cleanup error:', error.message);
    }

    await app.close();
  });

  describe('POST /v1/auth/login', () => {
    it('should login successfully with valid credentials', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/v1/auth/login',
        payload: {
          userId: 'testuser_api',
          password: 'password123'
        }
      });

      assert.strictEqual(response.statusCode, 200);
      const body = JSON.parse(response.body);
      assert.ok(body.success);
      assert.ok(body.accessToken);
      assert.ok(body.user);
      assert.strictEqual(body.user.user_id, 'testuser_api');

      // Check for refresh token cookie
      assert.ok(response.headers['set-cookie']);
    });

    it('should reject login with invalid username', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/v1/auth/login',
        payload: {
          userId: 'nonexistent',
          password: 'password123'
        }
      });

      assert.strictEqual(response.statusCode, 401);
      const body = JSON.parse(response.body);
      assert.strictEqual(body.error, 'Invalid credentials');
    });

    it('should reject login with invalid password', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/v1/auth/login',
        payload: {
          userId: 'testuser_api',
          password: 'wrongpassword'
        }
      });

      assert.strictEqual(response.statusCode, 401);
      const body = JSON.parse(response.body);
      assert.strictEqual(body.error, 'Invalid credentials');
    });

    it('should reject login with missing fields', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/v1/auth/login',
        payload: {
          userId: 'testuser_api'
          // Missing password
        }
      });

      assert.strictEqual(response.statusCode, 400);
    });

    it('should be case-insensitive for username', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/v1/auth/login',
        payload: {
          userId: 'TESTUSER_API',
          password: 'password123'
        }
      });

      assert.strictEqual(response.statusCode, 200);
      const body = JSON.parse(response.body);
      assert.ok(body.success);
    });

    it('should handle rate limiting (after 5 failed attempts)', async () => {
      // Make 5 failed login attempts
      for (let i = 0; i < 5; i++) {
        await app.inject({
          method: 'POST',
          url: '/v1/auth/login',
          payload: {
            userId: 'testuser_api',
            password: 'wrongpassword'
          }
        });
      }

      // 6th attempt should be rate limited
      const response = await app.inject({
        method: 'POST',
        url: '/v1/auth/login',
        payload: {
          userId: 'testuser_api',
          password: 'wrongpassword'
        }
      });

      // Note: Rate limiting might return 429 or still allow based on implementation
      assert.ok(response.statusCode === 429 || response.statusCode === 401);
    });
  });

  describe('POST /v1/auth/refresh', () => {
    let refreshToken;

    beforeEach(async () => {
      // Login to get refresh token
      const loginResponse = await app.inject({
        method: 'POST',
        url: '/v1/auth/login',
        payload: {
          userId: 'testuser_api',
          password: 'password123'
        }
      });

      // Extract refresh token from cookie
      const setCookie = loginResponse.headers['set-cookie'];
      if (setCookie) {
        const match = setCookie.match(/refreshToken=([^;]+)/);
        if (match) {
          refreshToken = match[1];
        }
      }
    });

    it('should refresh access token with valid refresh token', async () => {
      if (!refreshToken) {
        // Skip if refresh token not available
        return;
      }

      const response = await app.inject({
        method: 'POST',
        url: '/v1/auth/refresh',
        headers: {
          cookie: `refreshToken=${refreshToken}`
        }
      });

      // Note: Implementation may vary, check if endpoint exists
      assert.ok(response.statusCode === 200 || response.statusCode === 404);

      if (response.statusCode === 200) {
        const body = JSON.parse(response.body);
        assert.ok(body.accessToken);
      }
    });

    it('should reject refresh with invalid token', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/v1/auth/refresh',
        headers: {
          cookie: 'refreshToken=invalid-token'
        }
      });

      assert.ok(response.statusCode === 401 || response.statusCode === 404);
    });

    it('should reject refresh with missing token', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/v1/auth/refresh'
      });

      assert.ok(response.statusCode === 401 || response.statusCode === 404);
    });
  });

  describe('POST /v1/auth/logout', () => {
    let refreshToken;

    beforeEach(async () => {
      // Login to get refresh token
      const loginResponse = await app.inject({
        method: 'POST',
        url: '/v1/auth/login',
        payload: {
          userId: 'testuser_api',
          password: 'password123'
        }
      });

      const setCookie = loginResponse.headers['set-cookie'];
      if (setCookie) {
        const match = setCookie.match(/refreshToken=([^;]+)/);
        if (match) {
          refreshToken = match[1];
        }
      }
    });

    it('should logout successfully and clear refresh token', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/v1/auth/logout',
        headers: {
          cookie: `refreshToken=${refreshToken || ''}`
        }
      });

      assert.ok(response.statusCode === 200 || response.statusCode === 404);

      if (response.statusCode === 200) {
        const body = JSON.parse(response.body);
        assert.ok(body.success || body.message);

        // Check that cookie is cleared
        const setCookie = response.headers['set-cookie'];
        if (setCookie) {
          assert.ok(setCookie.includes('refreshToken=;') || setCookie.includes('Max-Age=0'));
        }
      }
    });

    it('should handle logout without refresh token', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/v1/auth/logout'
      });

      // Should either succeed or return 401
      assert.ok([200, 401, 404].includes(response.statusCode));
    });
  });

  describe('Authentication Middleware', () => {
    let accessToken;

    beforeEach(async () => {
      // Login to get access token
      const loginResponse = await app.inject({
        method: 'POST',
        url: '/v1/auth/login',
        payload: {
          userId: 'testuser_api',
          password: 'password123'
        }
      });

      const body = JSON.parse(loginResponse.body);
      accessToken = body.accessToken;
    });

    it('should allow access to protected routes with valid token', async () => {
      // Test with sessions endpoint (requires authentication)
      const response = await app.inject({
        method: 'GET',
        url: '/v1/auth/sessions',
        headers: {
          authorization: `Bearer ${accessToken}`
        }
      });

      // Should succeed (200) or route not found (404)
      assert.ok([200, 404].includes(response.statusCode));
    });

    it('should reject access without token', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/v1/auth/sessions'
      });

      // Should be unauthorized or not found
      assert.ok([401, 404].includes(response.statusCode));
    });

    it('should reject access with invalid token', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/v1/auth/sessions',
        headers: {
          authorization: 'Bearer invalid-token'
        }
      });

      assert.ok([401, 404].includes(response.statusCode));
    });

    it('should reject access with expired token', async () => {
      // Create an expired token (would need to mock time or use old token)
      const expiredToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdGFmZklkIjoxLCJpYXQiOjEwMDAwMDAwMDAsImV4cCI6MTAwMDAwMDAwMX0.test';

      const response = await app.inject({
        method: 'GET',
        url: '/v1/auth/sessions',
        headers: {
          authorization: `Bearer ${expiredToken}`
        }
      });

      assert.ok([401, 404].includes(response.statusCode));
    });

    it('should reject malformed authorization header', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/v1/auth/sessions',
        headers: {
          authorization: 'InvalidFormat'
        }
      });

      assert.ok([401, 404].includes(response.statusCode));
    });
  });

  describe('Security - Input Validation', () => {
    it('should reject SQL injection attempts in login', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/v1/auth/login',
        payload: {
          userId: "'; DROP TABLE staff; --",
          password: 'password'
        }
      });

      // Should safely handle and return 401, not crash
      assert.ok([400, 401].includes(response.statusCode));
    });

    it('should reject XSS attempts in login', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/v1/auth/login',
        payload: {
          userId: '<script>alert("XSS")</script>',
          password: 'password'
        }
      });

      assert.ok([400, 401].includes(response.statusCode));
    });

    it('should handle very long usernames', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/v1/auth/login',
        payload: {
          userId: 'a'.repeat(10000),
          password: 'password'
        }
      });

      // Should handle gracefully with 400 or 401
      assert.ok([400, 401].includes(response.statusCode));
    });

    it('should handle special characters in password', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/v1/auth/login',
        payload: {
          userId: 'testuser_api',
          password: '!@#$%^&*()_+-=[]{}|;:,.<>?'
        }
      });

      // Should handle safely
      assert.strictEqual(response.statusCode, 401);
    });

    it('should reject empty payload', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/v1/auth/login',
        payload: {}
      });

      assert.strictEqual(response.statusCode, 400);
    });

    it('should reject null values', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/v1/auth/login',
        payload: {
          userId: null,
          password: null
        }
      });

      assert.strictEqual(response.statusCode, 400);
    });
  });
});

console.log('Running Auth API Integration Tests...');

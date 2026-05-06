const jwt = require('jsonwebtoken');
const request = require('supertest');
const app = require('../../app');

process.env.JWT_SECRET = 'test-secret';
process.env.ACCESS_TOKEN_TTL = '15m';

describe('Authentication Middleware', () => {
  let validToken;
  let adminToken;

  beforeEach(() => {
    validToken = jwt.sign({ id: 1, is_admin: false }, process.env.JWT_SECRET);
    adminToken = jwt.sign({ id: 2, is_admin: true }, process.env.JWT_SECRET);
  });

  describe('JWT Authentication', () => {
    test('should allow access with valid token', async () => {
      const res = await request(app)
        .get('/api/v1/orders/my')
        .set('Authorization', `Bearer ${validToken}`);

      expect(res.status).not.toBe(401);
    });

    test('should reject request without token', async () => {
      const res = await request(app)
        .get('/api/v1/orders/my');

      expect(res.status).toBe(401);
      expect(res.body.error).toContain('Unauthorized');
    });

    test('should reject request with invalid token', async () => {
      const res = await request(app)
        .get('/api/v1/orders/my')
        .set('Authorization', 'Bearer invalid-token');

      expect(res.status).toBe(401);
      expect(res.body.error).toContain('Unauthorized');
    });

    test('should reject request with malformed token', async () => {
      const res = await request(app)
        .get('/api/v1/orders/my')
        .set('Authorization', 'Bearer malformed.token.here');

      expect(res.status).toBe(401);
    });

    test('should reject request with expired token', async () => {
      const expiredToken = jwt.sign(
        { id: 1, is_admin: false },
        process.env.JWT_SECRET,
        { expiresIn: '-1h' }
      );

      const res = await request(app)
        .get('/api/v1/orders/my')
        .set('Authorization', `Bearer ${expiredToken}`);

      expect(res.status).toBe(401);
    });
  });

  describe('Admin Authorization', () => {
    test('should allow admin access with admin token', async () => {
      const res = await request(app)
        .post('/api/v1/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Test Product', price: 100, stock: 5 });

      // Should not get 403 (Forbidden) for admin
      expect(res.status).not.toBe(403);
    });

    test('should reject admin access with regular user token', async () => {
      const res = await request(app)
        .post('/api/v1/products')
        .set('Authorization', `Bearer ${validToken}`)
        .send({ name: 'Test Product', price: 100, stock: 5 });

      expect(res.status).toBe(403);
      expect(res.body.error).toContain('Forbidden');
    });
  });

  describe('Rate Limiting', () => {
    test('should allow normal request rate', async () => {
      const promises = Array(5).fill().map(() =>
        request(app)
          .post('/api/v1/auth/login')
          .send({ email: 'test@example.com', password: 'password123' })
      );

      const responses = await Promise.all(promises);
      const statusCodes = responses.map(res => res.status);
      
      // Should not be rate limited for normal usage
      expect(statusCodes.every(code => code !== 429)).toBe(true);
    });
  });

  describe('CORS Configuration', () => {
    test('should include CORS headers', async () => {
      const res = await request(app)
        .options('/api/v1/products')
        .set('Origin', 'http://localhost:3000');

      expect(res.headers['access-control-allow-origin']).toBeDefined();
    });
  });
});

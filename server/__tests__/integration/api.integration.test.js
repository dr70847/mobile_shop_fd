const request = require('supertest');
const app = require('../../app');
const mysql = require('mysql2/promise');
const { GenericContainer, Wait } = require('testcontainers');
const path = require('path');
const fs = require('fs');

// Test database configuration
let testDbConfig = {
  host: process.env.TEST_DB_HOST || 'localhost',
  port: Number(process.env.TEST_DB_PORT || 3306),
  user: process.env.TEST_DB_USER || 'root',
  password: process.env.TEST_DB_PASSWORD || '',
  database: process.env.TEST_DB_NAME || 'mobileshop_test',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

describe('API Integration Tests', () => {
  let connection;
  let dbContainer;
  let authToken;
  let adminToken;
  let testUserId;
  let testProductId;

  beforeAll(async () => {
    if (process.env.USE_TESTCONTAINERS === 'true') {
      dbContainer = await new GenericContainer('mysql:8.0')
        .withEnvironment({
          MYSQL_ROOT_PASSWORD: process.env.TEST_DB_PASSWORD || 'testpass',
          MYSQL_DATABASE: process.env.TEST_DB_NAME || 'mobileshop_test',
          MYSQL_USER: process.env.TEST_DB_USER || 'testuser',
          MYSQL_PASSWORD: process.env.TEST_DB_PASSWORD || 'testpass'
        })
        .withExposedPorts(3306)
        .withWaitStrategy(Wait.forLogMessage('ready for connections'))
        .start();

      testDbConfig = {
        ...testDbConfig,
        host: dbContainer.getHost(),
        port: dbContainer.getMappedPort(3306),
        user: process.env.TEST_DB_USER || 'testuser',
        password: process.env.TEST_DB_PASSWORD || 'testpass',
        database: process.env.TEST_DB_NAME || 'mobileshop_test'
      };
    }

    // Setup test database connection
    connection = await mysql.createConnection(testDbConfig);

    if (process.env.USE_TESTCONTAINERS === 'true') {
      const schemaPath = path.join(__dirname, 'test-schema.sql');
      const schemaSQL = fs.readFileSync(schemaPath, 'utf8');
      const statements = schemaSQL
        .split(';')
        .map((stmt) => stmt.trim())
        .filter(Boolean);
      for (const statement of statements) {
        await connection.query(statement);
      }
    }
    
    // Clean up test data
    await connection.execute('DELETE FROM order_items WHERE order_id IN (SELECT id FROM orders WHERE user_id IN (SELECT id FROM users WHERE email LIKE "%test%@%"))');
    await connection.execute('DELETE FROM orders WHERE user_id IN (SELECT id FROM users WHERE email LIKE "%test%@%")');
    await connection.execute('DELETE FROM products WHERE name LIKE "%Test%"');
    await connection.execute('DELETE FROM users WHERE email LIKE "%test%@%"');
  });

  afterAll(async () => {
    if (connection) {
      await connection.end();
    }
    if (dbContainer) {
      await dbContainer.stop();
    }
  });

  beforeEach(async () => {
    // Clean up any existing test data
    await connection.execute('DELETE FROM order_items WHERE order_id IN (SELECT id FROM orders WHERE user_id IN (SELECT id FROM users WHERE email LIKE "%test%@%"))');
    await connection.execute('DELETE FROM orders WHERE user_id IN (SELECT id FROM users WHERE email LIKE "%test%@%"))');
    await connection.execute('DELETE FROM products WHERE name LIKE "%Test%"');
    await connection.execute('DELETE FROM users WHERE email LIKE "%test%@%"');
  });

  describe('Authentication Flow', () => {
    test('should register a new user', async () => {
      const userData = {
        name: 'Test User',
        email: 'testuser@example.com',
        password: 'password123'
      };

      const res = await request(app)
        .post('/api/v1/auth/register')
        .send(userData);

      expect(res.status).toBe(201);
      expect(res.body.user.email).toBe(userData.email);
      expect(res.body.user.name).toBe(userData.name);
      expect(res.body.token).toBeDefined();
      
      testUserId = res.body.user.id;
    });

    test('should login with registered user', async () => {
      // First register a user
      const userData = {
        name: 'Login Test User',
        email: 'logintest@example.com',
        password: 'password123'
      };

      await request(app)
        .post('/api/v1/auth/register')
        .send(userData);

      // Then login
      const loginData = {
        email: 'logintest@example.com',
        password: 'password123'
      };

      const res = await request(app)
        .post('/api/v1/auth/login')
        .send(loginData);

      expect(res.status).toBe(200);
      expect(res.body.token).toBeDefined();
      expect(res.body.refreshToken).toBeDefined();
      expect(res.body.expiresIn).toBe(15 * 60);

      authToken = res.body.token;
    });

    test('should reject login with invalid credentials', async () => {
      const loginData = {
        email: 'nonexistent@example.com',
        password: 'wrongpassword'
      };

      const res = await request(app)
        .post('/api/v1/auth/login')
        .send(loginData);

      expect(res.status).toBe(401);
      expect(res.body.error).toContain('Invalid credentials');
    });
  });

  describe('Products Management', () => {
    beforeEach(async () => {
      // Create admin user and get token
      const adminData = {
        name: 'Admin User',
        email: 'admin@example.com',
        password: 'admin123'
      };

      const registerRes = await request(app)
        .post('/api/v1/auth/register')
        .send(adminData);

      // Set user as admin directly in database
      await connection.execute(
        'UPDATE users SET is_admin = 1 WHERE id = ?',
        [registerRes.body.user.id]
      );

      const loginRes = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'admin@example.com',
          password: 'admin123'
        });

      adminToken = loginRes.body.token;
    });

    test('should get all products', async () => {
      const res = await request(app)
        .get('/api/v1/products');

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.items || res.body)).toBe(true);
    });

    test('should create a new product as admin', async () => {
      const productData = {
        name: 'Test Product',
        description: 'A test product for integration testing',
        price: 99.99,
        stock: 10
      };

      const res = await request(app)
        .post('/api/v1/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(productData);

      expect(res.status).toBe(201);
      expect(res.body.name).toBe(productData.name);
      expect(res.body.price).toBe(productData.price);
      expect(res.body._links).toBeDefined();

      testProductId = res.body.id;
    });

    test('should get product by ID', async () => {
      // First create a product
      const productData = {
        name: 'Test Product 2',
        description: 'Another test product',
        price: 149.99,
        stock: 5
      };

      const createRes = await request(app)
        .post('/api/v1/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(productData);

      const productId = createRes.body.id;

      // Then get it by ID
      const res = await request(app)
        .get(`/api/v1/products/${productId}`);

      expect(res.status).toBe(200);
      expect(res.body.name).toBe(productData.name);
      expect(res.body.price).toBe(productData.price);
    });

    test('should reject product creation by non-admin user', async () => {
      // Create regular user
      const userData = {
        name: 'Regular User',
        email: 'regular@example.com',
        password: 'password123'
      };

      const registerRes = await request(app)
        .post('/api/v1/auth/register')
        .send(userData);

      const loginRes = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'regular@example.com',
          password: 'password123'
        });

      const userToken = loginRes.body.token;

      const productData = {
        name: 'Unauthorized Product',
        price: 99.99,
        stock: 5
      };

      const res = await request(app)
        .post('/api/v1/products')
        .set('Authorization', `Bearer ${userToken}`)
        .send(productData);

      expect(res.status).toBe(403);
      expect(res.body.error).toContain('Forbidden');
    });
  });

  describe('Order Management', () => {
    beforeEach(async () => {
      // Create test user
      const userData = {
        name: 'Order Test User',
        email: 'ordertest@example.com',
        password: 'password123'
      };

      const registerRes = await request(app)
        .post('/api/v1/auth/register')
        .send(userData);

      const loginRes = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'ordertest@example.com',
          password: 'password123'
        });

      authToken = loginRes.body.token;
      testUserId = registerRes.body.user.id;

      // Create test product as admin
      const adminLoginRes = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'admin@example.com',
          password: 'admin123'
        });

      adminToken = adminLoginRes.body.token;

      const productData = {
        name: 'Order Test Product',
        description: 'Product for order testing',
        price: 199.99,
        stock: 20
      };

      const productRes = await request(app)
        .post('/api/v1/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(productData);

      testProductId = productRes.body.id;
    });

    test('should create an order', async () => {
      const orderData = {
        items: [
          {
            product_id: testProductId,
            quantity: 2
          }
        ]
      };

      const res = await request(app)
        .post('/api/v1/orders/checkout')
        .set('Authorization', `Bearer ${authToken}`)
        .send(orderData);

      expect(res.status).toBe(200);
      expect(res.body.orderId).toBeDefined();
      expect(res.body._links).toBeDefined();
    });

    test('should get user orders', async () => {
      // First create an order
      const orderData = {
        items: [
          {
            product_id: testProductId,
            quantity: 1
          }
        ]
      };

      await request(app)
        .post('/api/v1/orders/checkout')
        .set('Authorization', `Bearer ${authToken}`)
        .send(orderData);

      // Then get orders
      const res = await request(app)
        .get('/api/v1/orders/my')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.items || res.body)).toBe(true);
      expect((res.body.items || res.body).length).toBeGreaterThan(0);
    });

    test('should reject order creation without authentication', async () => {
      const orderData = {
        items: [
          {
            product_id: testProductId,
            quantity: 1
          }
        ]
      };

      const res = await request(app)
        .post('/api/v1/orders/checkout')
        .send(orderData);

      expect(res.status).toBe(401);
    });
  });

  describe('Error Handling', () => {
    test('should handle 404 for non-existent endpoints', async () => {
      const res = await request(app)
        .get('/api/v1/nonexistent');

      expect(res.status).toBe(404);
    });

    test('should handle invalid JSON in request body', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .set('Content-Type', 'application/json')
        .send('invalid json');

      expect(res.status).toBe(400);
    });

    test('should handle missing required fields', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'test@example.com' }); // Missing password

      expect(res.status).toBe(400);
    });
  });

  describe('Rate Limiting', () => {
    test('should allow normal request frequency', async () => {
      const promises = Array(10).fill().map(() =>
        request(app)
          .get('/api/v1/products')
      );

      const responses = await Promise.all(promises);
      const successCount = responses.filter(res => res.status === 200).length;
      
      expect(successCount).toBeGreaterThan(5); // Most should succeed
    });
  });
});

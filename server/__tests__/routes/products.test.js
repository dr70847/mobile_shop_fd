const request = require('supertest');
const jwt = require('jsonwebtoken');

process.env.JWT_SECRET = 'test-secret';
process.env.ACCESS_TOKEN_TTL = '15m';

// Mock the Product model
jest.mock('../../models/Product', () => ({
  getAll: jest.fn(),
  getById: jest.fn(),
  getByIds: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
}));

const Product = require('../../models/Product');
const app = require('../../app');

describe('Products Routes', () => {
  let adminToken;
  let userToken;

  beforeEach(() => {
    jest.clearAllMocks();
    adminToken = jwt.sign({ id: 1, is_admin: true }, process.env.JWT_SECRET);
    userToken = jwt.sign({ id: 2, is_admin: false }, process.env.JWT_SECRET);
  });

  describe('GET /api/v1/products', () => {
    test('should return all products', async () => {
      const mockProducts = [
        { id: 1, name: 'iPhone 15', price: 999, stock: 10 },
        { id: 2, name: 'Samsung S24', price: 899, stock: 5 }
      ];
      
      Product.getAll.mockImplementation((callback) => callback(null, mockProducts));

      const res = await request(app).get('/api/v1/products');

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.items || res.body)).toBe(true);
      expect(Product.getAll).toHaveBeenCalled();
    });

  });

  describe('GET /api/v1/products/:id', () => {
    test('should return product by ID', async () => {
      const mockProduct = { id: 1, name: 'iPhone 15', price: 999, stock: 10 };
      
      Product.getById.mockImplementation((id, callback) => callback(null, [mockProduct]));

      const res = await request(app).get('/api/v1/products/1');

      expect(res.status).toBe(200);
      expect(res.body.id).toBe(1);
      expect(res.body.name).toBe('iPhone 15');
      expect(Product.getById).toHaveBeenCalledWith('1', expect.any(Function));
    });

    test('should return 404 for non-existent product', async () => {
      Product.getById.mockImplementation((id, callback) => callback(null, []));

      const res = await request(app).get('/api/v1/products/999');

      expect(res.status).toBe(404);
    });

  });

  describe('POST /api/v1/products', () => {
    test('should create product as admin', async () => {
      const productData = { name: 'New Product', price: 299, stock: 5 };
      const mockResult = { insertId: 3 };
      const mockProduct = { id: 3, description: '', ...productData };
      
      Product.create.mockImplementation((data, callback) => callback(null, mockResult));
      Product.getById.mockImplementation((id, callback) => callback(null, [mockProduct]));

      const res = await request(app)
        .post('/api/v1/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(productData);

      expect(res.status).toBe(201);
      expect(res.body.name).toBe(productData.name);
      expect(res.body.price).toBe(productData.price);
      expect(Product.create).toHaveBeenCalledWith(
        { ...productData, description: '' },
        expect.any(Function)
      );
    });

    test('should reject product creation by non-admin', async () => {
      const productData = { name: 'New Product', price: 299, stock: 5 };

      const res = await request(app)
        .post('/api/v1/products')
        .set('Authorization', `Bearer ${userToken}`)
        .send(productData);

      expect(res.status).toBe(403);
      expect(Product.create).not.toHaveBeenCalled();
    });

    test('should reject product creation without authentication', async () => {
      const productData = { name: 'New Product', price: 299, stock: 5 };

      const res = await request(app)
        .post('/api/v1/products')
        .send(productData);

      expect(res.status).toBe(401);
      expect(Product.create).not.toHaveBeenCalled();
    });

    test('should validate required fields', async () => {
      const invalidData = { description: 'Missing name and price' };

      const res = await request(app)
        .post('/api/v1/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(invalidData);

      expect(res.status).toBe(400);
      expect(Product.create).not.toHaveBeenCalled();
    });
  });

  describe('PUT /api/v1/products/:id', () => {
    test('should update product as admin', async () => {
      const updateData = { name: 'Updated Product', price: 399, stock: 8 };
      const mockProduct = { id: 1, description: '', ...updateData };
      
      Product.update.mockImplementation((id, data, callback) => callback(null, { affectedRows: 1 }));
      Product.getById.mockImplementation((id, callback) => callback(null, [mockProduct]));

      const res = await request(app)
        .put('/api/v1/products/1')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData);

      expect(res.status).toBe(200);
      expect(Product.update).toHaveBeenCalledWith(
        1,
        { ...updateData, description: '' },
        expect.any(Function)
      );
    });

    test('should reject product update by non-admin', async () => {
      const updateData = { name: 'Updated Product', price: 399 };

      const res = await request(app)
        .put('/api/v1/products/1')
        .set('Authorization', `Bearer ${userToken}`)
        .send(updateData);

      expect(res.status).toBe(403);
      expect(Product.update).not.toHaveBeenCalled();
    });
  });

  describe('DELETE /api/v1/products/:id', () => {
    test('should delete product as admin', async () => {
      Product.delete.mockImplementation((id, callback) => callback(null, { affectedRows: 1 }));

      const res = await request(app)
        .delete('/api/v1/products/1')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(204);
      expect(Product.delete).toHaveBeenCalledWith(1, expect.any(Function));
    });

    test('should reject product deletion by non-admin', async () => {
      const res = await request(app)
        .delete('/api/v1/products/1')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(403);
      expect(Product.delete).not.toHaveBeenCalled();
    });

    test('should return 404 when trying to delete non-existent product', async () => {
      Product.delete.mockImplementation((id, callback) => callback(null, { affectedRows: 0 }));

      const res = await request(app)
        .delete('/api/v1/products/999')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(404);
    });
  });
});

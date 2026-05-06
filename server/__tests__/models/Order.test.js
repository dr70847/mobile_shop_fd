const Order = require('../../models/Order');
const db = require('../../config/db');

// Mock the database
jest.mock('../../config/db');

describe('Order Model', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAll', () => {
    test('should execute query to get all orders', (done) => {
      const mockOrders = [
        { id: 1, user_id: 1, total_price: 999, status: 'pending' },
        { id: 2, user_id: 2, total_price: 1299, status: 'completed' }
      ];
      
      db.query.mockImplementation((sql, callback) => {
        expect(sql).toBe('SELECT * FROM orders ORDER BY created_at DESC');
        callback(null, mockOrders);
      });

      Order.getAll((err, results) => {
        expect(err).toBeNull();
        expect(results).toEqual(mockOrders);
        done();
      });
    });

    test('should handle database errors', (done) => {
      const dbError = new Error('Database connection failed');
      
      db.query.mockImplementation((sql, callback) => {
        callback(dbError, null);
      });

      Order.getAll((err, results) => {
        expect(err).toBe(dbError);
        expect(results).toBeUndefined();
        done();
      });
    });
  });

  describe('getByUserId', () => {
    test('should execute query with correct user ID', (done) => {
      const mockOrders = [
        { id: 1, user_id: 1, total_price: 999, status: 'pending' },
        { id: 3, user_id: 1, total_price: 599, status: 'shipped' }
      ];
      
      db.query.mockImplementation((sql, params, callback) => {
        expect(sql).toBe('SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC');
        expect(params).toEqual([1]);
        callback(null, mockOrders);
      });

      Order.getByUserId(1, (err, results) => {
        expect(err).toBeNull();
        expect(results).toEqual(mockOrders);
        done();
      });
    });
  });

  describe('createWithItems', () => {
    test('should create order with items using transaction', (done) => {
      const orderData = {
        user_id: 1,
        total_price: 999,
        status: 'pending',
        items: [
          { product_id: 1, quantity: 1, price: 999 },
          { product_id: 2, quantity: 2, price: 50 }
        ]
      };
      
      const mockOrderResult = { insertId: 5, orderId: 5 };
      const mockItemResult = { affectedRows: 1 };
      
      db.query.mockImplementation((sql, params, callback) => {
        if (sql.includes('INSERT INTO orders')) {
          expect(sql).toContain('INSERT INTO orders (user_id, total_price, STATUS)');
          expect(params).toEqual([1, 999, 'pending']);
          callback(null, mockOrderResult);
        } else if (sql.includes('INSERT INTO order_items')) {
          expect(sql).toContain('INSERT INTO order_items (order_id, product_id, quantity, price)');
          callback(null, mockItemResult);
        }
      });

      Order.createWithItems(orderData, (err, result) => {
        expect(err).toBeNull();
        expect(result.orderId).toBe(5);
        done();
      });
    });

    test('should handle order creation errors', (done) => {
      const orderData = {
        user_id: 1,
        total_price: 999,
        status: 'pending',
        items: []
      };
      
      const dbError = new Error('Failed to create order');
      
      db.query.mockImplementation((sql, params, callback) => {
        callback(dbError, null);
      });

      Order.createWithItems(orderData, (err, result) => {
        expect(err).toBe(dbError);
        expect(result).toBeUndefined();
        done();
      });
    });
  });

  });

const Product = require('../../models/Product');
const db = require('../../config/db');

// Mock the database
jest.mock('../../config/db');

describe('Product Model', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAll', () => {
    test('should execute query with correct SQL', (done) => {
      const mockProducts = [
        { id: 1, name: 'iPhone 15', price: 999, stock: 10 },
        { id: 2, name: 'Samsung S24', price: 899, stock: 5 }
      ];
      
      db.query.mockImplementation((sql, callback) => {
        expect(sql).toBe('SELECT id, NAME AS name, description, price, stock, created_at FROM products');
        callback(null, mockProducts);
      });

      Product.getAll((err, results) => {
        expect(err).toBeNull();
        expect(results).toEqual(mockProducts);
        done();
      });
    });

    test('should handle database errors', (done) => {
      const dbError = new Error('Database connection failed');
      
      db.query.mockImplementation((sql, callback) => {
        callback(dbError, null);
      });

      Product.getAll((err, results) => {
        expect(err).toBe(dbError);
        expect(results).toBeNull();
        done();
      });
    });
  });

  describe('getById', () => {
    test('should execute query with correct SQL and ID', (done) => {
      const mockProduct = { id: 1, name: 'iPhone 15', price: 999, stock: 10 };
      
      db.query.mockImplementation((sql, params, callback) => {
        expect(sql).toBe('SELECT id, NAME AS name, description, price, stock, created_at FROM products WHERE id = ?');
        expect(params).toEqual([1]);
        callback(null, [mockProduct]);
      });

      Product.getById(1, (err, results) => {
        expect(err).toBeNull();
        expect(results).toEqual([mockProduct]);
        done();
      });
    });
  });

  describe('getByIds', () => {
    test('should return empty array when no IDs provided', (done) => {
      Product.getByIds([], (err, results) => {
        expect(err).toBeNull();
        expect(results).toEqual([]);
        done();
      });
    });

    test('should execute query with correct SQL and IDs', (done) => {
      const mockProducts = [
        { id: 1, name: 'iPhone 15', price: 999 },
        { id: 2, name: 'Samsung S24', price: 899 }
      ];
      
      db.query.mockImplementation((sql, params, callback) => {
        expect(sql).toBe('SELECT id, NAME AS name, description, price, stock, created_at FROM products WHERE id IN (?)');
        expect(params).toEqual([[1, 2]]);
        callback(null, mockProducts);
      });

      Product.getByIds([1, 2], (err, results) => {
        expect(err).toBeNull();
        expect(results).toEqual(mockProducts);
        done();
      });
    });
  });

  describe('create', () => {
    test('should execute insert query with correct parameters', (done) => {
      const productData = { name: 'iPhone 15', description: 'Latest iPhone', price: 999, stock: 10 };
      const mockResult = { insertId: 3 };
      
      db.query.mockImplementation((sql, params, callback) => {
        expect(sql).toBe('INSERT INTO products (NAME, description, price, stock) VALUES (?, ?, ?, ?)');
        expect(params).toEqual(['iPhone 15', 'Latest iPhone', 999, 10]);
        callback(null, mockResult);
      });

      Product.create(productData, (err, result) => {
        expect(err).toBeNull();
        expect(result).toEqual(mockResult);
        done();
      });
    });

    test('should handle missing description and stock', (done) => {
      const productData = { name: 'iPhone 15', price: 999 };
      const mockResult = { insertId: 3 };
      
      db.query.mockImplementation((sql, params, callback) => {
        expect(sql).toBe('INSERT INTO products (NAME, description, price, stock) VALUES (?, ?, ?, ?)');
        expect(params).toEqual(['iPhone 15', '', 999, 0]);
        callback(null, mockResult);
      });

      Product.create(productData, (err, result) => {
        expect(err).toBeNull();
        expect(result).toEqual(mockResult);
        done();
      });
    });
  });

  describe('update', () => {
    test('should execute update query with correct parameters', (done) => {
      const productData = { name: 'iPhone 15 Pro', description: 'Updated iPhone', price: 1099, stock: 15 };
      const mockResult = { affectedRows: 1 };
      
      db.query.mockImplementation((sql, params, callback) => {
        expect(sql).toBe('UPDATE products SET NAME = ?, description = ?, price = ?, stock = ? WHERE id = ?');
        expect(params).toEqual(['iPhone 15 Pro', 'Updated iPhone', 1099, 15, 1]);
        callback(null, mockResult);
      });

      Product.update(1, productData, (err, result) => {
        expect(err).toBeNull();
        expect(result).toEqual(mockResult);
        done();
      });
    });
  });

  describe('delete', () => {
    test('should execute delete query with correct ID', (done) => {
      const mockResult = { affectedRows: 1 };
      
      db.query.mockImplementation((sql, params, callback) => {
        expect(sql).toBe('DELETE FROM products WHERE id = ?');
        expect(params).toEqual([1]);
        callback(null, mockResult);
      });

      Product.delete(1, (err, result) => {
        expect(err).toBeNull();
        expect(result).toEqual(mockResult);
        done();
      });
    });
  });
});

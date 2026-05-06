const User = require('../../models/User');
const db = require('../../config/db');

// Mock the database
jest.mock('../../config/db');

describe('User Model', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    test('should execute insert query with correct parameters', (done) => {
      const userData = { name: 'John Doe', email: 'john@example.com', password_hash: 'hashed_password', isActive: true };
      const mockResult = { insertId: 1 };
      
      db.query.mockImplementation((sql, params, callback) => {
        expect(sql).toBe('INSERT INTO users (NAME, email, PASSWORD, is_active) VALUES (?, ?, ?, ?)');
        expect(params).toEqual(['John Doe', 'john@example.com', 'hashed_password', 1]);
        callback(null, mockResult);
      });

      User.create(userData, (err, result) => {
        expect(err).toBeNull();
        expect(result).toEqual(mockResult);
        done();
      });
    });

    test('should handle inactive user creation', (done) => {
      const userData = { name: 'Jane Doe', email: 'jane@example.com', password_hash: 'hashed_password', isActive: false };
      const mockResult = { insertId: 2 };
      
      db.query.mockImplementation((sql, params, callback) => {
        expect(sql).toBe('INSERT INTO users (NAME, email, PASSWORD, is_active) VALUES (?, ?, ?, ?)');
        expect(params).toEqual(['Jane Doe', 'jane@example.com', 'hashed_password', 0]);
        callback(null, mockResult);
      });

      User.create(userData, (err, result) => {
        expect(err).toBeNull();
        expect(result).toEqual(mockResult);
        done();
      });
    });
  });

  describe('findByEmail', () => {
    test('should execute query with correct email', (done) => {
      const mockUser = { id: 1, email: 'john@example.com', name: 'John Doe' };
      
      db.query.mockImplementation((sql, params, callback) => {
        expect(sql).toBe('SELECT * FROM users WHERE email = ? LIMIT 1');
        expect(params).toEqual(['john@example.com']);
        callback(null, [mockUser]);
      });

      User.findByEmail('john@example.com', (err, results) => {
        expect(err).toBeNull();
        expect(results).toEqual([mockUser]);
        done();
      });
    });
  });

  describe('findById', () => {
    test('should execute query with correct ID and return user data', (done) => {
      const mockUser = { 
        id: 1, 
        name: 'John Doe', 
        email: 'john@example.com', 
        is_admin: 0, 
        is_active: 1,
        email_verified_at: null,
        profile_image_url: null,
        created_at: new Date(),
        two_factor_enabled: 0
      };
      
      db.query.mockImplementation((sql, params, callback) => {
        expect(sql).toBe('SELECT id, NAME AS name, email, is_admin, is_active, email_verified_at, profile_image_url, created_at, two_factor_enabled FROM users WHERE id = ? LIMIT 1');
        expect(params).toEqual([1]);
        callback(null, [mockUser]);
      });

      User.findById(1, (err, results) => {
        expect(err).toBeNull();
        expect(results).toEqual([mockUser]);
        done();
      });
    });

    test('should handle backward compatibility for missing 2FA columns', (done) => {
      const badFieldError = new Error('ER_BAD_FIELD_ERROR');
      badFieldError.code = 'ER_BAD_FIELD_ERROR';
      const mockUser = { id: 1, name: 'John Doe', email: 'john@example.com', is_admin: 0, created_at: new Date() };
      
      db.query
        .mockImplementationOnce((sql, params, callback) => {
          callback(badFieldError, null);
        })
        .mockImplementationOnce((sql, params, callback) => {
          expect(sql).toBe('SELECT id, NAME AS name, email, is_admin, created_at FROM users WHERE id = ? LIMIT 1');
          expect(params).toEqual([1]);
          callback(null, [mockUser]);
        });

      User.findById(1, (err, results) => {
        expect(err).toBeNull();
        expect(results[0].two_factor_enabled).toBe(0);
        expect(results[0].is_active).toBe(1);
        expect(results[0].email_verified_at).toBeNull();
        expect(results[0].profile_image_url).toBeNull();
        done();
      });
    });
  });

  describe('updateProfile', () => {
    test('should update profile with image URL', (done) => {
      const profileData = { id: 1, name: 'John Smith', email: 'johnsmith@example.com', profileImageUrl: 'http://example.com/image.jpg' };
      const mockResult = { affectedRows: 1 };
      
      db.query.mockImplementation((sql, params, callback) => {
        expect(sql).toBe('UPDATE users SET NAME = ?, email = ?, profile_image_url = ? WHERE id = ?');
        expect(params).toEqual(['John Smith', 'johnsmith@example.com', 'http://example.com/image.jpg', 1]);
        callback(null, mockResult);
      });

      User.updateProfile(profileData, (err, result) => {
        expect(err).toBeNull();
        expect(result).toEqual(mockResult);
        done();
      });
    });

    test('should update profile without image URL', (done) => {
      const profileData = { id: 1, name: 'John Smith', email: 'johnsmith@example.com' };
      const mockResult = { affectedRows: 1 };
      
      db.query.mockImplementation((sql, params, callback) => {
        expect(sql).toBe('UPDATE users SET NAME = ?, email = ? WHERE id = ?');
        expect(params).toEqual(['John Smith', 'johnsmith@example.com', 1]);
        callback(null, mockResult);
      });

      User.updateProfile(profileData, (err, result) => {
        expect(err).toBeNull();
        expect(result).toEqual(mockResult);
        done();
      });
    });
  });

  describe('setAdminRole', () => {
    test('should set user as admin', (done) => {
      const mockResult = { affectedRows: 1 };
      
      db.query.mockImplementation((sql, params, callback) => {
        expect(sql).toBe('UPDATE users SET is_admin = ? WHERE id = ?');
        expect(params).toEqual([1, 1]);
        callback(null, mockResult);
      });

      User.setAdminRole(1, true, (err, result) => {
        expect(err).toBeNull();
        expect(result).toEqual(mockResult);
        done();
      });
    });

    test('should remove admin role', (done) => {
      const mockResult = { affectedRows: 1 };
      
      db.query.mockImplementation((sql, params, callback) => {
        expect(sql).toBe('UPDATE users SET is_admin = ? WHERE id = ?');
        expect(params).toEqual([0, 1]);
        callback(null, mockResult);
      });

      User.setAdminRole(1, false, (err, result) => {
        expect(err).toBeNull();
        expect(result).toEqual(mockResult);
        done();
      });
    });
  });

  describe('Two Factor Authentication', () => {
    test('saveTwoFactorSetup should save temporary secret', (done) => {
      const mockResult = { affectedRows: 1 };
      
      db.query.mockImplementation((sql, params, callback) => {
        expect(sql).toBe('UPDATE users SET two_factor_temp_secret = ?, two_factor_enabled = 0 WHERE id = ?');
        expect(params).toEqual(['TEMP_SECRET', 1]);
        callback(null, mockResult);
      });

      User.saveTwoFactorSetup(1, 'TEMP_SECRET', (err, result) => {
        expect(err).toBeNull();
        expect(result).toEqual(mockResult);
        done();
      });
    });

    test('enableTwoFactor should enable 2FA with secret', (done) => {
      const mockResult = { affectedRows: 1 };
      
      db.query.mockImplementation((sql, params, callback) => {
        expect(sql).toBe('UPDATE users SET two_factor_secret = ?, two_factor_temp_secret = NULL, two_factor_enabled = 1 WHERE id = ?');
        expect(params).toEqual(['FINAL_SECRET', 1]);
        callback(null, mockResult);
      });

      User.enableTwoFactor(1, 'FINAL_SECRET', (err, result) => {
        expect(err).toBeNull();
        expect(result).toEqual(mockResult);
        done();
      });
    });

    test('disableTwoFactor should disable 2FA and clear secrets', (done) => {
      const mockResult = { affectedRows: 1 };
      
      db.query.mockImplementation((sql, params, callback) => {
        expect(sql).toBe('UPDATE users SET two_factor_secret = NULL, two_factor_temp_secret = NULL, two_factor_enabled = 0 WHERE id = ?');
        expect(params).toEqual([1]);
        callback(null, mockResult);
      });

      User.disableTwoFactor(1, (err, result) => {
        expect(err).toBeNull();
        expect(result).toEqual(mockResult);
        done();
      });
    });
  });
});

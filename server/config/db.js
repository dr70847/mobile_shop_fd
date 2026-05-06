const mysql = require('mysql2');
const bcrypt = require('bcryptjs');

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'mobile_shop',
  port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

function ensureDefaultAdminUser() {
  const email = String(process.env.ADMIN_EMAIL || 'admin@mobileshop.local')
    .trim()
    .toLowerCase();
  const password = String(process.env.ADMIN_PASSWORD || 'admin123');
  const name = String(process.env.ADMIN_NAME || 'Admin').trim() || 'Admin';

  pool.query('SELECT id FROM users WHERE email = ? LIMIT 1', [email], async (err, rows) => {
    if (err) {
      console.error('ensureDefaultAdminUser lookup:', err.code || err.message);
      return;
    }
    try {
      const password_hash = await bcrypt.hash(password, 10);
      if (rows && rows.length > 0) {
        pool.query(
          'UPDATE users SET is_admin = 1 WHERE email = ?',
          [email],
          (e2) => {
            if (e2) console.error('ensureDefaultAdminUser grant admin:', e2.code || e2.message);
          }
        );
      } else {
        pool.query(
          'INSERT INTO users (NAME, email, PASSWORD, is_admin) VALUES (?, ?, ?, 1)',
          [name, email, password_hash],
          (e3) => {
            if (e3) {
              console.error('ensureDefaultAdminUser insert:', e3.code || e3.message);
              return;
            }
            const pwdHint =
              process.env.ADMIN_PASSWORD != null && process.env.ADMIN_PASSWORD !== ''
                ? 'value of ADMIN_PASSWORD'
                : 'admin123 (set ADMIN_PASSWORD to change)';
            console.log(`Default admin account ready — login email: ${email}, password: ${pwdHint}`);
          }
        );
      }
    } catch (e) {
      console.error('ensureDefaultAdminUser:', e.message || e);
    }
  });
}

function runSchemaBootstrap() {
  pool.query(
    `CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    NAME VARCHAR(120) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    PASSWORD VARCHAR(255) NOT NULL,
    is_admin TINYINT(1) NOT NULL DEFAULT 0,
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    email_verified_at DATETIME NULL,
    two_factor_enabled TINYINT(1) NOT NULL DEFAULT 0,
    two_factor_secret VARCHAR(255) NULL,
    two_factor_temp_secret VARCHAR(255) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`,
    (err) => {
      if (err) {
        console.error('Failed to ensure users table:', err.code || err.message);
        return;
      }
      pool.query(
        'ALTER TABLE users ADD COLUMN is_admin TINYINT(1) NOT NULL DEFAULT 0',
        (err2) => {
          if (err2 && err2.code !== 'ER_DUP_FIELDNAME') {
            console.error('Failed to add is_admin to users:', err2.code || err2.message);
          }
          pool.query(
            'ALTER TABLE users ADD COLUMN is_active TINYINT(1) NOT NULL DEFAULT 1',
            (err2b) => {
              if (err2b && err2b.code !== 'ER_DUP_FIELDNAME') {
                console.error('Failed to add is_active to users:', err2b.code || err2b.message);
              }
              pool.query(
                'ALTER TABLE users ADD COLUMN email_verified_at DATETIME NULL',
                (err2c) => {
                  if (err2c && err2c.code !== 'ER_DUP_FIELDNAME') {
                    console.error('Failed to add email_verified_at to users:', err2c.code || err2c.message);
                  }
                  pool.query(
                    'ALTER TABLE users ADD COLUMN two_factor_enabled TINYINT(1) NOT NULL DEFAULT 0',
                    (err2d) => {
                      if (err2d && err2d.code !== 'ER_DUP_FIELDNAME') {
                        console.error('Failed to add two_factor_enabled to users:', err2d.code || err2d.message);
                      }
                      pool.query(
                        'ALTER TABLE users ADD COLUMN two_factor_secret VARCHAR(255) NULL',
                        (err2e) => {
                          if (err2e && err2e.code !== 'ER_DUP_FIELDNAME') {
                            console.error('Failed to add two_factor_secret to users:', err2e.code || err2e.message);
                          }
                          pool.query(
                            'ALTER TABLE users ADD COLUMN two_factor_temp_secret VARCHAR(255) NULL',
                            (err2f) => {
                              if (err2f && err2f.code !== 'ER_DUP_FIELDNAME') {
                                console.error('Failed to add two_factor_temp_secret to users:', err2f.code || err2f.message);
                              }
          pool.query(
            `CREATE TABLE IF NOT EXISTS order_items (
            id INT AUTO_INCREMENT PRIMARY KEY,
            order_id INT NOT NULL,
            product_id INT NOT NULL,
            quantity INT NOT NULL DEFAULT 1,
            unit_price DECIMAL(10,2) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX (order_id),
            INDEX (product_id)
          )`,
            (err3) => {
              if (err3) {
                console.error('Failed to ensure order_items table:', err3.code || err3.message);
              }
              pool.query(
                `CREATE TABLE IF NOT EXISTS products (
                id INT AUTO_INCREMENT PRIMARY KEY,
                NAME VARCHAR(255) NOT NULL,
                description TEXT,
                price DECIMAL(10,2) NOT NULL,
                stock INT NOT NULL DEFAULT 0,
                image_url VARCHAR(512) NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
              )`,
                (err4) => {
                  if (err4) {
                    console.error('Failed to ensure products table:', err4.code || err4.message);
                    return;
                  }
                  pool.query(
                    'ALTER TABLE products ADD COLUMN image_url VARCHAR(512) NULL',
                    (err4b) => {
                      if (err4b && err4b.code !== 'ER_DUP_FIELDNAME') {
                        console.error('Failed to add image_url to products:', err4b.code || err4b.message);
                      }
                    }
                  );
                  pool.query(
                    `CREATE TABLE IF NOT EXISTS refresh_tokens (
                      id INT AUTO_INCREMENT PRIMARY KEY,
                      user_id INT NOT NULL,
                      token_hash CHAR(64) NOT NULL,
                      expires_at DATETIME NOT NULL,
                      revoked_at DATETIME NULL,
                      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                      UNIQUE KEY uniq_token_hash (token_hash),
                      INDEX idx_user_id (user_id),
                      INDEX idx_expires_at (expires_at),
                      INDEX idx_revoked_at (revoked_at)
                    )`,
                    (err5) => {
                      if (err5) {
                        console.error('Failed to ensure refresh_tokens table:', err5.code || err5.message);
                        return;
                      }
                      pool.query(
                        `CREATE TABLE IF NOT EXISTS user_action_tokens (
                          id INT AUTO_INCREMENT PRIMARY KEY,
                          user_id INT NOT NULL,
                          purpose ENUM('activation', 'password_reset') NOT NULL,
                          token_hash CHAR(64) NOT NULL,
                          expires_at DATETIME NOT NULL,
                          consumed_at DATETIME NULL,
                          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                          UNIQUE KEY uniq_user_action_token_hash (token_hash),
                          INDEX idx_uat_user (user_id),
                          INDEX idx_uat_purpose (purpose),
                          INDEX idx_uat_expires (expires_at)
                        )`,
                        (err6) => {
                          if (err6) {
                            console.error('Failed to ensure user_action_tokens table:', err6.code || err6.message);
                            return;
                          }
                          pool.query(
                            `CREATE TABLE IF NOT EXISTS audit_logs (
                              id BIGINT AUTO_INCREMENT PRIMARY KEY,
                              actor_user_id INT NULL,
                              action VARCHAR(120) NOT NULL,
                              target_type VARCHAR(80) NOT NULL,
                              target_id VARCHAR(80) NULL,
                              metadata_json JSON NULL,
                              ip_address VARCHAR(64) NULL,
                              user_agent VARCHAR(255) NULL,
                              created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                              INDEX idx_audit_created (created_at),
                              INDEX idx_audit_actor (actor_user_id),
                              INDEX idx_audit_action (action)
                            )`,
                            (err7) => {
                              if (err7) {
                                console.error('Failed to ensure audit_logs table:', err7.code || err7.message);
                                return;
                              }
                              ensureDefaultAdminUser();
                            }
                          );
                        }
                      );
                    }
                  );
                }
              );
            }
          );
                            }
                          );
                        }
                      );
                    }
                  );
                }
              );
            }
          );
        }
      );
    }
  );
}

const isTestEnv = process.env.NODE_ENV === 'test' || process.env.JEST_WORKER_ID != null;
if (!isTestEnv) {
  pool.query('SELECT 1', (err) => {
    if (err) {
      console.error('MySQL not ready:', err.code || err.message);
      return;
    }
    console.log('Connected to MySQL database!');
    runSchemaBootstrap();
  });
}

module.exports = pool;

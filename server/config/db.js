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
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
              )`,
                (err4) => {
                  if (err4) {
                    console.error('Failed to ensure products table:', err4.code || err4.message);
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

pool.query('SELECT 1', (err) => {
  if (err) {
    console.error('MySQL not ready:', err.code || err.message);
    return;
  }
  console.log('Connected to MySQL database!');
  runSchemaBootstrap();
});

module.exports = pool;

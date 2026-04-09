const mysql = require('mysql2');

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

// Optional lightweight connectivity check (won't crash the server if DB is down)
pool.query('SELECT 1', (err) => {
  if (err) {
    console.error('MySQL not ready:', err.code || err.message);
    return;
  }
  console.log('Connected to MySQL database!');
});

// Auto-create auth table if missing (keeps setup simple for XAMPP/phpMyAdmin users)
pool.query(
  `CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    NAME VARCHAR(120) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    PASSWORD VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`,
  (err) => {
    if (err) {
      console.error("Failed to ensure users table:", err.code || err.message);
    }
  }
);

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
  (err) => {
    if (err) {
      console.error("Failed to ensure order_items table:", err.code || err.message);
    }
  }
);

module.exports = pool;
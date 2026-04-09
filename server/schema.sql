-- MobileShop MySQL schema + minimal seed data

CREATE DATABASE IF NOT EXISTS mobile_shop;
USE mobile_shop;

CREATE TABLE IF NOT EXISTS products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  NAME VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  stock INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS orders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  product_id INT NOT NULL,
  quantity INT NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id)
);

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  NAME VARCHAR(120) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  PASSWORD VARCHAR(255) NOT NULL,
  is_admin TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Seed data (optional) — column NAME matches server/models/Product.js
INSERT INTO products (NAME, description, price, stock)
VALUES
  ('iPhone 15', 'Latest Apple', 999.00, 10),
  ('Samsung Galaxy S24', 'Android flagship', 899.00, 10),
  ('Google Pixel 9', 'Pure Android', 799.00, 10);

-- MobileShop MySQL schema (advanced entity model)

CREATE DATABASE IF NOT EXISTS mobile_shop;
USE mobile_shop;

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  NAME VARCHAR(120) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  PASSWORD VARCHAR(255) NOT NULL,
  is_admin TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chk_users_name_len CHECK (CHAR_LENGTH(NAME) BETWEEN 2 AND 120),
  CONSTRAINT chk_users_email_format CHECK (email LIKE '%_@_%._%')
);

CREATE TABLE IF NOT EXISTS products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  NAME VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  stock INT NOT NULL DEFAULT 0,
  product_type ENUM('PHYSICAL', 'DIGITAL') NOT NULL DEFAULT 'PHYSICAL',
  sku VARCHAR(64) UNIQUE,
  status ENUM('ACTIVE', 'DRAFT', 'DISCONTINUED') NOT NULL DEFAULT 'ACTIVE',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chk_products_price CHECK (price >= 0),
  CONSTRAINT chk_products_stock CHECK (stock >= 0)
);

CREATE TABLE IF NOT EXISTS orders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  total_price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  STATUS ENUM('NEW', 'PENDING_PAYMENT', 'PAID', 'SHIPPED', 'DELIVERED', 'CANCELLED') NOT NULL DEFAULT 'NEW',
  shipping_address JSON NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_orders_user FOREIGN KEY (user_id) REFERENCES users(id),
  CONSTRAINT chk_orders_total_price CHECK (total_price >= 0),
  CONSTRAINT chk_orders_shipping_address_json CHECK (shipping_address IS NULL OR JSON_VALID(shipping_address))
);

CREATE TABLE IF NOT EXISTS order_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_id INT NOT NULL,
  product_id INT NOT NULL,
  quantity INT NOT NULL DEFAULT 1,
  unit_price DECIMAL(10,2) NOT NULL,
  product_snapshot JSON NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_order_items_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  CONSTRAINT fk_order_items_product FOREIGN KEY (product_id) REFERENCES products(id),
  CONSTRAINT chk_order_items_qty CHECK (quantity > 0),
  CONSTRAINT chk_order_items_price CHECK (unit_price >= 0),
  CONSTRAINT chk_order_items_snapshot_json CHECK (product_snapshot IS NULL OR JSON_VALID(product_snapshot))
);

CREATE TABLE IF NOT EXISTS categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  slug VARCHAR(160) NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS product_categories (
  product_id INT NOT NULL,
  category_id INT NOT NULL,
  linked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (product_id, category_id),
  CONSTRAINT fk_pc_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  CONSTRAINT fk_pc_category FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS reviews (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  product_id INT NOT NULL,
  rating INT NOT NULL,
  comment TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_review_user_product (user_id, product_id),
  CONSTRAINT fk_reviews_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_reviews_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  CONSTRAINT chk_reviews_rating CHECK (rating BETWEEN 1 AND 5),
  CONSTRAINT chk_reviews_comment_len CHECK (comment IS NULL OR CHAR_LENGTH(comment) <= 2000)
);

CREATE TABLE IF NOT EXISTS payments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_id INT NOT NULL,
  payment_type ENUM('CARD', 'WALLET') NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  STATUS ENUM('PENDING', 'AUTHORIZED', 'CAPTURED', 'FAILED') NOT NULL DEFAULT 'PENDING',
  provider_ref VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_payments_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  CONSTRAINT chk_payments_amount CHECK (amount > 0)
);

CREATE TABLE IF NOT EXISTS shipments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_id INT NOT NULL UNIQUE,
  tracking_number VARCHAR(120),
  carrier VARCHAR(80),
  STATUS ENUM('PENDING', 'IN_TRANSIT', 'DELIVERED', 'RETURNED') NOT NULL DEFAULT 'PENDING',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_shipments_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
);

-- Backward-compatible migrations for existing databases
ALTER TABLE products ADD COLUMN IF NOT EXISTS product_type ENUM('PHYSICAL', 'DIGITAL') NOT NULL DEFAULT 'PHYSICAL';
ALTER TABLE products ADD COLUMN IF NOT EXISTS sku VARCHAR(64) NULL;
ALTER TABLE products ADD COLUMN IF NOT EXISTS status ENUM('ACTIVE', 'DRAFT', 'DISCONTINUED') NOT NULL DEFAULT 'ACTIVE';
ALTER TABLE products ADD UNIQUE INDEX IF NOT EXISTS uq_products_sku (sku);

ALTER TABLE orders ADD COLUMN IF NOT EXISTS total_price DECIMAL(10,2) NOT NULL DEFAULT 0.00;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS STATUS ENUM('NEW', 'PENDING_PAYMENT', 'PAID', 'SHIPPED', 'DELIVERED', 'CANCELLED') NOT NULL DEFAULT 'NEW';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_address JSON NULL;

ALTER TABLE order_items ADD COLUMN IF NOT EXISTS product_snapshot JSON NULL;

ALTER TABLE payments ADD COLUMN IF NOT EXISTS provider_ref VARCHAR(255) NULL;

-- Optimized indexes for frequently used filters/sorts
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);
CREATE INDEX IF NOT EXISTS idx_products_status_created ON products(status, created_at);
CREATE INDEX IF NOT EXISTS idx_products_name ON products(NAME);
CREATE INDEX IF NOT EXISTS idx_orders_user_created ON orders(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_orders_status_created ON orders(STATUS, created_at);
CREATE INDEX IF NOT EXISTS idx_order_items_order_product ON order_items(order_id, product_id);
CREATE INDEX IF NOT EXISTS idx_payments_order_status ON payments(order_id, STATUS);
CREATE INDEX IF NOT EXISTS idx_reviews_product_created ON reviews(product_id, created_at);
CREATE INDEX IF NOT EXISTS idx_shipments_status ON shipments(STATUS);

-- Stored procedures for advanced DB-side business logic
DROP PROCEDURE IF EXISTS sp_create_order_with_items;
DELIMITER $$
CREATE PROCEDURE sp_create_order_with_items(
  IN p_user_id INT,
  IN p_shipping_address JSON
)
BEGIN
  DECLARE v_order_id INT;

  IF p_user_id IS NULL OR p_user_id <= 0 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Invalid user id.';
  END IF;

  START TRANSACTION;

  INSERT INTO orders (user_id, STATUS, shipping_address)
  VALUES (p_user_id, 'NEW', p_shipping_address);
  SET v_order_id = LAST_INSERT_ID();

  COMMIT;

  SELECT v_order_id AS order_id;
END$$
DELIMITER ;

DROP PROCEDURE IF EXISTS sp_add_order_item;
DELIMITER $$
CREATE PROCEDURE sp_add_order_item(
  IN p_order_id INT,
  IN p_product_id INT,
  IN p_quantity INT
)
BEGIN
  DECLARE v_price DECIMAL(10,2);
  DECLARE v_name VARCHAR(255);
  DECLARE v_status VARCHAR(20);

  IF p_order_id IS NULL OR p_order_id <= 0 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Invalid order id.';
  END IF;
  IF p_product_id IS NULL OR p_product_id <= 0 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Invalid product id.';
  END IF;
  IF p_quantity IS NULL OR p_quantity <= 0 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Quantity must be greater than zero.';
  END IF;

  SELECT price, NAME, status
  INTO v_price, v_name, v_status
  FROM products
  WHERE id = p_product_id
  LIMIT 1;

  IF v_price IS NULL THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Product not found.';
  END IF;

  INSERT INTO order_items (order_id, product_id, quantity, unit_price, product_snapshot)
  VALUES (
    p_order_id,
    p_product_id,
    p_quantity,
    v_price,
    JSON_OBJECT('product_id', p_product_id, 'name', v_name, 'unit_price', v_price, 'status', v_status)
  );
END$$
DELIMITER ;

DROP PROCEDURE IF EXISTS sp_transition_order_status;
DELIMITER $$
CREATE PROCEDURE sp_transition_order_status(
  IN p_order_id INT,
  IN p_next_status VARCHAR(20)
)
BEGIN
  DECLARE v_current_status VARCHAR(20);

  SELECT STATUS INTO v_current_status
  FROM orders
  WHERE id = p_order_id
  LIMIT 1;

  IF v_current_status IS NULL THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Order not found.';
  END IF;

  IF NOT (
      (v_current_status = 'NEW' AND p_next_status IN ('PENDING_PAYMENT', 'CANCELLED')) OR
      (v_current_status = 'PENDING_PAYMENT' AND p_next_status IN ('PAID', 'CANCELLED')) OR
      (v_current_status = 'PAID' AND p_next_status IN ('SHIPPED')) OR
      (v_current_status = 'SHIPPED' AND p_next_status IN ('DELIVERED'))
  ) THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Invalid order status transition.';
  END IF;

  UPDATE orders
  SET STATUS = p_next_status
  WHERE id = p_order_id;
END$$
DELIMITER ;

-- Triggers for integrity and denormalized calculations
DROP TRIGGER IF EXISTS trg_order_items_before_insert_stock_guard;
DELIMITER $$
CREATE TRIGGER trg_order_items_before_insert_stock_guard
BEFORE INSERT ON order_items
FOR EACH ROW
BEGIN
  DECLARE v_stock INT;
  SELECT stock INTO v_stock FROM products WHERE id = NEW.product_id LIMIT 1;
  IF v_stock IS NULL THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Product not found.';
  END IF;
  IF NEW.quantity > v_stock THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Insufficient stock for product.';
  END IF;
END$$
DELIMITER ;

DROP TRIGGER IF EXISTS trg_order_items_after_insert_reduce_stock;
DELIMITER $$
CREATE TRIGGER trg_order_items_after_insert_reduce_stock
AFTER INSERT ON order_items
FOR EACH ROW
BEGIN
  UPDATE products
  SET stock = stock - NEW.quantity
  WHERE id = NEW.product_id;
END$$
DELIMITER ;

DROP TRIGGER IF EXISTS trg_order_items_after_delete_restore_stock;
DELIMITER $$
CREATE TRIGGER trg_order_items_after_delete_restore_stock
AFTER DELETE ON order_items
FOR EACH ROW
BEGIN
  UPDATE products
  SET stock = stock + OLD.quantity
  WHERE id = OLD.product_id;
END$$
DELIMITER ;

DROP TRIGGER IF EXISTS trg_order_items_after_insert_recalc_total;
DELIMITER $$
CREATE TRIGGER trg_order_items_after_insert_recalc_total
AFTER INSERT ON order_items
FOR EACH ROW
BEGIN
  UPDATE orders o
  SET o.total_price = (
    SELECT COALESCE(SUM(oi.quantity * oi.unit_price), 0)
    FROM order_items oi
    WHERE oi.order_id = NEW.order_id
  )
  WHERE o.id = NEW.order_id;
END$$
DELIMITER ;

DROP TRIGGER IF EXISTS trg_order_items_after_update_recalc_total;
DELIMITER $$
CREATE TRIGGER trg_order_items_after_update_recalc_total
AFTER UPDATE ON order_items
FOR EACH ROW
BEGIN
  UPDATE orders o
  SET o.total_price = (
    SELECT COALESCE(SUM(oi.quantity * oi.unit_price), 0)
    FROM order_items oi
    WHERE oi.order_id = NEW.order_id
  )
  WHERE o.id = NEW.order_id;
END$$
DELIMITER ;

DROP TRIGGER IF EXISTS trg_order_items_after_delete_recalc_total;
DELIMITER $$
CREATE TRIGGER trg_order_items_after_delete_recalc_total
AFTER DELETE ON order_items
FOR EACH ROW
BEGIN
  UPDATE orders o
  SET o.total_price = (
    SELECT COALESCE(SUM(oi.quantity * oi.unit_price), 0)
    FROM order_items oi
    WHERE oi.order_id = OLD.order_id
  )
  WHERE o.id = OLD.order_id;
END$$
DELIMITER ;

-- Seed data (idempotent via unique SKU)
INSERT INTO products (NAME, description, price, stock, product_type, sku, status)
VALUES
  ('iPhone 15', 'Latest Apple', 999.00, 10, 'PHYSICAL', 'APL-IP15', 'ACTIVE'),
  ('Samsung Galaxy S24', 'Android flagship', 899.00, 10, 'PHYSICAL', 'SMS-S24', 'ACTIVE'),
  ('Google Pixel 9', 'Pure Android', 799.00, 10, 'PHYSICAL', 'GGL-PX9', 'ACTIVE')
ON DUPLICATE KEY UPDATE
  NAME = VALUES(NAME),
  description = VALUES(description),
  price = VALUES(price),
  stock = VALUES(stock),
  status = VALUES(status);

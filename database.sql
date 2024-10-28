-- POSTGRESQL
--CREATE DATABASE pharmacy_management;
--USE pharmacy_management;

-- * CẦN THIẾT LẬP MÚI GIỜ TRONG FILE postgresql.conf
-- Xem các tên timezone có trong PostgreSQL
--SELECT * FROM pg_timezone_names;

-- * Kiểm tra encoding
-- SELECT datname, pg_encoding_to_char(encoding) FROM pg_database WHERE datname = 'your_database_name';

CREATE TABLE
  IF NOT EXISTS users (
    user_id SERIAL PRIMARY KEY,
    uuid UUID DEFAULT gen_random_uuid() UNIQUE,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(200) NOT NULL,
    role VARCHAR(20) DEFAULT 'CUSTOMER', -- ADMIN, MANAGER, STAFF, CUSTOMER
    is_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );

CREATE INDEX IF NOT EXISTS idx_users_uuid ON users (uuid);

-- ALTER TABLE users ALTER COLUMN role SET DEFAULT 'CUSTOMER';

CREATE TABLE sessions (
  id SERIAL PRIMARY KEY,
  uuid UUID DEFAULT gen_random_uuid() UNIQUE,
  user_uuid UUID NOT NULL,
  token TEXT NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_sessions_user_uuid FOREIGN KEY (user_uuid) REFERENCES users(uuid) ON DELETE CASCADE
);

CREATE INDEX idx_sessions_token ON sessions (token);
CREATE INDEX idx_sessions_user_uuid ON sessions (user_uuid);

CREATE TABLE
  IF NOT EXISTS suppliers (
    supplier_id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    phone_number VARCHAR(20) NOT NULL,
    address VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );

CREATE TABLE
  IF NOT EXISTS customers (
    customer_id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    phone_number VARCHAR(20) NOT NULL,
    email VARCHAR(50),
    address VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );

ALTER TABLE customers
ADD CONSTRAINT unique_phone_number UNIQUE (phone_number);

CREATE TABLE IF NOT EXISTS medicines (
  medicine_id SERIAL PRIMARY KEY,
  uuid UUID DEFAULT gen_random_uuid() UNIQUE,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(50), -- Antibiotics, Pain relievers and antipyretics, NSAIDs, Cardiovascular drugs, Diabetes medic, Sedatives and antipsychotics, Anti-ulcer medic, Antihistamines, Antifungal medic,  Vitamins and mineral supplements
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  quantity_unit VARCHAR(20) NOT NULL, -- Box, Blister pack, Bottle, Tube, Ampoule, Tablet/Pill, Capsule, Sachet, Vial, Bag
  tags JSONB DEFAULT '[]'::jsonb, -- ["new", "popular", "sale"]
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  thumbnail_url VARCHAR(255)
);

CREATE INDEX idx_medicines_uuid ON medicines (uuid);
CREATE INDEX idx_medicines_tags ON medicines USING GIN (tags);
-- CREATE INDEX idx_medicines_details ON medicines USING GIN (details);

-- DROP INDEX idx_medicines_details;
-- UPDATE medicines SET details = NULL;
-- ALTER TABLE medicines DROP COLUMN details;

CREATE TABLE IF NOT EXISTS medicine_details (
  detail_id SERIAL PRIMARY KEY,
  medicine_uuid UUID REFERENCES medicines(uuid) ON DELETE CASCADE,
  brand_name VARCHAR(255), -- Tên thương hiệu
  generic_name VARCHAR(255), -- Tên chung
  manufacturer_name VARCHAR(255), -- Tên nhà sản xuất
  packaging_specification VARCHAR(255), -- Quy cách đóng gói
  substance_name VARCHAR(255), -- Tên hoạt chất
  composition TEXT, -- Thành phần
  usage_route VARCHAR(50), -- Đường dùng: oral, injection, topical, etc.
  dosage_and_administration TEXT, -- Liều lượng và cách dùng
  contraindications TEXT, -- Chống chỉ định
  adverse_reactions TEXT, -- Tác dụng phụ
  usage_precautions TEXT, -- Lưu ý sử dụng
  usage_precautions_pregnant TEXT, -- Lưu ý sử dụng với phụ nữ có thai và đang cho con bú
  overdose_management TEXT, -- Xử lý khi quá liều
  storage_and_preservation TEXT, -- Lưu trữ và bảo quản
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_medicine_details_medicine_uuid ON medicine_details (medicine_uuid);

CREATE TABLE IF NOT EXISTS medicine_images (
    image_id SERIAL PRIMARY KEY,
    medicine_uuid UUID,
    image_url VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_medicine_images_medicine_uuid FOREIGN KEY (medicine_uuid) REFERENCES medicines (uuid) ON DELETE CASCADE
);

CREATE INDEX idx_medicine_images_medicine_uuid ON medicine_images (medicine_uuid);

-- INSERT INTO "medicine_images" ("medicine_uuid", "image_url") VALUES (
--   '8a3e9ebc-7394-4181-8014-0c4c9f14ce9a', 'https://res.cloudinary.com/dkystkqgb/image/upload/v1727610099/product_images/z9oei2hxz77cmtu0nsha.jpg'
-- )

CREATE TABLE IF NOT EXISTS medicine_batches (
  batch_id SERIAL PRIMARY KEY,
  medicine_uuid UUID NOT NULL, -- Reference to the medicines table
  expiration_date DATE NOT NULL,
  quantity INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_batches_medicine_uuid FOREIGN KEY (medicine_uuid) REFERENCES medicines (uuid) ON DELETE CASCADE
);

ALTER TABLE medicine_batches
ADD CONSTRAINT unique_medicine_uuid_expiration_date
UNIQUE (medicine_uuid, expiration_date);

CREATE TABLE IF NOT EXISTS receipts (
  receipt_id SERIAL PRIMARY KEY,
  uuid UUID DEFAULT gen_random_uuid() UNIQUE,
  supplier_id INT,
  batch_id INT, -- Reference to a specific batch of medicine
  quantity INT NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by VARCHAR(50),
  CONSTRAINT fk_receipts_supplier_id FOREIGN KEY (supplier_id) REFERENCES suppliers (supplier_id) ON DELETE SET NULL,
  CONSTRAINT fk_receipts_batch_id FOREIGN KEY (batch_id) REFERENCES medicine_batches (batch_id) ON DELETE SET NULL,
  CONSTRAINT fk_receipts_created_by FOREIGN KEY (created_by) REFERENCES users (username) ON DELETE SET NULL
);

CREATE INDEX idx_receipts_uuid ON receipts (uuid);
CREATE INDEX idx_receipts_batch_id ON receipts (batch_id);

CREATE TABLE IF NOT EXISTS carts (
  cart_id SERIAL PRIMARY KEY,
  user_uuid UUID, -- Only for logged-in users
  items JSONB DEFAULT '[]'::jsonb, -- Stores all cart items as a JSON array
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_carts_user_uuid FOREIGN KEY (user_uuid) REFERENCES users(uuid) ON DELETE CASCADE
);

CREATE INDEX idx_carts_user_uuid ON carts(user_uuid);
ALTER TABLE carts ADD CONSTRAINT unique_user_uuid UNIQUE (user_uuid);

-- items: [{product_uuid: 1, quantity: 2}, {product_uuid: 2, quantity: 1} ...]

CREATE TABLE
  IF NOT EXISTS orders (
    order_id SERIAL PRIMARY KEY,
    uuid UUID DEFAULT gen_random_uuid() UNIQUE,
    customer_id INT,
    status VARCHAR(20) DEFAULT 'Pending', -- Pending, Confirmed, Delivered, Cancelled
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_orders_customer_id FOREIGN KEY (customer_id) REFERENCES customers (customer_id) ON DELETE SET NULL
  );

CREATE INDEX IF NOT EXISTS idx_orders_uuid ON orders (uuid);

CREATE TABLE IF NOT EXISTS order_details (
    order_detail_id SERIAL PRIMARY KEY,
    order_uuid UUID,
    medicine_uuid UUID,
    medicine_batch_id INT,
    quantity INT NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_order_details_order_uuid FOREIGN KEY (order_uuid) REFERENCES orders (uuid) ON DELETE CASCADE,
    CONSTRAINT fk_order_details_medicine_batch FOREIGN KEY (medicine_batch_id) REFERENCES medicine_batches (batch_id) ON DELETE SET NULL
);

CREATE INDEX idx_order_details_order_uuid ON order_details (order_uuid);
CREATE INDEX idx_order_details_medicine_batch ON order_details (medicine_batch_id);

-- ALTER TABLE ADD CONSTRAINT fk_order_details_medicine_batch FOREIGN KEY (medicine_batch_id) REFERENCES medicine_batches (batch_id) ON DELETE SET NULL;
-- ALTER TABLE ADD CONSTRAINT fk_order_details_order_uuid FOREIGN KEY (order_uuid) REFERENCES orders (uuid) ON DELETE CASCADE;

-- ALTER TABLE order_details DROP CONSTRAINT fk_order_details_medicine_batch;
-- ALTER TABLE order_details DROP CONSTRAINT fk_order_details_order_uuid;
-- DROP INDEX idx_order_details_medicine_batch;
-- DROP INDEX idx_order_details_order_uuid;
-- DROP TABLE order_details;

CREATE TABLE
  IF NOT EXISTS payments (
    payment_id SERIAL PRIMARY KEY,
    order_uuid UUID,
    payment_method VARCHAR(20) DEFAULT 'Cash', -- Cash, Credit
    total_amount DECIMAL(10, 2) NOT NULL,
    payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_payments_order_uuid FOREIGN KEY (order_uuid) REFERENCES orders (uuid) ON DELETE CASCADE
  );

CREATE INDEX idx_payments_order_uuid ON payments (order_uuid);

INSERT INTO
  users (username, password, role)
VALUES
  ('admin', 'v2h@12345', 'Admin'),
  ('manager', 'v2h@12345', 'Manager'),
  ('staff', 'v2h@12345', 'Staff'),
  ('customer', 'v2h@12345', 'Customer');

INSERT INTO
  suppliers (name, phone_number, address)
VALUES
  (
    'Supplier 1',
    '1234567890',
    'Address of Supplier 1'
  ),
  (
    'Supplier 2',
    '1122334455',
    'Address of Supplier 2'
  ),
  (
    'Supplier 3',
    '1462734791',
    'Address of Supplier 3'
  );

INSERT INTO
  customers (name, phone_number, email)
VALUES
  ('Anonymous', '1234567890', NULL),
  ('Customer 1', '1357901234', 'X9Lp8@example.com'),
  ('Customer 2', '2468101215', 'cus2@example.com');

INSERT INTO medicines (name, category, description, price, quantity_unit, tags) VALUES
  ('Medicine 1', 'Antibiotics', 'Description of Medicine 1', 10.99, 'Bag', '["new", "popular"]'),
  ('Medicine 2', 'Pain Relievers', 'Description of Medicine 2', 19.99, 'Tube', '["new", "popular"]'),),
  ('Medicine 3', 'Antipyretics', 'Description of Medicine 3', 14.99, 'Bottle', '["new", "popular"]'),;

-- DELETE FROM medicines;
-- ALTER SEQUENCE medicines_medicine_id_seq RESTART WITH 1;
-- ALTER TABLE <TABLE> DROP CONSTRAINT <FK_CONSTRAINT>;

-- ALTER TABLE medicines
-- ADD COLUMN tags JSONB DEFAULT '[]'::jsonb;  -- ["new", "popular", "sale"]

-- ALTER TABLE medicines ADD COLUMN uuid UUID DEFAULT gen_random_uuid() UNIQUE;

-- Tạo view

CREATE VIEW vw_users_with_uuid AS
SELECT uuid, username, password, role, is_enabled, created_at, updated_at
FROM users;

CREATE VIEW vw_medicines_with_uuid AS
SELECT uuid, name, category, description, price, quantity_unit, tags, thumbnail_url, created_at, updated_at
FROM medicines;

CREATE VIEW vw_medicines_with_details AS
SELECT 
  m.uuid,
  m.name,
  m.category,
  m.description,
  m.price,
  m.quantity_unit,
  m.tags,
  m.thumbnail_url,
  m.created_at,
  m.updated_at,
  MAX(d.brand_name) AS brand_name,
  MAX(d.generic_name) AS generic_name,
  MAX(d.manufacturer_name) AS manufacturer_name,
  MAX(d.packaging_specification) AS packaging_specification,
  MAX(d.substance_name) AS substance_name,
  MAX(d.composition) AS composition,
  MAX(d.usage_route) AS usage_route,
  MAX(d.dosage_and_administration) AS dosage_and_administration,
  MAX(d.contraindications) AS contraindications,
  MAX(d.adverse_reactions) AS adverse_reactions,
  MAX(d.usage_precautions) AS usage_precautions,
  MAX(d.usage_precautions_pregnant) AS usage_precautions_pregnant,
  MAX(d.overdose_management) AS overdose_management,
  MAX(d.storage_and_preservation) AS storage_and_preservation,
  COALESCE(SUM(mb.quantity), 0) AS total_quantity
FROM medicines m
LEFT JOIN medicine_details d ON m.uuid = d.medicine_uuid
LEFT JOIN medicine_batches mb ON m.uuid = mb.medicine_uuid
GROUP BY 
  m.uuid, m.name, m.category, m.description, m.price, m.quantity_unit, 
  m.tags, m.thumbnail_url, m.created_at, m.updated_at;



CREATE VIEW vw_receipts_with_uuid AS
SELECT 
    r.uuid,
    r.supplier_id,
    r.batch_id,
    r.quantity,
    r.price,
    r.created_at,
    r.updated_at,
    r.created_by,
    m.quantity_unit
FROM 
    receipts r
JOIN 
    medicine_batches mb ON r.batch_id = mb.batch_id
JOIN 
    medicines m ON mb.medicine_uuid = m.uuid;

CREATE VIEW vw_order_summary AS
SELECT 
  o.uuid,
  c.name as customer_name,
  o.status,
  o.created_at,
  o.updated_at,
  SUM(od.quantity * od.price) AS total_amount
FROM orders o
LEFT JOIN order_details od ON o.uuid = od.order_uuid
LEFT JOIN customers c ON o.customer_id = c.customer_id
GROUP BY o.uuid, c.name, o.status, o.created_at, o.updated_at;

CREATE VIEW vw_order_details AS
SELECT
  od.order_detail_id,
  od.order_uuid,
  od.medicine_batch_id,
  od.quantity,
  od.price,
  od.created_at,
  od.updated_at,
  m.quantity_unit,
  mb.expiration_date
FROM order_details od
JOIN orders o ON od.order_uuid = o.uuid
JOIN medicine_batches mb ON od.medicine_batch_id = mb.batch_id
JOIN medicines m ON mb.medicine_uuid = m.uuid;

-- Xem tất cả public view đã định nghĩa
SELECT * FROM "information_schema"."views" 
WHERE "table_schema" = 'public';

-- Tạo function và trigger

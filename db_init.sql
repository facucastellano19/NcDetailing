-- =========================================
-- ROLES
-- =========================================
CREATE TABLE roles (
    id TINYINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL
);

-- Insertar roles iniciales
INSERT INTO roles (name) VALUES ('admin'), ('employee');

-- =========================================
-- USERS
-- =========================================
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role_id TINYINT NOT NULL DEFAULT 2, -- 1 = admin, 2 = employee 
    FOREIGN KEY (role_id) REFERENCES roles(id),

    -- Audit fields
    created_at DATETIME NULL,
    updated_at DATETIME NULL,
    deleted_at DATETIME NULL,
    created_by INT NULL,
    updated_by INT NULL,
    deleted_by INT NULL
);

-- =========================================
-- Clients
-- =========================================
CREATE TABLE clients (
    id INT AUTO_INCREMENT PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE,
    phone VARCHAR(50) UNIQUE,

    -- Audit fields
    created_at DATETIME NULL,
    updated_at DATETIME NULL,
    created_by INT NULL,
    updated_by INT NULL
);


-- =========================================
-- VEHICLES
-- =========================================
CREATE TABLE vehicles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    client_id INT NOT NULL,
    brand VARCHAR(50),
    model VARCHAR(50),
    year INT,
    color VARCHAR(50),
    license_plate VARCHAR(20),

    -- Audit fields
    created_at DATETIME NULL,
    updated_at DATETIME NULL,
    deleted_at DATETIME NULL,
    created_by INT NULL,
    updated_by INT NULL,
    deleted_by INT NULL,

    CONSTRAINT fk_vehicle_client FOREIGN KEY (client_id) REFERENCES clients(id)
);


-- =========================================
-- SERVICE CATEGORIES
-- =========================================
CREATE TABLE service_categories (
    id TINYINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL, -- Example: Treatments, Cleanings, Others
    -- Audit fields
    created_at DATETIME NULL,
    updated_at DATETIME NULL,
    deleted_at DATETIME NULL,
    created_by INT NULL,
    updated_by INT NULL,
    deleted_by INT NULL
);

-- =========================================
-- SERVICES
-- =========================================
CREATE TABLE services (
    id INT AUTO_INCREMENT PRIMARY KEY,
    category_id TINYINT NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    -- Audit fields
    created_at DATETIME NULL,
    updated_at DATETIME NULL,
    deleted_at DATETIME NULL,
    created_by INT NULL,
    updated_by INT NULL,
    deleted_by INT NULL,
    CONSTRAINT fk_service_category FOREIGN KEY (category_id) REFERENCES service_categories(id)
);

-- =========================================
-- PAYMENT STATUS
-- =========================================
CREATE TABLE payment_status (
    id TINYINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE
);

INSERT INTO payment_status (name)
VALUES ('Pendiente'), ('Pagado'), ('Cancelado');

-- =========================================
-- PAYMENT METHODS
-- =========================================
CREATE TABLE payment_methods (
    id TINYINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE
);

INSERT INTO payment_methods (name)
VALUES ('Efectivo'), ('Transferencia');

-- =========================================
-- SERVICE STATUS
-- =========================================
CREATE TABLE service_status (
    id TINYINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE
);

INSERT INTO service_status (name)
VALUES ('Pendiente'), ('En proceso'), ('Completado');

-- =========================================
-- SALE TYPES
-- =========================================
CREATE TABLE sale_types (
    id TINYINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE
);

INSERT INTO sale_types (name)
VALUES ('Servicio'), ('Producto');

-- =========================================
-- PRODUCTS
-- =========================================
CREATE TABLE products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    stock INT NOT NULL DEFAULT 0,

    -- Audit fields
    created_at DATETIME NULL,
    updated_at DATETIME NULL,
    deleted_at DATETIME NULL,
    created_by INT NULL,
    updated_by INT NULL,
    deleted_by INT NULL
);

-- =========================================
-- SALES
-- =========================================
CREATE TABLE sales (
    id INT AUTO_INCREMENT PRIMARY KEY,
    client_id INT NOT NULL,
    vehicle_id INT NULL,
    sale_type_id TINYINT NOT NULL,         -- 1 = Servicio, 2 = Producto
    service_status_id TINYINT NOT NULL DEFAULT 1,  -- Pendiente
    payment_status_id TINYINT NOT NULL DEFAULT 1,  -- Pendiente
    payment_method_id TINYINT NOT NULL,
    total DECIMAL(12,2) NOT NULL DEFAULT 0,
    observations TEXT,

    -- Audit fields
    created_at DATETIME NULL,
    updated_at DATETIME NULL,
    deleted_at DATETIME NULL,
    created_by INT NULL,
    updated_by INT NULL,
    deleted_by INT NULL,

    FOREIGN KEY (client_id) REFERENCES clients(id),
    FOREIGN KEY (vehicle_id) REFERENCES vehicles(id),
    FOREIGN KEY (sale_type_id) REFERENCES sale_types(id),
    FOREIGN KEY (service_status_id) REFERENCES service_status(id),
    FOREIGN KEY (payment_status_id) REFERENCES payment_status(id),
    FOREIGN KEY (payment_method_id) REFERENCES payment_methods(id)
);

-- =========================================
-- SALE_SERVICES
-- =========================================
CREATE TABLE sale_services (
    id INT AUTO_INCREMENT PRIMARY KEY,
    sale_id INT NOT NULL,
    service_id INT NOT NULL,
    price DECIMAL(10,2) NOT NULL,

    -- Audit fields
    created_at DATETIME NULL,
    updated_at DATETIME NULL,
    deleted_at DATETIME NULL,
    created_by INT NULL,
    updated_by INT NULL,
    deleted_by INT NULL,

    FOREIGN KEY (sale_id) REFERENCES sales(id),
    FOREIGN KEY (service_id) REFERENCES services(id)
);

-- =========================================
-- SALE_PRODUCTS
-- =========================================
CREATE TABLE sale_products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    sale_id INT NOT NULL,
    product_id INT NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    price DECIMAL(10,2) NOT NULL,
    subtotal DECIMAL(12,2) GENERATED ALWAYS AS (quantity * price) STORED,

    -- Audit fields
    created_at DATETIME NULL,
    updated_at DATETIME NULL,
    deleted_at DATETIME NULL,
    created_by INT NULL,
    updated_by INT NULL,
    deleted_by INT NULL,

    FOREIGN KEY (sale_id) REFERENCES sales(id),
    FOREIGN KEY (product_id) REFERENCES products(id)
);
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
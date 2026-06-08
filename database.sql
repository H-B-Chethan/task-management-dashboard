-- ============================================================
-- MERN Auth + Dashboard | MySQL Schema
-- 
-- ============================================================

CREATE DATABASE IF NOT EXISTS mern_auth_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE mern_auth_db;

-- ----------------------------------------------------------
-- USERS TABLE
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id               INT           AUTO_INCREMENT PRIMARY KEY,
  name             VARCHAR(100)  NOT NULL,
  email            VARCHAR(100)  NOT NULL UNIQUE,
  phone            VARCHAR(20)   DEFAULT NULL,
  password         VARCHAR(255)  NOT NULL,
  avatar           VARCHAR(500)  DEFAULT NULL,
  is_verified      BOOLEAN       DEFAULT FALSE,
  verify_token     VARCHAR(255)  DEFAULT NULL,
  reset_token      VARCHAR(255)  DEFAULT NULL,
  reset_token_expiry DATETIME    DEFAULT NULL,
  created_at       TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  updated_at       TIMESTAMP     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_email       (email),
  INDEX idx_reset_token (reset_token),
  INDEX idx_verify_token (verify_token)
) ENGINE=InnoDB;

-- ----------------------------------------------------------
-- ITEMS TABLE
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS items (
  id          INT           AUTO_INCREMENT PRIMARY KEY,
  user_id     INT           NOT NULL,
  title       VARCHAR(255)  NOT NULL,
  description TEXT          DEFAULT NULL,
  status      ENUM('active','pending','completed') DEFAULT 'active',
  priority    ENUM('low','medium','high')          DEFAULT 'medium',
  tags        VARCHAR(500)  DEFAULT NULL,
  created_at  TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_status  (status),
  INDEX idx_priority (priority)
) ENGINE=InnoDB;

-- ----------------------------------------------------------
-- SAMPLE SEED DATA (remove before submission if you want clean DB)
-- ----------------------------------------------------------
-- INSERT INTO users (name, email, password, is_verified) VALUES
--   ('Demo User', 'demo@example.com', '$2b$10$HASHED_PASSWORD', TRUE);
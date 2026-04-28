-- PayCompare Database Schema
-- E-Payment Comparison Tool Database

-- Create database
CREATE DATABASE IF NOT EXISTS paycompare_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE paycompare_db;

-- Users table for authentication
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    role ENUM('user', 'admin') DEFAULT 'user',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    last_login TIMESTAMP NULL,
    INDEX idx_email (email),
    INDEX idx_username (username)
);

-- Payment methods table
CREATE TABLE payment_methods (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    transaction_fee DECIMAL(10,2) NOT NULL,
    fee_type ENUM('fixed', 'percentage', 'range', 'hybrid') NOT NULL,
    min_fee DECIMAL(10,2) DEFAULT 0,
    max_fee DECIMAL(10,2) DEFAULT 0,
    percentage_fee DECIMAL(5,2) DEFAULT 0, -- New: percentage charge
    flat_fee DECIMAL(10,2) DEFAULT 0, -- New: flat fee amount
    min_amount_threshold DECIMAL(10,2) DEFAULT 0, -- New: minimum amount for fee calculation
    max_amount_threshold DECIMAL(10,2) DEFAULT 0, -- New: maximum amount for fee calculation
    transaction_speed ENUM('instant', 'seconds', 'minutes', 'hours') NOT NULL,
    speed_value INT DEFAULT 0, -- in seconds for comparison
    processing_time INT DEFAULT 0, -- New: processing time in seconds
    availability_percentage DECIMAL(5,2) NOT NULL,
    security_level ENUM('low', 'medium', 'high', 'very_high') NOT NULL,
    security_score INT DEFAULT 1, -- New: numeric security score (1-100)
    ease_of_use ENUM('poor', 'fair', 'good', 'excellent') NOT NULL,
    ease_score INT DEFAULT 1, -- New: numeric ease of use score (1-100)
    uptime_score DECIMAL(5,2) DEFAULT 0, -- New: uptime score (1-100)
    logo_url VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_name (name),
    INDEX idx_active (is_active),
    INDEX idx_fee_type (fee_type),
    INDEX idx_security_score (security_score)
);

-- Comparisons table to track user comparisons
CREATE TABLE comparisons (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    comparison_data JSON NOT NULL, -- Store comparison results
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_user (user_id),
    INDEX idx_created (created_at)
);

-- Logs table for tracking activities
CREATE TABLE logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NULL,
    action VARCHAR(100) NOT NULL,
    description TEXT,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_user (user_id),
    INDEX idx_action (action),
    INDEX idx_created (created_at)
);

-- Insert sample payment methods with enhanced fee structures
INSERT INTO payment_methods (name, description, transaction_fee, fee_type, min_fee, max_fee, percentage_fee, flat_fee, min_amount_threshold, max_amount_threshold, transaction_speed, speed_value, processing_time, availability_percentage, security_level, security_score, ease_of_use, ease_score, uptime_score, logo_url) VALUES
('UPI', 'Unified Payments Interface - Instant mobile payments with zero charges', 0.00, 'fixed', 0, 0, 0.00, 0.00, 0, 0, 'instant', 1, 1, 99.90, 'high', 85, 'excellent', 95, 99.90, 'images/upi-logo.png'),
('Net Banking', 'Online banking through bank websites and apps with tiered pricing', 7.50, 'hybrid', 5.00, 10.00, 0.00, 5.00, 0, 10000, 'minutes', 180, 120, 98.00, 'medium', 70, 'good', 80, 98.00, 'images/netbanking-logo.png'),
('Credit Card', 'Visa, Mastercard, RuPay credit card payments with percentage fees', 2.00, 'percentage', 1.00, 3.00, 2.00, 0.00, 0, 0, 'instant', 1, 5, 99.00, 'very_high', 95, 'excellent', 95, 99.00, 'images/creditcard-logo.png'),
('Debit Card', 'Visa, Mastercard, RuPay debit card payments with lower fees', 1.50, 'percentage', 0.50, 2.00, 1.50, 0.00, 0, 0, 'instant', 1, 3, 99.00, 'high', 85, 'excellent', 95, 99.00, 'images/debitcard-logo.png'),
('PayTM Wallet', 'Digital wallet for quick payments with zero charges up to limits', 0.00, 'hybrid', 0, 0, 0.00, 0.00, 0, 5000, 'instant', 1, 2, 99.50, 'medium', 75, 'excellent', 90, 99.50, 'images/paytm-logo.png'),
('PhonePe', 'UPI-based payment app with excellent reliability', 0.00, 'fixed', 0, 0, 0.00, 0.00, 0, 0, 'instant', 1, 1, 99.80, 'high', 85, 'excellent', 95, 99.80, 'images/phonepe-logo.png'),
('Google Pay', 'Google\'s UPI payment solution with high security', 0.00, 'fixed', 0, 0, 0.00, 0.00, 0, 0, 'instant', 1, 1, 99.90, 'very_high', 90, 'excellent', 95, 99.90, 'images/gpay-logo.png'),
('Amazon Pay', 'Amazon\'s digital payment solution with cashback offers', 0.00, 'hybrid', 0, 0, 1.50, 0.00, 1000, 0, 'instant', 1, 3, 99.70, 'high', 80, 'excellent', 90, 99.70, 'images/amazonpay-logo.png');

-- Insert admin user (password: admin123 - will be hashed in PHP)
INSERT INTO users (username, email, password_hash, full_name, role) VALUES
('admin', 'admin@paycompare.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Administrator', 'admin');

-- Insert sample regular user (password: user123 - will be hashed in PHP)
INSERT INTO users (username, email, password_hash, full_name, role) VALUES
('testuser', 'user@example.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Test User', 'user');

-- Create stored procedure for getting payment method recommendations
DELIMITER //
CREATE PROCEDURE GetRecommendedPaymentMethod(
    IN p_min_fee DECIMAL(10,2),
    IN p_max_speed INT,
    IN p_min_security ENUM('low', 'medium', 'high', 'very_high')
)
BEGIN
    SELECT 
        pm.*,
        CASE 
            WHEN pm.transaction_fee <= p_min_fee AND pm.speed_value <= p_max_speed AND pm.security_level >= p_min_security THEN 'highly_recommended'
            WHEN pm.transaction_fee <= p_min_fee * 1.5 AND pm.speed_value <= p_max_speed * 1.5 AND pm.security_level >= p_min_security THEN 'recommended'
            ELSE 'not_recommended'
        END as recommendation_score
    FROM payment_methods pm
    WHERE pm.is_active = TRUE
    ORDER BY 
        CASE 
            WHEN pm.transaction_fee <= p_min_fee AND pm.speed_value <= p_max_speed AND pm.security_level >= p_min_security THEN 1
            WHEN pm.transaction_fee <= p_min_fee * 1.5 AND pm.speed_value <= p_max_speed * 1.5 AND pm.security_level >= p_min_security THEN 2
            ELSE 3
        END,
        pm.transaction_fee ASC,
        pm.speed_value ASC,
        pm.availability_percentage DESC;
END //
DELIMITER ;

-- Create view for payment method statistics
CREATE VIEW payment_method_stats AS
SELECT 
    pm.name,
    pm.transaction_fee,
    pm.speed_value,
    pm.availability_percentage,
    CASE pm.security_level
        WHEN 'low' THEN 1
        WHEN 'medium' THEN 2
        WHEN 'high' THEN 3
        WHEN 'very_high' THEN 4
    END as security_score,
    CASE pm.ease_of_use
        WHEN 'poor' THEN 1
        WHEN 'fair' THEN 2
        WHEN 'good' THEN 3
        WHEN 'excellent' THEN 4
    END as ease_score,
    (CASE pm.security_level
        WHEN 'low' THEN 1
        WHEN 'medium' THEN 2
        WHEN 'high' THEN 3
        WHEN 'very_high' THEN 4
    END + 
    CASE pm.ease_of_use
        WHEN 'poor' THEN 1
        WHEN 'fair' THEN 2
        WHEN 'good' THEN 3
        WHEN 'excellent' THEN 4
    END + 
    (100 - pm.transaction_fee) / 25 + 
    (100 - pm.speed_value) / 60 + 
    pm.availability_percentage) / 5 as overall_score
FROM payment_methods pm
WHERE pm.is_active = TRUE;

-- Create trigger for logging payment method changes
DELIMITER //
CREATE TRIGGER payment_method_after_update 
AFTER UPDATE ON payment_methods
FOR EACH ROW
BEGIN
    IF OLD.name != NEW.name OR OLD.transaction_fee != NEW.transaction_fee OR 
       OLD.transaction_speed != NEW.transaction_speed OR OLD.availability_percentage != NEW.availability_percentage THEN
        INSERT INTO logs (action, description)
        VALUES ('payment_method_updated', 
                CONCAT('Payment method ', NEW.name, ' was updated'));
    END IF;
END //
DELIMITER ;

-- Create indexes for better performance
CREATE INDEX idx_payment_methods_composite ON payment_methods(is_active, transaction_fee, speed_value);
CREATE INDEX idx_logs_composite ON logs(user_id, created_at, action);

-- Set up foreign key constraints
ALTER TABLE comparisons ADD CONSTRAINT fk_comparisons_user 
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE logs ADD CONSTRAINT fk_logs_user 
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;

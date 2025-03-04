CREATE DATABASE IF NOT EXISTS vanilla_wallet;
USE vanilla_wallet;

-- Users table
CREATE TABLE IF NOT EXISTS users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    phone VARCHAR(20) UNIQUE,
    password VARCHAR(255) NOT NULL,
    profile_image VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    is_verified BOOLEAN DEFAULT FALSE,
    verification_token VARCHAR(100),
    reset_token VARCHAR(100),
    reset_token_expiry DATETIME,
    last_login DATETIME,
    status ENUM('active', 'suspended', 'inactive') DEFAULT 'inactive'
);

-- Wallets table
CREATE TABLE IF NOT EXISTS wallets (
    wallet_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    balance DECIMAL(15, 2) DEFAULT 0.00,
    currency VARCHAR(3) DEFAULT 'USD',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- Transactions table
CREATE TABLE IF NOT EXISTS transactions (
    transaction_id VARCHAR(36) PRIMARY KEY,
    sender_wallet_id INT,
    receiver_wallet_id INT,
    amount DECIMAL(15, 2) NOT NULL,
    fee DECIMAL(15, 2) DEFAULT 0.00,
    transaction_type ENUM('deposit', 'withdrawal', 'transfer', 'payment') NOT NULL,
    status ENUM('pending', 'completed', 'failed', 'cancelled') DEFAULT 'pending',
    description TEXT,
    reference_code VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (sender_wallet_id) REFERENCES wallets(wallet_id),
    FOREIGN KEY (receiver_wallet_id) REFERENCES wallets(wallet_id)
);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
    notification_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    title VARCHAR(100) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- Verification documents table
CREATE TABLE IF NOT EXISTS verification_documents (
    document_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    document_type ENUM('id_card', 'passport', 'driving_license', 'utility_bill') NOT NULL,
    document_path VARCHAR(255) NOT NULL,
    status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    verified_at DATETIME,
    verified_by INT,
    rejection_reason TEXT,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- Admin users table
CREATE TABLE IF NOT EXISTS admin_users (
    admin_id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    role ENUM('super_admin', 'admin', 'support') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login DATETIME,
    status ENUM('active', 'inactive') DEFAULT 'active'
);

-- System logs table
CREATE TABLE IF NOT EXISTS system_logs (
    log_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    admin_id INT,
    ip_address VARCHAR(45),
    user_agent TEXT,
    action VARCHAR(100) NOT NULL,
    details TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE SET NULL,
    FOREIGN KEY (admin_id) REFERENCES admin_users(admin_id) ON DELETE SET NULL
);

-- Help center articles table
CREATE TABLE IF NOT EXISTS help_articles (
    article_id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    category ENUM('general', 'account', 'transactions', 'security') NOT NULL,
    created_by INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES admin_users(admin_id)
);

-- Support tickets table
CREATE TABLE IF NOT EXISTS support_tickets (
    ticket_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    subject VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    status ENUM('open', 'in_progress', 'resolved', 'closed') DEFAULT 'open',
    priority ENUM('low', 'medium', 'high') DEFAULT 'medium',
    assigned_to INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id),
    FOREIGN KEY (assigned_to) REFERENCES admin_users(admin_id) ON DELETE SET NULL
);

-- Ticket responses table
CREATE TABLE IF NOT EXISTS ticket_responses (
    response_id INT AUTO_INCREMENT PRIMARY KEY,
    ticket_id INT NOT NULL,
    responder_type ENUM('user', 'admin') NOT NULL,
    responder_id INT NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (ticket_id) REFERENCES support_tickets(ticket_id) ON DELETE CASCADE
);

-- Create test users with verified accounts
-- Insert admin user (password is 'admin123')
INSERT INTO admin_users (username, password, email, role, status) VALUES
('admin', '$2y$10$IxfBZI/1JCCBrSO2ZKRQOehM0ELr8wqUO3ZMgH6mQxRfkjYwRWR6O', 'admin@example.com', 'super_admin', 'active');

-- Insert regular users (password for both users is 'password123')
INSERT INTO users (first_name, last_name, email, password, is_verified, status) VALUES
('John', 'Doe', 'john@example.com', '$2y$10$PYDzBSVwSfQqcPbl0KF2gOfvYIaUPGvGtRFTlN7BYhNPLxPwRXq.O', 1, 'active'),
('Jane', 'Smith', 'jane@example.com', '$2y$10$PYDzBSVwSfQqcPbl0KF2gOfvYIaUPGvGtRFTlN7BYhNPLxPwRXq.O', 1, 'active');

-- Create wallets for users
INSERT INTO wallets (user_id, balance, currency) VALUES
(1, 1000.00, 'USD'),
(2, 2000.00, 'USD');

-- Add some initial transactions
INSERT INTO transactions (transaction_id, receiver_wallet_id, amount, transaction_type, status, description, reference_code, created_at) VALUES
('e8b5d51c-6a82-4d65-8fd1-c69c6adcb7a6', 1, 500.00, 'deposit', 'completed', 'Initial deposit', 'DEP20230101ABC123', '2023-01-01 10:00:00'),
('f9c6e62d-7b93-5e76-9ge2-d70d7bce8b7', 2, 1000.00, 'deposit', 'completed', 'Initial deposit', 'DEP20230101DEF456', '2023-01-01 11:00:00');

-- Add a transfer between users
INSERT INTO transactions (transaction_id, sender_wallet_id, receiver_wallet_id, amount, transaction_type, status, description, reference_code, created_at) VALUES
('a7d4c41b-5a72-3c54-7ed1-b58b5adc975a', 2, 1, 200.00, 'transfer', 'completed', 'Payment for services', 'TRF20230215GHI789', '2023-02-15 14:30:00');

-- Add some notifications for users
INSERT INTO notifications (user_id, title, message, is_read) VALUES
(1, 'Welcome to Vanilla Wallet', 'Thank you for joining Vanilla Wallet. Your account is now active.', 1),
(1, 'Deposit Successful', 'Your deposit of $500.00 has been processed successfully.', 0),
(1, 'Transfer Received', 'You have received a transfer of $200.00 from Jane Smith.', 0),
(2, 'Welcome to Vanilla Wallet', 'Thank you for joining Vanilla Wallet. Your account is now active.', 1),
(2, 'Deposit Successful', 'Your deposit of $1000.00 has been processed successfully.', 0),
(2, 'Transfer Sent', 'Your transfer of $200.00 to John Doe has been processed successfully.', 0);

-- Add some help articles
INSERT INTO help_articles (title, content, category, created_by) VALUES
('How to Deposit Funds', 'To deposit funds to your wallet, follow these steps:\n\n1. Log in to your account\n2. Click on the "Deposit" button\n3. Enter the amount you want to deposit\n4. Select your payment method\n5. Follow the instructions to complete the payment', 'transactions', 1),
('How to Withdraw Funds', 'To withdraw funds from your wallet, follow these steps:\n\n1. Log in to your account\n2. Click on the "Withdraw" button\n3. Enter the amount you want to withdraw\n4. Select your withdrawal method\n5. Enter your account details\n6. Confirm the withdrawal', 'transactions', 1),
('How to Transfer Funds', 'To transfer funds to another user, follow these steps:\n\n1. Log in to your account\n2. Click on the "Transfer" button\n3. Enter the recipient\'s email address\n4. Enter the amount you want to transfer\n5. Add a description (optional)\n6. Confirm the transfer', 'transactions', 1),
('Account Security Tips', 'To keep your account secure, we recommend the following:\n\n1. Use a strong, unique password\n2. Enable two-factor authentication\n3. Never share your login details with anyone\n4. Be cautious of phishing attempts\n5. Regularly check your transaction history\n6. Log out when using public computers', 'security', 1);
-- User Settings table
CREATE TABLE IF NOT EXISTS user_settings (
    setting_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    language VARCHAR(10) DEFAULT 'en',
    timezone VARCHAR(50) DEFAULT 'UTC',
    notification_preferences JSON,
    privacy_settings JSON,
    theme_preference ENUM('light', 'dark') DEFAULT 'light',
    two_factor_enabled BOOLEAN DEFAULT FALSE,
    two_factor_secret VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- Payment Methods table
CREATE TABLE IF NOT EXISTS payment_methods (
    payment_method_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    type ENUM('card', 'bank_account') NOT NULL,
    name VARCHAR(100) NOT NULL,
    is_default BOOLEAN DEFAULT FALSE,
    details JSON NOT NULL,
    status ENUM('active', 'inactive', 'expired') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    last_used_at DATETIME,
    expires_at DATE,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- User Sessions table
CREATE TABLE IF NOT EXISTS user_sessions (
    session_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    device_type VARCHAR(50),
    device_name VARCHAR(100),
    ip_address VARCHAR(45),
    user_agent TEXT,
    location VARCHAR(100),
    is_current BOOLEAN DEFAULT FALSE,
    last_active TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at DATETIME,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- Account Deletion Logs table
CREATE TABLE IF NOT EXISTS account_deletion_logs (
    deletion_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    email VARCHAR(100),
    reason TEXT,
    additional_feedback TEXT,
    deleted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_by INT,
    FOREIGN KEY (deleted_by) REFERENCES admin_users(admin_id) ON DELETE SET NULL
);

-- Add some modifications to existing users table
ALTER TABLE users
ADD COLUMN preferences JSON DEFAULT NULL,
ADD COLUMN last_password_change DATETIME,
ADD COLUMN failed_login_attempts INT DEFAULT 0,
ADD COLUMN account_locked_until DATETIME,
ADD COLUMN required_actions JSON DEFAULT NULL;

-- Insert default settings for existing users
INSERT INTO user_settings (user_id, notification_preferences, privacy_settings) 
SELECT 
    user_id,
    JSON_OBJECT(
        'email', JSON_OBJECT(
            'transactions', true,
            'security', true,
            'marketing', false
        ),
        'push', JSON_OBJECT(
            'transactions', true,
            'security', true
        )
    ) as notification_preferences,
    JSON_OBJECT(
        'profile_visible', true,
        'activity_visible', false,
        'show_balance', true
    ) as privacy_settings
FROM users;

-- Add some sample payment methods
INSERT INTO payment_methods (user_id, type, name, is_default, details) VALUES
(1, 'card', 'Personal Visa', true, JSON_OBJECT(
    'last4', '4242',
    'brand', 'visa',
    'exp_month', 12,
    'exp_year', 2024
)),
(1, 'bank_account', 'Chase Checking', false, JSON_OBJECT(
    'bank_name', 'Chase',
    'account_type', 'checking',
    'last4', '9876'
)),
(2, 'card', 'Business Mastercard', true, JSON_OBJECT(
    'last4', '5555',
    'brand', 'mastercard',
    'exp_month', 10,
    'exp_year', 2025
));

-- Add triggers for payment methods
DELIMITER //

CREATE TRIGGER before_payment_method_insert
BEFORE INSERT ON payment_methods
FOR EACH ROW
BEGIN
    IF NEW.is_default = 1 THEN
        UPDATE payment_methods 
        SET is_default = 0 
        WHERE user_id = NEW.user_id 
        AND type = NEW.type;
    END IF;
END//

CREATE TRIGGER before_payment_method_update
BEFORE UPDATE ON payment_methods
FOR EACH ROW
BEGIN
    IF NEW.is_default = 1 AND OLD.is_default = 0 THEN
        UPDATE payment_methods 
        SET is_default = 0 
        WHERE user_id = NEW.user_id 
        AND type = NEW.type 
        AND payment_method_id != NEW.payment_method_id;
    END IF;
END//

DELIMITER ;

-- Add indexes for better performance
CREATE INDEX idx_user_settings_user ON user_settings(user_id);
CREATE INDEX idx_payment_methods_user ON payment_methods(user_id);
CREATE INDEX idx_user_sessions_user ON user_sessions(user_id);
CREATE INDEX idx_sessions_last_active ON user_sessions(last_active);
CREATE INDEX idx_payment_methods_status ON payment_methods(status);


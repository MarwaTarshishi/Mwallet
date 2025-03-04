<?php
class User {
    // Database connection and table name
    private $conn;
    private $table_name = "users";
    
    // Object properties
    public $user_id;
    public $first_name;
    public $last_name;
    public $email;
    public $phone;
    public $password;
    public $profile_image;
    public $created_at;
    public $updated_at;
    public $is_verified;
    public $verification_token;
    public $reset_token;
    public $reset_token_expiry;
    public $last_login;
    public $status;
    
    // Constructor
    public function __construct($db) {
        $this->conn = $db;
    }
    
    // Login
    public function login() {
        // Query to check if the user exists
        $query = "SELECT u.user_id, u.first_name, u.last_name, u.email, u.password, u.is_verified, u.status 
                  FROM " . $this->table_name . " u 
                  WHERE u.email = ?";
        
        // Prepare statement
        $stmt = $this->conn->prepare($query);
        
        // Sanitize and bind parameters
        $this->email = htmlspecialchars(strip_tags($this->email));
        $stmt->bindParam(1, $this->email);
        
        // Execute query
        $stmt->execute();
        
        // Check if user exists
        if ($stmt->rowCount() > 0) {
            $row = $stmt->fetch(PDO::FETCH_ASSOC);
            
            // Verify password
            if (password_verify($this->password, $row['password'])) {
                // Check if user is verified and active
                if ($row['is_verified'] == 1 && $row['status'] == 'active') {
                    // Set user properties
                    $this->user_id = $row['user_id'];
                    $this->first_name = $row['first_name'];
                    $this->last_name = $row['last_name'];
                    
                    return true;
                } else {
                    return "inactive";
                }
            }
        }
        
        return false;
    }
    
    // Register
    public function register() {
        // Query to insert a new user
        $query = "INSERT INTO " . $this->table_name . "
                 (first_name, last_name, email, phone, password, verification_token, status)
                 VALUES (?, ?, ?, ?, ?, ?, ?)";
        
        // Prepare statement
        $stmt = $this->conn->prepare($query);
        
        // Sanitize and hash password
        $this->first_name = htmlspecialchars(strip_tags($this->first_name));
        $this->last_name = htmlspecialchars(strip_tags($this->last_name));
        $this->email = htmlspecialchars(strip_tags($this->email));
        $this->phone = $this->phone ? htmlspecialchars(strip_tags($this->phone)) : null;
        $password_hash = password_hash($this->password, PASSWORD_BCRYPT);
        
        // Generate verification token
        $this->verification_token = bin2hex(random_bytes(32));
        $status = "inactive";
        
        // Bind parameters
        $stmt->bindParam(1, $this->first_name);
        $stmt->bindParam(2, $this->last_name);
        $stmt->bindParam(3, $this->email);
        $stmt->bindParam(4, $this->phone);
        $stmt->bindParam(5, $password_hash);
        $stmt->bindParam(6, $this->verification_token);
        $stmt->bindParam(7, $status);
        
        // Execute query
        if ($stmt->execute()) {
            // Get the newly created user ID
            $this->user_id = $this->conn->lastInsertId();
            
            // Create a wallet for the user
            $wallet = new Wallet($this->conn);
            $wallet->create($this->user_id);
            
            return true;
        }
        
        return false;
    }
    
    // Check if email exists
    public function emailExists() {
        // Query to check if email exists
        $query = "SELECT user_id FROM " . $this->table_name . " WHERE email = ?";
        
        // Prepare statement
        $stmt = $this->conn->prepare($query);
        
        // Sanitize and bind parameter
        $this->email = htmlspecialchars(strip_tags($this->email));
        $stmt->bindParam(1, $this->email);
        
        // Execute query
        $stmt->execute();
        
        // Return true if email exists
        return $stmt->rowCount() > 0;
    }
    
    // Check if phone exists
    public function phoneExists() {
        // Query to check if phone exists
        $query = "SELECT user_id FROM " . $this->table_name . " WHERE phone = ?";
        
        // Prepare statement
        $stmt = $this->conn->prepare($query);
        
        // Sanitize and bind parameter
        $this->phone = htmlspecialchars(strip_tags($this->phone));
        $stmt->bindParam(1, $this->phone);
        
        // Execute query
        $stmt->execute();
        
        // Return true if phone exists
        return $stmt->rowCount() > 0;
    }
    
    // Get user details
    public function getUserDetails() {
        // Query to get user details along with wallet
        $query = "SELECT u.user_id, u.first_name, u.last_name, u.email, u.phone, u.profile_image, u.created_at, 
                         u.is_verified, u.status, w.wallet_id, w.balance, w.currency
                  FROM " . $this->table_name . " u
                  LEFT JOIN wallets w ON u.user_id = w.user_id
                  WHERE u.user_id = ?";
        
        // Prepare statement
        $stmt = $this->conn->prepare($query);
        
        // Bind parameter
        $stmt->bindParam(1, $this->user_id);
        
        // Execute query
        $stmt->execute();
        
        // Get user details
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }
    
    // Update last login time
    public function updateLastLogin() {
        // Query to update last login time
        $query = "UPDATE " . $this->table_name . " SET last_login = NOW() WHERE user_id = ?";
        
        // Prepare statement
        $stmt = $this->conn->prepare($query);
        
        // Bind parameter
        $stmt->bindParam(1, $this->user_id);
        
        // Execute query
        return $stmt->execute();
    }
    
    // Get user ID by email
    public function getUserIdByEmail() {
        // Query to get user ID by email
        $query = "SELECT user_id FROM " . $this->table_name . " WHERE email = ?";
        
        // Prepare statement
        $stmt = $this->conn->prepare($query);
        
        // Sanitize and bind parameter
        $this->email = htmlspecialchars(strip_tags($this->email));
        $stmt->bindParam(1, $this->email);
        
        // Execute query
        $stmt->execute();
        
        // Get user ID
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        return $row['user_id'];
    }
    
    // Verify user
    public function verifyUser($token) {
        // Query to verify user
        $query = "UPDATE " . $this->table_name . " 
                  SET is_verified = 1, status = 'active', verification_token = NULL 
                  WHERE verification_token = ?";
        
        // Prepare statement
        $stmt = $this->conn->prepare($query);
        
        // Sanitize and bind parameter
        $token = htmlspecialchars(strip_tags($token));
        $stmt->bindParam(1, $token);
        
        // Execute query
        return $stmt->execute() && $stmt->rowCount() > 0;
    }
    
    // Reset password
    public function resetPassword($token, $new_password) {
        // Query to check if token is valid and not expired
        $query = "SELECT user_id FROM " . $this->table_name . " 
                  WHERE reset_token = ? AND reset_token_expiry > NOW()";
        
        // Prepare statement
        $stmt = $this->conn->prepare($query);
        
        // Sanitize and bind parameter
        $token = htmlspecialchars(strip_tags($token));
        $stmt->bindParam(1, $token);
        
        // Execute query
        $stmt->execute();
        
        // Check if token is valid
        if ($stmt->rowCount() > 0) {
            $row = $stmt->fetch(PDO::FETCH_ASSOC);
            $user_id = $row['user_id'];
            
            // Hash new password
            $password_hash = password_hash($new_password, PASSWORD_BCRYPT);
            
            // Query to update password
            $query = "UPDATE " . $this->table_name . " 
                      SET password = ?, reset_token = NULL, reset_token_expiry = NULL 
                      WHERE user_id = ?";
            
            // Prepare statement
            $stmt = $this->conn->prepare($query);
            
            // Bind parameters
            $stmt->bindParam(1, $password_hash);
            $stmt->bindParam(2, $user_id);
            
            // Execute query
            return $stmt->execute();
        }
        
        return false;
    }
    
    // Request password reset
    public function requestPasswordReset() {
        // Generate reset token
        $reset_token = bin2hex(random_bytes(32));
        
        // Set token expiry time (24 hours from now)
        $expiry = date('Y-m-d H:i:s', strtotime('+24 hours'));
        
        // Query to update reset token and expiry
        $query = "UPDATE " . $this->table_name . " 
                  SET reset_token = ?, reset_token_expiry = ? 
                  WHERE email = ?";
        
        // Prepare statement
        $stmt = $this->conn->prepare($query);
        
        // Sanitize and bind parameters
        $this->email = htmlspecialchars(strip_tags($this->email));
        
        $stmt->bindParam(1, $reset_token);
        $stmt->bindParam(2, $expiry);
        $stmt->bindParam(3, $this->email);
        
        // Execute query
        if ($stmt->execute() && $stmt->rowCount() > 0) {
            return $reset_token;
        }
        
        return false;
    }
}
?>

<?php
class Wallet {
    // Database connection and table name
    private $conn;
    private $table_name = "wallets";
    
    // Object properties
    public $wallet_id;
    public $user_id;
    public $balance;
    public $currency;
    public $created_at;
    public $updated_at;
    
    // Constructor
    public function __construct($db) {
        $this->conn = $db;
    }
    
    // Get wallet balance
    public function getBalance($wallet_id) {
        // Query to get balance
        $query = "SELECT balance FROM " . $this->table_name . " WHERE wallet_id = ?";
        
        // Prepare statement
        $stmt = $this->conn->prepare($query);
        
        // Bind parameter
        $stmt->bindParam(1, $wallet_id);
        
        // Execute query
        $stmt->execute();
        
        // Check if wallet exists
        if ($stmt->rowCount() > 0) {
            $row = $stmt->fetch(PDO::FETCH_ASSOC);
            return $row['balance'];
        }
        
        return false;
    }
    
    // Update wallet balance
    public function updateBalance($wallet_id, $amount, $operation = 'add') {
        // Query to update balance
        if ($operation === 'add') {
            $query = "UPDATE " . $this->table_name . " SET balance = balance + :amount, updated_at = NOW() WHERE wallet_id = :wallet_id";
        } else {
            $query = "UPDATE " . $this->table_name . " SET balance = balance - :amount, updated_at = NOW() WHERE wallet_id = :wallet_id";
        }
        
        // Prepare statement
        $stmt = $this->conn->prepare($query);
        
        // Sanitize and bind parameters
        $wallet_id = htmlspecialchars(strip_tags($wallet_id));
        $amount = htmlspecialchars(strip_tags($amount));
        
        $stmt->bindParam(':wallet_id', $wallet_id);
        $stmt->bindParam(':amount', $amount);
        
        // Execute query
        if ($stmt->execute()) {
            return true;
        }
        
        return false;
    }
    
    // Check if user has sufficient balance
    public function hasSufficientBalance($wallet_id, $amount) {
        // Query to check balance
        $query = "SELECT balance FROM " . $this->table_name . " WHERE wallet_id = ?";
        
        // Prepare statement
        $stmt = $this->conn->prepare($query);
        
        // Bind parameter
        $stmt->bindParam(1, $wallet_id);
        
        // Execute query
        $stmt->execute();
        
        // Check if wallet exists
        if ($stmt->rowCount() > 0) {
            $row = $stmt->fetch(PDO::FETCH_ASSOC);
            return $row['balance'] >= $amount;
        }
        
        return false;
    }
    
    // Create a new wallet
    public function create($user_id, $currency = 'USD') {
        // Query to insert a new wallet
        $query = "INSERT INTO " . $this->table_name . " (user_id, currency) VALUES (?, ?)";
        
        // Prepare statement
        $stmt = $this->conn->prepare($query);
        
        // Sanitize and bind parameters
        $user_id = htmlspecialchars(strip_tags($user_id));
        $currency = htmlspecialchars(strip_tags($currency));
        
        $stmt->bindParam(1, $user_id);
        $stmt->bindParam(2, $currency);
        
        // Execute query
        if ($stmt->execute()) {
            // Get the newly created wallet ID
            $this->wallet_id = $this->conn->lastInsertId();
            return true;
        }
        
        return false;
    }
    
    // Get wallet by user ID
    public function getWalletByUserId($user_id) {
        // Query to get wallet
        $query = "SELECT * FROM " . $this->table_name . " WHERE user_id = ? LIMIT 1";
        
        // Prepare statement
        $stmt = $this->conn->prepare($query);
        
        // Bind parameter
        $stmt->bindParam(1, $user_id);
        
        // Execute query
        $stmt->execute();
        
        // Check if wallet exists
        if ($stmt->rowCount() > 0) {
            $row = $stmt->fetch(PDO::FETCH_ASSOC);
            
            // Set properties
            $this->wallet_id = $row['wallet_id'];
            $this->user_id = $row['user_id'];
            $this->balance = $row['balance'];
            $this->currency = $row['currency'];
            $this->created_at = $row['created_at'];
            $this->updated_at = $row['updated_at'];
            
            return true;
        }
        
        return false;
    }
    
    // Validate if a wallet belongs to a user
    public function validateUserWallet($user_id, $wallet_id) {
        // Query to validate wallet ownership
        $query = "SELECT * FROM " . $this->table_name . " WHERE user_id = ? AND wallet_id = ?";
        
        // Prepare statement
        $stmt = $this->conn->prepare($query);
        
        // Bind parameters
        $stmt->bindParam(1, $user_id);
        $stmt->bindParam(2, $wallet_id);
        
        // Execute query
        $stmt->execute();
        
        // Check if wallet belongs to user
        return $stmt->rowCount() > 0;
    }
    
    // Get user ID by wallet ID
    public function getUserIdByWalletId($wallet_id) {
        // Query to get user ID
        $query = "SELECT user_id FROM " . $this->table_name . " WHERE wallet_id = ?";
        
        // Prepare statement
        $stmt = $this->conn->prepare($query);
        
        // Bind parameter
        $stmt->bindParam(1, $wallet_id);
        
        // Execute query
        $stmt->execute();
        
        // Check if wallet exists
        if ($stmt->rowCount() > 0) {
            $row = $stmt->fetch(PDO::FETCH_ASSOC);
            return $row['user_id'];
        }
        
        return false;
    }
}
?>

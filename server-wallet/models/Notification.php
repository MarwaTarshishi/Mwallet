<?php
class Notification {
    private $conn;
    private $table_name = "notifications";
    public $notification_id;
    public $user_id;
    public $title;
    public $message;
    public $is_read;
    public $created_at;
    
    // Constructor
    public function __construct($db) {
        $this->conn = $db;
    }
    public function create() {
        // Query to insert a new notification
        $query = "INSERT INTO " . $this->table_name . " (user_id, title, message) VALUES (?, ?, ?)";
        
        // Prepare statement
        $stmt = $this->conn->prepare($query);
        
        // Sanitize and bind parameters
        $this->user_id = htmlspecialchars(strip_tags($this->user_id));
        $this->title = htmlspecialchars(strip_tags($this->title));
        $this->message = htmlspecialchars(strip_tags($this->message));
        
        $stmt->bindParam(1, $this->user_id);
        $stmt->bindParam(2, $this->title);
        $stmt->bindParam(3, $this->message);
        
        // Execute query
        if ($stmt->execute()) {
            // Get the newly created notification ID
            $this->notification_id = $this->conn->lastInsertId();
            return true;
        }
        
        return false;
    }
    public function getUserNotifications($user_id, $limit = 10, $offset = 0) {
        // Query to get user notifications
        $query = "SELECT * FROM " . $this->table_name . " 
                  WHERE user_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?";
        
        // Prepare statement
        $stmt = $this->conn->prepare($query);
        
        // Bind parameters
        $stmt->bindParam(1, $user_id);
        $stmt->bindParam(2, $limit, PDO::PARAM_INT);
        $stmt->bindParam(3, $offset, PDO::PARAM_INT);
        
        // Execute query
        $stmt->execute();
        
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
    
    // Mark notification as read
    public function markAsRead($notification_id) {
        // Query to mark notification as read
        $query = "UPDATE " . $this->table_name . " SET is_read = 1 WHERE notification_id = ?";
        
        // Prepare statement
        $stmt = $this->conn->prepare($query);
        
        // Bind parameter
        $stmt->bindParam(1, $notification_id);
        
        // Execute query
        return $stmt->execute();
    }
    
    // Get unread notification count
    public function getUnreadCount($user_id) {
        // Query to count unread notifications
        $query = "SELECT COUNT(*) as count FROM " . $this->table_name . " 
                  WHERE user_id = ? AND is_read = 0";
        
        // Prepare statement
        $stmt = $this->conn->prepare($query);
        
        // Bind parameter
        $stmt->bindParam(1, $user_id);
        
        // Execute query
        $stmt->execute();
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        
        return $row['count'];
    }
    
    // Mark all notifications as read
    public function markAllAsRead($user_id) {
        // Query to mark all user notifications as read
        $query = "UPDATE " . $this->table_name . " SET is_read = 1 WHERE user_id = ? AND is_read = 0";
        
        // Prepare statement
        $stmt = $this->conn->prepare($query);
        
        // Bind parameter
        $stmt->bindParam(1, $user_id);
        
        // Execute query
        return $stmt->execute();
    }
}
?>

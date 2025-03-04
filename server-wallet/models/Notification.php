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

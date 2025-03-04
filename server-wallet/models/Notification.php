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
    

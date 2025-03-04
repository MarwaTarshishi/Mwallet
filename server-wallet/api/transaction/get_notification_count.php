<?php
// Headers
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");


include_once '../../config/database.php';
include_once '../../models/Notification.php';
include_once '../../utils/jwt_auth.php';

$database = new Database();
$db = $database->getConnection();

$notification = new Notification($db);
$jwt = new JwtAuth();

$headers = getallheaders();
$token = null;

if (isset($headers['Authorization'])) {
    $authHeader = $headers['Authorization'];
    $arr = explode(" ", $authHeader);
    $token = $arr[1];
} elseif (isset($headers['authorization'])) {
    $authHeader = $headers['authorization'];
    $arr = explode(" ", $authHeader);
    $token = $arr[1];
}


if (!$token || !$decoded = $jwt->validateToken($token)) {
    // Set response code - 401 Unauthorized
    http_response_code(401);
    
    echo json_encode(array(
        "success" => false,
        "message" => "Unauthorized access. Please login again."
    ));
    exit;
}

// Get unread notification count
$count = $notification->getUnreadCount($decoded->user_id);

http_response_code(200);

// Return count
echo json_encode(array(
    "success" => true,
    "count" => $count
));
?>

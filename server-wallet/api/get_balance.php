<?php
// Headers
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");
include_once '../../config/database.php';
include_once '../../models/Wallet.php';
include_once '../../utils/jwt_auth.php';
$database = new Database();
$db = $database->getConnection();
$wallet = new Wallet($db);
$jwt = new JwtAuth();
$data = json_decode(file_get_contents("php://input"));
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

// Verify the token
if (!$token || !$decoded = $jwt->validateToken($token)) {
    // Set response code - 401 Unauthorized
    http_response_code(401);
    
    // Tell the user
    echo json_encode(array(
        "success" => false,
        "message" => "Unauthorized access. Please login again."
    ));
    exit;
}

// Validate data
if (!empty($data->wallet_id)) {
    // Validate if the wallet belongs to the user
    if (!$wallet->validateUserWallet($decoded->user_id, $data->wallet_id)) {
        http_response_code(403);
        echo json_encode(array(
            "success" => false,
            "message" => "You do not have permission to access this wallet."
        ));
        exit;
    }
    // Get wallet balance
    $balance = $wallet->getBalance($data->wallet_id);
    
    if ($balance !== false) {
        // Set response code - 200 OK
        http_response_code(200);
        
        // Return the balance
        echo json_encode(array(
            "success" => true,
            "balance" => $balance
        ));
    } else {
        // Set response code - 404 Not Found
        http_response_code(404);
        
        // Tell the user
        echo json_encode(array(
            "success" => false,
            "message" => "Wallet not found."
        ));
    }
} else {
    // Set response code - 400 bad request
    http_response_code(400);
    
    // Tell the user
    echo json_encode(array(
        "success" => false,
        "message" => "Unable to get balance. Wallet ID is required."
    ));
}
?>

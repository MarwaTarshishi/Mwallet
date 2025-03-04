<?php
// Headers
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

// Include database and object files
include_once '../../config/database.php';
include_once '../../models/Transaction.php';
include_once '../../utils/jwt_auth.php';

// Get database connection
$database = new Database();
$db = $database->getConnection();

// Prepare objects
$transaction = new Transaction($db);
$jwt = new JwtAuth();

// Get posted data
$data = json_decode(file_get_contents("php://input"));

// Get JWT token from the header
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

// Get pagination parameters
$limit = isset($data->limit) ? $data->limit : 10;
$offset = isset($data->offset) ? $data->offset : 0;

// Get user transactions
$transactions = $transaction->getUserTransactions($decoded->user_id, $limit, $offset);

// Set response code - 200 OK
http_response_code(200);

// Return transactions
echo json_encode(array(
    "success" => true,
    "transactions" => $transactions
));
?>

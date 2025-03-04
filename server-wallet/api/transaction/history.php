<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET");
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");
include_once '../../config/database.php';
include_once '../../models/Transaction.php';
include_once '../../models/Wallet.php';
include_once '../../utils/jwt_auth.php';
$database = new Database();
$db = $database->getConnection();
$transaction = new Transaction($db);
$wallet = new Wallet($db);
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

// Get user ID from the token
$user_id = $decoded->user_id;

// Get user's wallet
$wallet->user_id = $user_id;
if (!$wallet->getWalletByUserId()) {
    // Set response code - 404 Not found
    http_response_code(404);
    
    // Tell the user
    echo json_encode(array(
        "success" => false,
        "message" => "Wallet not found."
    ));
    exit;
}

// Pagination parameters
$page = isset($_GET['page']) ? (int)$_GET['page'] : 1;
$limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 10;
$offset = ($page - 1) * $limit;

// Filter parameters
$type = isset($_GET['type']) ? $_GET['type'] : null;
$status = isset($_GET['status']) ? $_GET['status'] : null;
$date_from = isset($_GET['date_from']) ? $_GET['date_from'] : null;
$date_to = isset($_GET['date_to']) ? $_GET['date_to'] : null;

// Get transaction history
$transactions = $transaction->getUserTransactions($wallet->wallet_id, $limit, $offset, $type, $status, $date_from, $date_to);

// Get total count for pagination
$total_count = $transaction->getUserTransactionsCount($wallet->wallet_id, $type, $status, $date_from, $date_to);

// Check if any transactions found
if (!empty($transactions)) {
    // Set response code - 200 OK
    http_response_code(200);
    
    // Calculate pagination info
    $total_pages = ceil($total_count / $limit);
    $has_next_page = ($page < $total_pages);
    $has_prev_page = ($page > 1);
    
    // Return transaction history
    echo json_encode(array(
        "success" => true,
        "transactions" => $transactions,
        "pagination" => array(
            "total_count" => $total_count,
            "total_pages" => $total_pages,
            "current_page" => $page,
            "limit" => $limit,
            "has_next_page" => $has_next_page,
            "has_prev_page" => $has_prev_page
        )
    ));
} else {
    // Set response code - 200 OK
    http_response_code(200);
    
    // Tell the user
    echo json_encode(array(
        "success" => true,
        "message" => "No transactions found.",
        "transactions" => array(),
        "pagination" => array(
            "total_count" => 0,
            "total_pages" => 0,
            "current_page" => $page,
            "limit" => $limit,
            "has_next_page" => false,
            "has_prev_page" => false
        )
    ));
}
?>

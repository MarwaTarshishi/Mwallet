<?php
// Headers
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

// Include database and object files
include_once '../../config/database.php';
include_once '../../models/User.php';
include_once '../../models/Wallet.php';
include_once '../../utils/jwt_auth.php';

// Get database connection
$database = new Database();
$db = $database->getConnection();

// Prepare objects
$user = new User($db);
$wallet = new Wallet($db);
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

// Validate data
if (!empty($data->email)) {
    // Set user email
    $user->email = $data->email;
    
    // Check if email exists
    if ($user->emailExists()) {
        // Get user ID by email
        $user_id = $user->getUserIdByEmail();
        
        // Get wallet ID by user ID
        $wallet->getWalletByUserId($user_id);
        
        if ($wallet->wallet_id) {
            // Set response code - 200 OK
            http_response_code(200);
            
            // Return the wallet ID
            echo json_encode(array(
                "success" => true,
                "wallet_id" => $wallet->wallet_id
            ));
        } else {
            // Set response code - 404 Not Found
            http_response_code(404);
            
            // Tell the user
            echo json_encode(array(
                "success" => false,
                "message" => "User does not have a wallet."
            ));
        }
    } else {
        // Set response code - 404 Not Found
        http_response_code(404);
        
        // Tell the user
        echo json_encode(array(
            "success" => false,
            "message" => "User with this email does not exist."
        ));
    }
} else {
    // Set response code - 400 bad request
    http_response_code(400);
    
    // Tell the user
    echo json_encode(array(
        "success" => false,
        "message" => "Unable to get wallet. Email is required."
    ));
}
?>

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
include_once '../../utils/jwt_auth.php';

// Get database connection
$database = new Database();
$db = $database->getConnection();

// Prepare user object
$user = new User($db);
$jwt = new JwtAuth();

// Get posted data
$data = json_decode(file_get_contents("php://input"));

// Validate required data
if(!empty($data->email) && !empty($data->password)) {
    // Set user property values
    $user->email = $data->email;
    $user->password = $data->password;
    
    // Attempt to login
    $login_result = $user->login();
    
    if($login_result === true) {
        // Get user details
        $user_details = $user->getUserDetails();
        
        // Generate JWT token with wallet_id included
        $token = $jwt->generateToken(
            $user->user_id, 
            $user->email, 
            'user', 
            $user_details['wallet_id']
        );
        
        // Update last login time
        $user->updateLastLogin();
        
        // Set response code - 200 OK
        http_response_code(200);
        
        // Create response array
        $response = array(
            "success" => true,
            "message" => "Login successful.",
            "token" => $token,
            "user" => array(
                "user_id" => $user_details['user_id'],
                "first_name" => $user_details['first_name'],
                "last_name" => $user_details['last_name'],
                "email" => $user_details['email'],
                "wallet_id" => $user_details['wallet_id'],
                "balance" => $user_details['balance'],
                "currency" => $user_details['currency']
            )
        );
        
        // Tell the user
        echo json_encode($response);
    } else if($login_result === "inactive") {
        // Set response code - 401 Unauthorized
        http_response_code(401);
        
        // Tell the user
        echo json_encode(array(
            "success" => false,
            "message" => "Account not verified or inactive. Please check your email for verification link."
        ));
    } else {
        // Set response code - 401 Unauthorized
        http_response_code(401);
        
        // Tell the user
        echo json_encode(array(
            "success" => false,
            "message" => "Invalid email or password."
        ));
    }
} else {
    // Set response code - 400 bad request
    http_response_code(400);
    
    // Tell the user
    echo json_encode(array(
        "success" => false,
        "message" => "Login failed. Email and password are required."
    ));
}
?>

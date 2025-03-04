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

// Get database connection
$database = new Database();
$db = $database->getConnection();

// Prepare user object
$user = new User($db);

// Get posted data
$data = json_decode(file_get_contents("php://input"));

// Validate required data
if (
    !empty($data->first_name) &&
    !empty($data->last_name) &&
    !empty($data->email) &&
    !empty($data->password)
) {
    // Set user property values
    $user->first_name = $data->first_name;
    $user->last_name = $data->last_name;
    $user->email = $data->email;
    $user->password = $data->password;
    
    // Set phone if provided
    if(!empty($data->phone)) {
        $user->phone = $data->phone;
    } else {
        $user->phone = null;
    }
    
    // Check if email already exists
    if ($user->emailExists()) {
        // Set response code - 400 bad request
        http_response_code(400);
        
        // Tell the user
        echo json_encode(array("success" => false, "message" => "Email already exists."));
        exit;
    }
    
    // Check if phone already exists (if provided)
    if(!empty($user->phone) && $user->phoneExists()) {
        // Set response code - 400 bad request
        http_response_code(400);
        
        // Tell the user
        echo json_encode(array("success" => false, "message" => "Phone number already exists."));
        exit;
    }
    
    // Create the user
    if($user->register()) {
        // Set response code - 201 created
        http_response_code(201);
        
        // Tell the user
        echo json_encode(array(
            "success" => true,
            "message" => "User registered successfully. Please check your email for verification.",
            "verification_token" => $user->verification_token
        ));
    } else {
        // Set response code - 503 service unavailable
        http_response_code(503);
        
        // Tell the user
        echo json_encode(array("success" => false, "message" => "Unable to register user."));
    }
} else {
    // Set response code - 400 bad request
    http_response_code(400);
    
    // Tell the user
    echo json_encode(array("success" => false, "message" => "Unable to register user. Data is incomplete."));
}
?>

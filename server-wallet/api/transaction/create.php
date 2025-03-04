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
include_once '../../models/Wallet.php';
include_once '../../models/Notification.php';
include_once '../../utils/jwt_auth.php';

// Get database connection
$database = new Database();
$db = $database->getConnection();

// Prepare objects
$transaction = new Transaction($db);
$wallet = new Wallet($db);
$notification = new Notification($db);
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

// Validate transaction data
if (
    !empty($data->transaction_type) &&
    (
        (!empty($data->receiver_wallet_id) && $data->transaction_type === 'deposit') ||
        (!empty($data->sender_wallet_id) && $data->transaction_type === 'withdrawal') ||
        (!empty($data->sender_wallet_id) && !empty($data->receiver_wallet_id) && $data->transaction_type === 'transfer')
    ) &&
    !empty($data->amount)
) {
    // Set transaction properties
    $transaction->transaction_type = $data->transaction_type;
    $transaction->amount = $data->amount;
    $transaction->fee = isset($data->fee) ? $data->fee : 0.00;
    $transaction->status = isset($data->status) ? $data->status : 'pending';
    $transaction->description = isset($data->description) ? $data->description : null;
    
    // Set sender and receiver wallet IDs based on transaction type
    if ($data->transaction_type === 'deposit') {
        $transaction->sender_wallet_id = null;
        $transaction->receiver_wallet_id = $data->receiver_wallet_id;
        
        // Validate if the wallet belongs to the user
        if (!$wallet->validateUserWallet($decoded->user_id, $data->receiver_wallet_id)) {
            http_response_code(403);
            echo json_encode(array(
                "success" => false,
                "message" => "You do not have permission to deposit to this wallet."
            ));
            exit;
        }
    } elseif ($data->transaction_type === 'withdrawal') {
        $transaction->sender_wallet_id = $data->sender_wallet_id;
        $transaction->receiver_wallet_id = null;
        
        // Validate if the wallet belongs to the user
        if (!$wallet->validateUserWallet($decoded->user_id, $data->sender_wallet_id)) {
            http_response_code(403);
            echo json_encode(array(
                "success" => false,
                "message" => "You do not have permission to withdraw from this wallet."
            ));
            exit;
        }
    } else { // transfer
        $transaction->sender_wallet_id = $data->sender_wallet_id;
        $transaction->receiver_wallet_id = $data->receiver_wallet_id;
        
        // Validate if the sender wallet belongs to the user
        if (!$wallet->validateUserWallet($decoded->user_id, $data->sender_wallet_id)) {
            http_response_code(403);
            echo json_encode(array(
                "success" => false,
                "message" => "You do not have permission to transfer from this wallet."
            ));
            exit;
        }
    }
    
    // Process transaction based on type
    if ($data->transaction_type === 'deposit') {
        // Process deposit
        if ($transaction->processDeposit()) {
            // Get updated wallet balance
            $updated_balance = $wallet->getBalance($transaction->receiver_wallet_id);
            
            // Create a notification
            $notification->user_id = $decoded->user_id;
            $notification->title = "Deposit Successful";
            $notification->message = "Your deposit of $" . number_format($transaction->amount, 2) . " has been processed successfully.";
            $notification->create();
            
            // Set response code - 201 created
            http_response_code(201);
            
            // Return transaction details with updated balance
            echo json_encode(array(
                "success" => true,
                "message" => "Deposit processed successfully.",
                "transaction" => array(
                    "transaction_id" => $transaction->transaction_id,
                    "transaction_type" => $transaction->transaction_type,
                    "amount" => $transaction->amount,
                    "status" => $transaction->status,
                    "reference_code" => $transaction->reference_code,
                    "created_at" => $transaction->created_at
                ),
                "wallet" => array(
                    "wallet_id" => $transaction->receiver_wallet_id,
                    "updated_balance" => $updated_balance
                )
            ));
        } else {
            // Set response code - 503 service unavailable
            http_response_code(503);
            
            // Tell the user
            echo json_encode(array(
                "success" => false,
                "message" => "Unable to process deposit."
            ));
        }
    } elseif ($data->transaction_type === 'withdrawal') {
        // Process withdrawal
        if ($transaction->processWithdrawal()) {
            // Get updated wallet balance
            $updated_balance = $wallet->getBalance($transaction->sender_wallet_id);
            
            // Create a notification
            $notification->user_id = $decoded->user_id;
            $notification->title = "Withdrawal Successful";
            $notification->message = "Your withdrawal of $" . number_format($transaction->amount, 2) . " has been processed successfully.";
            $notification->create();
            
            // Set response code - 201 created
            http_response_code(201);
            
            // Return transaction details with updated balance
            echo json_encode(array(
                "success" => true,
                "message" => "Withdrawal processed successfully.",
                "transaction" => array(
                    "transaction_id" => $transaction->transaction_id,
                    "transaction_type" => $transaction->transaction_type,
                    "amount" => $transaction->amount,
                    "fee" => $transaction->fee,
                    "status" => $transaction->status,
                    "reference_code" => $transaction->reference_code,
                    "created_at" => $transaction->created_at
                ),
                "wallet" => array(
                    "wallet_id" => $transaction->sender_wallet_id,
                    "updated_balance" => $updated_balance
                )
            ));
        } else {
            // Set response code - 503 service unavailable
            http_response_code(503);
            
            // Tell the user
            echo json_encode(array(
                "success" => false,
                "message" => "Unable to process withdrawal. Insufficient funds or server error."
            ));
        }
    } else { // transfer
        // Process transfer
        if ($transaction->processTransfer()) {
            // Get updated wallet balance
            $updated_balance = $wallet->getBalance($transaction->sender_wallet_id);
            
            // Create a notification for sender
            $notification->user_id = $decoded->user_id;
            $notification->title = "Transfer Successful";
            $notification->message = "Your transfer of $" . number_format($transaction->amount, 2) . " has been processed successfully.";
            $notification->create();
            
            // Get receiver's user ID
            $receiver_user_id = $wallet->getUserIdByWalletId($transaction->receiver_wallet_id);
            
            // Create a notification for receiver if it's a different user
            if ($receiver_user_id != $decoded->user_id) {
                $notification->user_id = $receiver_user_id;
                $notification->title = "Transfer Received";
                $notification->message = "You have received a transfer of $" . number_format($transaction->amount, 2) . " from " . $decoded->email . ".";
                $notification->create();
            }
            
            // Set response code - 201 created
            http_response_code(201);
            
            // Return transaction details with updated balance
            echo json_encode(array(
                "success" => true,
                "message" => "Transfer processed successfully.",
                "transaction" => array(
                    "transaction_id" => $transaction->transaction_id,
                    "transaction_type" => $transaction->transaction_type,
                    "amount" => $transaction->amount,
                    "fee" => $transaction->fee,
                    "status" => $transaction->status,
                    "reference_code" => $transaction->reference_code,
                    "created_at" => $transaction->created_at
                ),
                "wallet" => array(
                    "wallet_id" => $transaction->sender_wallet_id,
                    "updated_balance" => $updated_balance
                )
            ));
        } else {
           
            http_response_code(503);
            
           
            echo json_encode(array(
                "success" => false,
                "message" => "Unable to process transfer. Insufficient funds or server error."
            ));
        }
    }
} else {
    // Set response code - 400 bad request
    http_response_code(400);
    
    
    echo json_encode(array(
        "success" => false,
        "message" => "Unable to create transaction. Data is incomplete."
    ));
}
?>

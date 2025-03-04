<?php
require_once '../config/config.php';
require_once '../config/database.php';
require_once '../utils/auth.php';

// Verify JWT token for all requests
$user = verifyToken();
if (!$user) {
    http_response_code(401);
    echo json_encode(['error' => 'Unauthorized access']);
    exit;
}

// Get the requested method
$method = $_SERVER['REQUEST_METHOD'];

// Handle different request methods
switch ($method) {
    case 'GET':
        // Get Transactions
        getTransactions($user['user_id']);
        break;
    case 'POST':
        // Process data based on action parameter
        $data = json_decode(file_get_contents('php://input'), true);
        $action = isset($_GET['action']) ? $_GET['action'] : '';
        
        switch ($action) {
            case 'p2p_transfer':
                processPeerToPeerTransfer($user['user_id'], $data);
                break;
            case 'get_details':
                getTransactionDetails($user['user_id'], $data);
                break;
            case 'export':
                exportTransactions($user['user_id'], $data);
                break;
            default:
                http_response_code(400);
                echo json_encode(['error' => 'Invalid action']);
                break;
        }
        break;
    default:
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed']);
        break;
}

  

    
    // Get query parameters for filtering
    $type = isset($_GET['type']) ? $_GET['type'] : '';
    $status = isset($_GET['status']) ? $_GET['status'] : '';
    $search = isset($_GET['search']) ? $_GET['search'] : '';
    $startDate = isset($_GET['start_date']) ? $_GET['start_date'] : '';
    $endDate = isset($_GET['end_date']) ? $_GET['end_date'] : '';
    $page = isset($_GET['page']) ? intval($_GET['page']) : 1;
    $limit = isset($_GET['limit']) ? intval($_GET['limit']) : 10;
    
    // Calculate offset
    $offset = ($page - 1) * $limit;
    
    // Get the wallet ID for the user
    $walletSql = "SELECT wallet_id FROM wallets WHERE user_id = ?";
    $walletStmt = $conn->prepare($walletSql);
    $walletStmt->bind_param("i", $userId);
    $walletStmt->execute();
    $walletResult = $walletStmt->get_result();
    $walletRow = $walletResult->fetch_assoc();
    
    if (!$walletRow) {
        http_response_code(404);
        echo json_encode(['error' => 'Wallet not found']);
        exit;
    }
    
    $walletId = $walletRow['wallet_id'];
    
    $sql = "SELECT 
                t.*,
                CASE 
                    WHEN t.sender_wallet_id = ? THEN -t.amount
                    ELSE t.amount
                END as display_amount,
                s.user_id as sender_user_id,
                r.user_id as receiver_user_id,
                su.first_name as sender_first_name,
                su.last_name as sender_last_name,
                ru.first_name as receiver_first_name,
                ru.last_name as receiver_last_name
            FROM transactions t
            LEFT JOIN wallets s ON t.sender_wallet_id = s.wallet_id
            LEFT JOIN wallets r ON t.receiver_wallet_id = r.wallet_id
            LEFT JOIN users su ON s.user_id = su.user_id
            LEFT JOIN users ru ON r.user_id = ru.user_id
            WHERE t.sender_wallet_id = ? OR t.receiver_wallet_id = ?";
    
    // Add filters
    $params = [$walletId, $walletId, $walletId];
    $types = "iii";
    
    if (!empty($type)) {
        $sql .= " AND t.transaction_type = ?";
        $params[] = $type;
        $types .= "s";
    }
    
    if (!empty($status)) {
        $sql .= " AND t.status = ?";
        $params[] = $status;
        $types .= "s";
    }
    
    if (!empty($search)) {
        $searchTerm = "%$search%";
        $sql .= " AND (t.transaction_id LIKE ? OR t.reference_code LIKE ? OR t.description LIKE ?)";
        $params[] = $searchTerm;
        $params[] = $searchTerm;
        $params[] = $searchTerm;
        $types .= "sss";
    }
    
    if (!empty($startDate)) {
        $sql .= " AND DATE(t.created_at) >= ?";
        $params[] = $startDate;
        $types .= "s";
    }
    
    if (!empty($endDate)) {
        $sql .= " AND DATE(t.created_at) <= ?";
        $params[] = $endDate;
        $types .= "s";
    }
    
    // Add ordering
    $sql .= " ORDER BY t.created_at DESC";
    
    // Count total records for pagination
    $countSql = str_replace("SELECT 
                t.*,
                CASE 
                    WHEN t.sender_wallet_id = ? THEN -t.amount
                    ELSE t.amount
                END as display_amount,
                s.user_id as sender_user_id,
                r.user_id as receiver_user_id,
                su.first_name as sender_first_name,
                su.last_name as sender_last_name,
                ru.first_name as receiver_first_name,
                ru.last_name as receiver_last_name", "SELECT COUNT(*) as total", $sql);
    
    $countSql = preg_replace('/ORDER BY\s+[\w\W]+?\s+DESC/i', '', $countSql);

    $countStmt = $conn->prepare($countSql);
    if (!empty($params)) {
        $countStmt->bind_param($types, ...$params);
    }
    try {
        // Remove ORDER BY clause safely
        $countSql = preg_replace('/ORDER BY\s+[\w\W]+?\s+DESC/i', '', $countSql);
    
        $countStmt = $conn->prepare($countSql);
        if (!empty($params)) {
            $countStmt->bind_param($types, ...$params);
        }
        $countStmt->execute();
        $countResult = $countStmt->get_result();
        $countRow = $countResult->fetch_assoc();
        $totalRecords = $countRow['total'] ?? 0;
    
        // Close count statement and result
        $countResult->free();
        $countStmt->close();
    
        // Append LIMIT clause
        $sql .= " LIMIT ?, ?";
        $params[] = (int) $offset; // Ensure integer type
        $params[] = (int) $limit;
    
        $types .= 'ii';
    
        $stmt = $conn->prepare($sql);
        $stmt->bind_param($types, ...$params);
        $stmt->execute();
    
        // Fetch result (if needed)
        $result = $stmt->get_result();
        $data = $result->fetch_all(MYSQLI_ASSOC);
    
        $result->free();
        $stmt->close();
    
        $conn->close();

        echo json_encode([
            'totalRecords' => $totalRecords,
            'data' => $data
        ]);
    } catch (Exception $e) {
        echo json_encode([
            'error' => $e->getMessage()
        ]);
    }
    

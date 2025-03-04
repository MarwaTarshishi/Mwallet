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

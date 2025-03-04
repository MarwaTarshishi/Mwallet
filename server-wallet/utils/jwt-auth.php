<?php
class JwtAuth {
    private $secret_key = "vanilla_wallet_secret_key_change_in_production";
    private $algorithm = 'HS256';
    private $issuer = 'vanilla_wallet_platform';

  
    public function generateToken($user_id, $email, $role = 'user', $wallet_id = null) {
        $issued_at = time();
        $expiration_time = $issued_at + (60 * 60 * 24); // Valid for 24 hours

        $token_id = bin2hex(random_bytes(16));

        $payload = [
            'iss' => $this->issuer,
            'iat' => $issued_at,
            'exp' => $expiration_time,
            'jti' => $token_id, // JWT ID for uniqueness
            'user_id' => $user_id,
            'email' => $email,
            'role' => $role,
            'wallet_id' => $wallet_id
        ];

        // Encode JWT token
        $jwt = $this->encode($payload);
        
        return $jwt;
    }

    // Validate JWT token
    public function validateToken($jwt) {
        try {
            $decoded = $this->decode($jwt);
            
            // Check if token is expired
            if ($decoded->exp < time()) {
                return false;
            }
            
            return $decoded;
        } catch (Exception $e) {
            return false;
        }
    }

    // Encode JWT
    private function encode($payload) {
        // Header
        $header = json_encode([
            'typ' => 'JWT',
            'alg' => $this->algorithm
        ]);
        
        // Encode Header
        $base64UrlHeader = $this->base64UrlEncode($header);
        
        // Encode Payload
        $base64UrlPayload = $this->base64UrlEncode(json_encode($payload));
        
        // Create Signature
        $signature = hash_hmac('sha256', $base64UrlHeader . "." . $base64UrlPayload, $this->secret_key, true);
        $base64UrlSignature = $this->base64UrlEncode($signature);
        
        // Create JWT
        $jwt = $base64UrlHeader . "." . $base64UrlPayload . "." . $base64UrlSignature;
        
        return $jwt;
    }

    // Decode JWT
    private function decode($jwt) {
        // Split token
        $tokenParts = explode('.', $jwt);
        if (count($tokenParts) != 3) {
            throw new Exception('Invalid token format');
        }
        
        $header = $this->base64UrlDecode($tokenParts[0]);
        $payload = $this->base64UrlDecode($tokenParts[1]);
        $signature_provided = $tokenParts[2];
        
        // Check the signature
        $base64UrlHeader = $this->base64UrlEncode($header);
        $base64UrlPayload = $this->base64UrlEncode($payload);
        $signature = hash_hmac('sha256', $base64UrlHeader . "." . $base64UrlPayload, $this->secret_key, true);
        $base64UrlSignature = $this->base64UrlEncode($signature);
        
        if ($base64UrlSignature !== $signature_provided) {
            throw new Exception('Invalid signature');
        }
        
        return json_decode($payload);
    }

    // Base64Url Encode
    private function base64UrlEncode($data) {
        $b64 = base64_encode($data);
        $url = strtr($b64, '+/', '-_');
        return rtrim($url, '=');
    }

    // Base64Url Decode
    private function base64UrlDecode($data) {
        $b64 = strtr($data, '-_', '+/');
        switch (strlen($b64) % 4) {
            case 0:
                break;
            case 2:
                $b64 .= "==";
                break;
            case 3:
                $b64 .= "=";
                break;
            default:
                throw new Exception('Invalid base64 string');
        }
        return base64_decode($b64);
    }
}
?>

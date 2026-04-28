<?php
/**
 * PayCompare - Database Configuration
 * 
 * This file contains database connection settings and configuration constants
 */

// Prevent direct access
if (!defined('PAYCOMPARE_ACCESS')) {
    exit('Direct access denied');
}

// Database Configuration - Use environment variables in production
define('DB_HOST', getenv('DB_HOST') ?: 'localhost');
define('DB_NAME', getenv('DB_NAME') ?: 'paycompare_db');
define('DB_USER', getenv('DB_USER') ?: 'root');
define('DB_PASS', getenv('DB_PASS') ?: '');

// Application Configuration
define('APP_NAME', 'PayCompare');
define('APP_URL', 'http://localhost/PayCompare');
define('APP_VERSION', '1.0.0');

// Security Configuration
define('HASH_COST', 12); // bcrypt cost factor
define('SESSION_LIFETIME', 86400); // 24 hours in seconds
define('MAX_LOGIN_ATTEMPTS', 5);
define('LOGIN_LOCKOUT_TIME', 900); // 15 minutes

// API Configuration
define('API_VERSION', 'v1');
define('CORS_ORIGIN', getenv('CORS_ORIGIN') ?: '*'); // Use environment variable in production
define('RATE_LIMIT_REQUESTS', 100); // requests per hour
define('RATE_LIMIT_WINDOW', 3600); // 1 hour

// Email Configuration (for notifications)
define('SMTP_HOST', 'localhost');
define('SMTP_PORT', 587);
define('SMTP_USERNAME', '');
define('SMTP_PASSWORD', '');
define('SMTP_FROM_EMAIL', 'noreply@paycompare.com');
define('SMTP_FROM_NAME', 'PayCompare');

// File Upload Configuration
define('MAX_FILE_SIZE', 5242880); // 5MB in bytes
define('ALLOWED_FILE_TYPES', ['jpg', 'jpeg', 'png', 'gif', 'pdf', 'csv']);

// Debug Mode (set to false in production)
define('DEBUG_MODE', true);

// Error Reporting
if (DEBUG_MODE) {
    error_reporting(E_ALL);
    ini_set('display_errors', 1);
} else {
    error_reporting(0);
    ini_set('display_errors', 0);
}

// Timezone
date_default_timezone_set('Asia/Kolkata');

// Session Configuration
ini_set('session.cookie_httponly', 1);
ini_set('session.cookie_secure', getenv('HTTPS') ? 1 : 0); // Auto-detect HTTPS
ini_set('session.cookie_samesite', 'Strict');
ini_set('session.use_strict_mode', 1);

/**
 * Database Connection Class
 */
class Database {
    private static $instance = null;
    private $connection;
    
    /**
     * Get database instance (Singleton pattern)
     */
    public static function getInstance() {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }
    
    /**
     * Private constructor to prevent direct instantiation
     */
    private function __construct() {
        $this->connect();
    }
    
    /**
     * Establish database connection
     */
    private function connect() {
        try {
            $dsn = "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4";
            $options = [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false,
                PDO::ATTR_PERSISTENT => true
            ];
            
            $this->connection = new PDO($dsn, DB_USER, DB_PASS, $options);
        } catch (PDOException $e) {
            if (DEBUG_MODE) {
                die("Database connection failed: " . $e->getMessage());
            } else {
                die("Database connection failed. Please try again later.");
            }
        }
    }
    
    /**
     * Get database connection
     */
    public function getConnection() {
        return $this->connection;
    }
    
    /**
     * Execute prepared statement
     */
    public function execute($query, $params = []) {
        try {
            $stmt = $this->connection->prepare($query);
            $stmt->execute($params);
            return $stmt;
        } catch (PDOException $e) {
            if (DEBUG_MODE) {
                die("Query failed: " . $e->getMessage());
            } else {
                return false;
            }
        }
    }
    
    /**
     * Get last insert ID
     */
    public function getLastInsertId() {
        return $this->connection->lastInsertId();
    }
    
    /**
     * Begin transaction
     */
    public function beginTransaction() {
        return $this->connection->beginTransaction();
    }
    
    /**
     * Commit transaction
     */
    public function commit() {
        return $this->connection->commit();
    }
    
    /**
     * Rollback transaction
     */
    public function rollback() {
        return $this->connection->rollback();
    }
    
    /**
     * Prevent cloning of singleton
     */
    private function __clone() {}
    
    /**
     * Prevent unserialization of singleton
     */
    public function __wakeup() {
        throw new Exception("Cannot unserialize singleton");
    }
}

/**
 * Security Helper Functions
 */

/**
 * Generate secure random token
 */
function generateToken($length = 32) {
    return bin2hex(random_bytes($length / 2));
}

/**
 * Hash password using bcrypt
 */
function hashPassword($password) {
    return password_hash($password, PASSWORD_BCRYPT, ['cost' => HASH_COST]);
}

/**
 * Verify password
 */
function verifyPassword($password, $hash) {
    return password_verify($password, $hash);
}

/**
 * Sanitize input
 */
function sanitizeInput($input) {
    if (is_array($input)) {
        return array_map('sanitizeInput', $input);
    }
    return htmlspecialchars(trim($input), ENT_QUOTES, 'UTF-8');
}

/**
 * Validate email
 */
function validateEmail($email) {
    return filter_var($email, FILTER_VALIDATE_EMAIL) !== false;
}

/**
 * Generate CSRF token
 */
function generateCSRFToken() {
    if (!isset($_SESSION['csrf_token'])) {
        $_SESSION['csrf_token'] = generateToken();
    }
    return $_SESSION['csrf_token'];
}

/**
 * Verify CSRF token
 */
function verifyCSRFToken($token) {
    return isset($_SESSION['csrf_token']) && hash_equals($_SESSION['csrf_token'], $token);
}

/**
 * Log activity
 */
function logActivity($userId, $action, $description = '', $ipAddress = '', $userAgent = '') {
    $db = Database::getInstance();
    
    $query = "INSERT INTO logs (user_id, action, description, ip_address, user_agent) 
              VALUES (?, ?, ?, ?, ?)";
    
    $params = [
        $userId,
        $action,
        $description,
        $ipAddress ?: $_SERVER['REMOTE_ADDR'] ?? '',
        $userAgent ?: $_SERVER['HTTP_USER_AGENT'] ?? ''
    ];
    
    $db->execute($query, $params);
}

/**
 * Send JSON response
 */
function sendJSONResponse($data, $statusCode = 200) {
    header('Content-Type: application/json');
    http_response_code($statusCode);
    echo json_encode($data);
    exit;
}

/**
 * Send error response
 */
function sendErrorResponse($message, $statusCode = 400) {
    sendJSONResponse([
        'success' => false,
        'message' => $message
    ], $statusCode);
}

/**
 * Send success response
 */
function sendSuccessResponse($data = null, $message = 'Success') {
    sendJSONResponse([
        'success' => true,
        'message' => $message,
        'data' => $data
    ]);
}

/**
 * Check if user is authenticated
 */
function isAuthenticated() {
    return isset($_SESSION['user_id']) && !empty($_SESSION['user_id']);
}

/**
 * Get current user
 */
function getCurrentUser() {
    if (!isAuthenticated()) {
        return null;
    }
    
    $db = Database::getInstance();
    $query = "SELECT id, username, email, full_name, role, is_active FROM users WHERE id = ?";
    $stmt = $db->execute($query, [$_SESSION['user_id']]);
    return $stmt->fetch();
}

/**
 * Check if user is admin
 */
function isAdmin() {
    $user = getCurrentUser();
    return $user && $user['role'] === 'admin';
}

/**
 * Rate limiting
 */
function checkRateLimit($identifier, $maxRequests = RATE_LIMIT_REQUESTS, $window = RATE_LIMIT_WINDOW) {
    $db = Database::getInstance();
    
    // Clean old entries
    $cleanupQuery = "DELETE FROM rate_limits WHERE created_at < DATE_SUB(NOW(), INTERVAL ? SECOND)";
    $db->execute($cleanupQuery, [$window]);
    
    // Check current requests
    $checkQuery = "SELECT COUNT(*) as count FROM rate_limits WHERE identifier = ? AND created_at > DATE_SUB(NOW(), INTERVAL ? SECOND)";
    $stmt = $db->execute($checkQuery, [$identifier, $window]);
    $result = $stmt->fetch();
    
    if ($result['count'] >= $maxRequests) {
        sendErrorResponse('Rate limit exceeded. Please try again later.', 429);
    }
    
    // Log current request
    $insertQuery = "INSERT INTO rate_limits (identifier, created_at) VALUES (?, NOW())";
    $db->execute($insertQuery, [$identifier]);
}

/**
 * Get client IP address
 */
function getClientIP() {
    $ipKeys = ['HTTP_X_FORWARDED_FOR', 'HTTP_X_REAL_IP', 'HTTP_CLIENT_IP', 'REMOTE_ADDR'];
    
    foreach ($ipKeys as $key) {
        if (!empty($_SERVER[$key])) {
            $ips = explode(',', $_SERVER[$key]);
            $ip = trim($ips[0]);
            if (filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE)) {
                return $ip;
            }
        }
    }
    
    return $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';
}

// Initialize session
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// Set CORS headers
header('Access-Control-Allow-Origin: ' . CORS_ORIGIN);
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
header('Access-Control-Allow-Credentials: true');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// Define access constant
define('PAYCOMPARE_ACCESS', true);
?>

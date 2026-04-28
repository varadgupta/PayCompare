<?php
/**
 * PayCompare - Authentication API
 * 
 * RESTful API endpoints for user authentication and management
 */

// Prevent direct access
require_once '../includes/config.php';

// Set JSON content type
header('Content-Type: application/json');

// Additional security headers
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: DENY');
header('X-XSS-Protection: 1; mode=block');

// Get HTTP method
$method = $_SERVER['REQUEST_METHOD'];

// Get action from URL parameter
$action = $_GET['action'] ?? '';

// Rate limiting
$identifier = getClientIP();
checkRateLimit($identifier);

// Route requests
switch ($method) {
    case 'POST':
        handlePostRequest($action);
        break;
    case 'GET':
        handleGetRequest($action);
        break;
    default:
        sendErrorResponse('Method not allowed', 405);
        break;
}

/**
 * Handle POST requests
 */
function handlePostRequest($action) {
    switch ($action) {
        case 'login':
            handleLogin();
            break;
        case 'register':
            handleRegister();
            break;
        case 'logout':
            handleLogout();
            break;
        case 'forgot-password':
            handleForgotPassword();
            break;
        case 'reset-password':
            handleResetPassword();
            break;
        default:
            sendErrorResponse('Invalid action');
            break;
    }
}

/**
 * Handle GET requests
 */
function handleGetRequest($action) {
    switch ($action) {
        case 'check':
            handleAuthCheck();
            break;
        case 'user':
            handleGetCurrentUser();
            break;
        default:
            sendErrorResponse('Invalid action');
            break;
    }
}

/**
 * Handle user login
 */
function handleLogin() {
    // Get JSON input
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input) {
        sendErrorResponse('Invalid JSON input');
    }
    
    // Validate required fields
    $requiredFields = ['email', 'password'];
    
    foreach ($requiredFields as $field) {
        if (!isset($input[$field]) || empty($input[$field])) {
            sendErrorResponse("Field '{$field}' is required");
        }
    }
    
    $email = sanitizeInput($input['email']);
    $password = $input['password'];
    $remember = isset($input['remember']) ? (bool)$input['remember'] : false;
    
    // Validate email format
    if (!validateEmail($email)) {
        sendErrorResponse('Invalid email format');
    }
    
    // Check login attempts
    $db = Database::getInstance();
    
    // Clean old login attempts
    $cleanupQuery = "DELETE FROM login_attempts WHERE created_at < DATE_SUB(NOW(), INTERVAL ? SECOND)";
    $db->execute($cleanupQuery, [LOGIN_LOCKOUT_TIME]);
    
    // Check current login attempts
    $attemptsQuery = "SELECT COUNT(*) as count FROM login_attempts WHERE email = ? AND created_at > DATE_SUB(NOW(), INTERVAL ? SECOND)";
    $stmt = $db->execute($attemptsQuery, [$email, LOGIN_LOCKOUT_TIME]);
    $attempts = $stmt->fetch()['count'];
    
    if ($attempts >= MAX_LOGIN_ATTEMPTS) {
        sendErrorResponse('Too many login attempts. Please try again later.', 429);
    }
    
    // Find user
    $userQuery = "SELECT * FROM users WHERE email = ? AND is_active = 1";
    $stmt = $db->execute($userQuery, [$email]);
    $user = $stmt->fetch();
    
    if (!$user) {
        // Log failed attempt
        logLoginAttempt($email, false);
        sendErrorResponse('Invalid email or password');
    }
    
    // Verify password
    if (!verifyPassword($password, $user['password_hash'])) {
        // Log failed attempt
        logLoginAttempt($email, false);
        sendErrorResponse('Invalid email or password');
    }
    
    // Clear login attempts on successful login
    $clearAttemptsQuery = "DELETE FROM login_attempts WHERE email = ?";
    $db->execute($clearAttemptsQuery, [$email]);
    
    // Create session
    $_SESSION['user_id'] = $user['id'];
    $_SESSION['username'] = $user['username'];
    $_SESSION['email'] = $user['email'];
    $_SESSION['role'] = $user['role'];
    $_SESSION['login_time'] = time();
    
    // Update last login
    $updateQuery = "UPDATE users SET last_login = NOW() WHERE id = ?";
    $db->execute($updateQuery, [$user['id']]);
    
    // Log activity
    logActivity($user['id'], 'login', 'User logged in');
    
    // Prepare user data for response
    $userData = [
        'id' => $user['id'],
        'username' => $user['username'],
        'email' => $user['email'],
        'full_name' => $user['full_name'],
        'role' => $user['role'],
        'phone' => $user['phone'],
        'last_login' => $user['last_login']
    ];
    
    sendSuccessResponse($userData, 'Login successful');
}

/**
 * Handle user registration
 */
function handleRegister() {
    // Get JSON input
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input) {
        sendErrorResponse('Invalid JSON input');
    }
    
    // Validate required fields
    $requiredFields = ['username', 'email', 'password', 'full_name'];
    
    foreach ($requiredFields as $field) {
        if (!isset($input[$field]) || empty($input[$field])) {
            sendErrorResponse("Field '{$field}' is required");
        }
    }
    
    $username = sanitizeInput($input['username']);
    $email = sanitizeInput($input['email']);
    $password = $input['password'];
    $fullName = sanitizeInput($input['full_name']);
    $phone = isset($input['phone']) ? sanitizeInput($input['phone']) : null;
    
    // Validate inputs
    if (!validateEmail($email)) {
        sendErrorResponse('Invalid email format');
    }
    
    if (strlen($username) < 3 || strlen($username) > 50) {
        sendErrorResponse('Username must be between 3 and 50 characters');
    }
    
    if (!preg_match('/^[a-zA-Z0-9_]+$/', $username)) {
        sendErrorResponse('Username can only contain letters, numbers, and underscores');
    }
    
    if (strlen($password) < 8) {
        sendErrorResponse('Password must be at least 8 characters long');
    }
    
    if (!preg_match('/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/', $password)) {
        sendErrorResponse('Password must contain at least one uppercase letter, one lowercase letter, and one number');
    }
    
    if (strlen($fullName) < 2 || strlen($fullName) > 100) {
        sendErrorResponse('Full name must be between 2 and 100 characters');
    }
    
    if ($phone && !preg_match('/^[\d\s\-\+\(\)]+$/', $phone)) {
        sendErrorResponse('Invalid phone number format');
    }
    
    $db = Database::getInstance();
    
    try {
        $db->beginTransaction();
        
        // Check if username already exists
        $usernameQuery = "SELECT id FROM users WHERE username = ?";
        $stmt = $db->execute($usernameQuery, [$username]);
        
        if ($stmt->fetch()) {
            sendErrorResponse('Username already exists');
        }
        
        // Check if email already exists
        $emailQuery = "SELECT id FROM users WHERE email = ?";
        $stmt = $db->execute($emailQuery, [$email]);
        
        if ($stmt->fetch()) {
            sendErrorResponse('Email already exists');
        }
        
        // Hash password
        $passwordHash = hashPassword($password);
        
        // Insert new user
        $insertQuery = "INSERT INTO users (username, email, password_hash, full_name, phone, role, is_active, created_at, updated_at) 
                       VALUES (?, ?, ?, ?, ?, 'user', 1, NOW(), NOW())";
        
        $params = [$username, $email, $passwordHash, $fullName, $phone];
        $db->execute($insertQuery, $params);
        $userId = $db->getLastInsertId();
        
        // Log activity
        logActivity($userId, 'register', 'User registered');
        
        $db->commit();
        
        // Auto-login after registration
        $_SESSION['user_id'] = $userId;
        $_SESSION['username'] = $username;
        $_SESSION['email'] = $email;
        $_SESSION['role'] = 'user';
        $_SESSION['login_time'] = time();
        
        // Prepare user data for response
        $userData = [
            'id' => $userId,
            'username' => $username,
            'email' => $email,
            'full_name' => $fullName,
            'role' => 'user',
            'phone' => $phone
        ];
        
        sendSuccessResponse($userData, 'Registration successful');
        
    } catch (Exception $e) {
        $db->rollback();
        
        if (defined('DEBUG_MODE') && DEBUG_MODE) {
            sendErrorResponse('Database error: ' . $e->getMessage());
        } else {
            sendErrorResponse('Registration failed. Please try again.');
        }
    }
}

/**
 * Handle user logout
 */
function handleLogout() {
    if (!isAuthenticated()) {
        sendErrorResponse('Not authenticated', 401);
    }
    
    $userId = $_SESSION['user_id'];
    
    // Log activity
    logActivity($userId, 'logout', 'User logged out');
    
    // Destroy session
    session_destroy();
    
    sendSuccessResponse(null, 'Logout successful');
}

/**
 * Handle forgot password
 */
function handleForgotPassword() {
    // Get JSON input
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input || !isset($input['email'])) {
        sendErrorResponse('Email is required');
    }
    
    $email = sanitizeInput($input['email']);
    
    if (!validateEmail($email)) {
        sendErrorResponse('Invalid email format');
    }
    
    $db = Database::getInstance();
    
    // Check if user exists
    $userQuery = "SELECT id, username FROM users WHERE email = ? AND is_active = 1";
    $stmt = $db->execute($userQuery, [$email]);
    $user = $stmt->fetch();
    
    if (!$user) {
        // Don't reveal if email exists or not
        sendSuccessResponse(null, 'If an account with this email exists, a password reset link has been sent.');
    }
    
    // Generate reset token
    $resetToken = generateToken();
    $expiryTime = date('Y-m-d H:i:s', time() + 3600); // 1 hour expiry
    
    // Store reset token
    $updateQuery = "UPDATE users SET reset_token = ?, reset_token_expiry = ? WHERE id = ?";
    $db->execute($updateQuery, [$resetToken, $expiryTime, $user['id']]);
    
    // Log activity
    logActivity($user['id'], 'password_reset_requested', 'Password reset requested');
    
    // In a real application, send email with reset link
    // For demo purposes, we'll just return success
    
    sendSuccessResponse(null, 'If an account with this email exists, a password reset link has been sent.');
}

/**
 * Handle password reset
 */
function handleResetPassword() {
    // Get JSON input
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input) {
        sendErrorResponse('Invalid JSON input');
    }
    
    $requiredFields = ['token', 'password'];
    
    foreach ($requiredFields as $field) {
        if (!isset($input[$field]) || empty($input[$field])) {
            sendErrorResponse("Field '{$field}' is required");
        }
    }
    
    $token = sanitizeInput($input['token']);
    $password = $input['password'];
    
    // Validate password
    if (strlen($password) < 8) {
        sendErrorResponse('Password must be at least 8 characters long');
    }
    
    if (!preg_match('/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/', $password)) {
        sendErrorResponse('Password must contain at least one uppercase letter, one lowercase letter, and one number');
    }
    
    $db = Database::getInstance();
    
    // Find user with valid reset token
    $userQuery = "SELECT id, username FROM users WHERE reset_token = ? AND reset_token_expiry > NOW() AND is_active = 1";
    $stmt = $db->execute($userQuery, [$token]);
    $user = $stmt->fetch();
    
    if (!$user) {
        sendErrorResponse('Invalid or expired reset token');
    }
    
    try {
        $db->beginTransaction();
        
        // Hash new password
        $passwordHash = hashPassword($password);
        
        // Update password and clear reset token
        $updateQuery = "UPDATE users SET password_hash = ?, reset_token = NULL, reset_token_expiry = NULL, updated_at = NOW() WHERE id = ?";
        $db->execute($updateQuery, [$passwordHash, $user['id']]);
        
        // Log activity
        logActivity($user['id'], 'password_reset', 'Password was reset');
        
        $db->commit();
        
        sendSuccessResponse(null, 'Password reset successful');
        
    } catch (Exception $e) {
        $db->rollback();
        
        if (defined('DEBUG_MODE') && DEBUG_MODE) {
            sendErrorResponse('Database error: ' . $e->getMessage());
        } else {
            sendErrorResponse('Password reset failed. Please try again.');
        }
    }
}

/**
 * Handle authentication check
 */
function handleAuthCheck() {
    if (!isAuthenticated()) {
        sendErrorResponse('Not authenticated', 401);
    }
    
    $user = getCurrentUser();
    
    if (!$user) {
        sendErrorResponse('User not found', 404);
    }
    
    // Check session expiry
    $sessionLifetime = SESSION_LIFETIME;
    if (isset($_SESSION['login_time']) && (time() - $_SESSION['login_time']) > $sessionLifetime) {
        handleLogout();
        sendErrorResponse('Session expired', 401);
    }
    
    sendSuccessResponse($user, 'Authenticated');
}

/**
 * Handle get current user
 */
function handleGetCurrentUser() {
    if (!isAuthenticated()) {
        sendErrorResponse('Not authenticated', 401);
    }
    
    $user = getCurrentUser();
    
    if (!$user) {
        sendErrorResponse('User not found', 404);
    }
    
    sendSuccessResponse($user);
}

/**
 * Log login attempt
 */
function logLoginAttempt($email, $success) {
    $db = Database::getInstance();
    
    if (!$success) {
        // Log failed attempt
        $query = "INSERT INTO login_attempts (email, created_at) VALUES (?, NOW())";
        $db->execute($query, [$email]);
    }
}
?>

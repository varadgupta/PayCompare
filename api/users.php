<?php
/**
 * PayCompare - Users Management API
 * 
 * RESTful API endpoints for user management (admin only)
 */

// Include configuration
require_once '../includes/config.php';

// Set content type
header('Content-Type: application/json');

// Get HTTP method
$method = $_SERVER['REQUEST_METHOD'];

// Check if user is admin
if (!isAdmin()) {
    sendErrorResponse('Admin access required', 403);
}

// Rate limiting
$identifier = getClientIP();
checkRateLimit($identifier);

// Route requests
switch ($method) {
    case 'GET':
        handleGetRequest();
        break;
    case 'POST':
        handlePostRequest();
        break;
    case 'PUT':
        handlePutRequest();
        break;
    case 'DELETE':
        handleDeleteRequest();
        break;
    default:
        sendErrorResponse('Method not allowed', 405);
        break;
}

/**
 * Handle GET requests
 */
function handleGetRequest() {
    $db = Database::getInstance();
    
    // Check if specific user is requested
    if (isset($_GET['id'])) {
        $id = sanitizeInput($_GET['id']);
        
        if (!is_numeric($id)) {
            sendErrorResponse('Invalid user ID');
        }
        
        $query = "SELECT id, username, email, full_name, phone, role, is_active, created_at, updated_at, last_login FROM users WHERE id = ?";
        $stmt = $db->execute($query, [$id]);
        $user = $stmt->fetch();
        
        if (!$user) {
            sendErrorResponse('User not found', 404);
        }
        
        sendSuccessResponse($user);
    } else {
        // Get all users with optional filters
        $query = "SELECT id, username, email, full_name, phone, role, is_active, created_at, updated_at, last_login FROM users";
        $params = [];
        
        // Apply filters
        if (isset($_GET['role'])) {
            $query .= " WHERE role = ?";
            $params[] = sanitizeInput($_GET['role']);
        } else {
            $query .= " WHERE 1=1";
        }
        
        if (isset($_GET['active'])) {
            $isActive = $_GET['active'] === 'true' ? 1 : 0;
            $query .= " AND is_active = ?";
            $params[] = $isActive;
        }
        
        if (isset($_GET['search'])) {
            $searchTerm = '%' . sanitizeInput($_GET['search']) . '%';
            $query .= " AND (username LIKE ? OR email LIKE ? OR full_name LIKE ?)";
            $params[] = $searchTerm;
            $params[] = $searchTerm;
            $params[] = $searchTerm;
        }
        
        // Ordering
        $orderBy = sanitizeInput($_GET['order_by'] ?? 'created_at');
        $order = sanitizeInput($_GET['order'] ?? 'DESC');
        
        if (!in_array($orderBy, ['id', 'username', 'email', 'full_name', 'role', 'created_at', 'last_login'])) {
            $orderBy = 'created_at';
        }
        
        if (!in_array(strtoupper($order), ['ASC', 'DESC'])) {
            $order = 'DESC';
        }
        
        $query .= " ORDER BY {$orderBy} {$order}";
        
        // Limiting
        if (isset($_GET['limit'])) {
            $limit = intval($_GET['limit']);
            if ($limit > 0 && $limit <= 100) {
                $query .= " LIMIT ?";
                $params[] = $limit;
            }
        }
        
        $stmt = $db->execute($query, $params);
        $users = $stmt->fetchAll();
        
        // Get total count
        $countQuery = "SELECT COUNT(*) as total FROM users";
        $countStmt = $db->execute($countQuery);
        $totalCount = $countStmt->fetch()['total'];
        
        sendSuccessResponse([
            'users' => $users,
            'total' => $totalCount,
            'count' => count($users)
        ]);
    }
}

/**
 * Handle POST requests (Create new user)
 */
function handlePostRequest() {
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
    $role = isset($input['role']) ? sanitizeInput($input['role']) : 'user';
    $isActive = isset($input['is_active']) ? (bool)$input['is_active'] : true;
    
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
    
    if (!in_array($role, ['user', 'admin'])) {
        sendErrorResponse('Invalid role');
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
                       VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())";
        
        $params = [$username, $email, $passwordHash, $fullName, $phone, $role, $isActive];
        $db->execute($insertQuery, $params);
        $userId = $db->getLastInsertId();
        
        // Log activity
        $currentUser = getCurrentUser();
        logActivity($currentUser['id'], 'user_created', "Created user: {$username}");
        
        $db->commit();
        
        // Return created user (without password hash)
        $selectQuery = "SELECT id, username, email, full_name, phone, role, is_active, created_at, updated_at FROM users WHERE id = ?";
        $stmt = $db->execute($selectQuery, [$userId]);
        $createdUser = $stmt->fetch();
        
        sendSuccessResponse($createdUser, 'User created successfully');
        
    } catch (Exception $e) {
        $db->rollback();
        
        if (defined('DEBUG_MODE') && DEBUG_MODE) {
            sendErrorResponse('Database error: ' . $e->getMessage());
        } else {
            sendErrorResponse('Failed to create user');
        }
    }
}

/**
 * Handle PUT requests (Update user)
 */
function handlePutRequest() {
    // Get user ID from URL
    if (!isset($_GET['id'])) {
        sendErrorResponse('User ID is required');
    }
    
    $id = intval($_GET['id']);
    
    if ($id <= 0) {
        sendErrorResponse('Invalid user ID');
    }
    
    // Prevent admin from deactivating themselves
    if ($id == $_SESSION['user_id']) {
        sendErrorResponse('Cannot modify your own account through this endpoint');
    }
    
    // Get JSON input
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input) {
        sendErrorResponse('Invalid JSON input');
    }
    
    // Check if user exists
    $db = Database::getInstance();
    $checkQuery = "SELECT * FROM users WHERE id = ?";
    $checkStmt = $db->execute($checkQuery, [$id]);
    $existingUser = $checkStmt->fetch();
    
    if (!$existingUser) {
        sendErrorResponse('User not found', 404);
    }
    
    // Build update query dynamically
    $updateFields = [];
    $params = [];
    
    // Updatable fields
    $updatableFields = ['username', 'email', 'full_name', 'phone', 'role', 'is_active'];
    
    foreach ($updatableFields as $field) {
        if (isset($input[$field])) {
            $updateFields[] = "{$field} = ?";
            
            if ($field === 'is_active') {
                $params[] = (bool)$input[$field];
            } else {
                $params[] = sanitizeInput($input[$field]);
            }
        }
    }
    
    // Password update (optional)
    if (isset($input['password']) && !empty($input['password'])) {
        $password = $input['password'];
        
        if (strlen($password) < 8) {
            sendErrorResponse('Password must be at least 8 characters long');
        }
        
        if (!preg_match('/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/', $password)) {
            sendErrorResponse('Password must contain at least one uppercase letter, one lowercase letter, and one number');
        }
        
        $updateFields[] = "password_hash = ?";
        $params[] = hashPassword($password);
    }
    
    if (empty($updateFields)) {
        sendErrorResponse('No fields to update');
    }
    
    // Add updated_at timestamp
    $updateFields[] = "updated_at = NOW()";
    
    // Add ID to params
    $params[] = $id;
    
    try {
        $db->beginTransaction();
        
        $query = "UPDATE users SET " . implode(', ', $updateFields) . " WHERE id = ?";
        $db->execute($query, $params);
        
        // Log activity
        $currentUser = getCurrentUser();
        logActivity($currentUser['id'], 'user_updated', "Updated user ID: {$id}");
        
        $db->commit();
        
        // Return updated user
        $selectQuery = "SELECT id, username, email, full_name, phone, role, is_active, created_at, updated_at, last_login FROM users WHERE id = ?";
        $stmt = $db->execute($selectQuery, [$id]);
        $updatedUser = $stmt->fetch();
        
        sendSuccessResponse($updatedUser, 'User updated successfully');
        
    } catch (Exception $e) {
        $db->rollback();
        
        if (defined('DEBUG_MODE') && DEBUG_MODE) {
            sendErrorResponse('Database error: ' . $e->getMessage());
        } else {
            sendErrorResponse('Failed to update user');
        }
    }
}

/**
 * Handle DELETE requests
 */
function handleDeleteRequest() {
    // Get user ID from URL
    if (!isset($_GET['id'])) {
        sendErrorResponse('User ID is required');
    }
    
    $id = intval($_GET['id']);
    
    if ($id <= 0) {
        sendErrorResponse('Invalid user ID');
    }
    
    // Prevent admin from deleting themselves
    if ($id == $_SESSION['user_id']) {
        sendErrorResponse('Cannot delete your own account');
    }
    
    // Check if user exists
    $db = Database::getInstance();
    $checkQuery = "SELECT * FROM users WHERE id = ?";
    $checkStmt = $db->execute($checkQuery, [$id]);
    $existingUser = $checkStmt->fetch();
    
    if (!$existingUser) {
        sendErrorResponse('User not found', 404);
    }
    
    try {
        $db->beginTransaction();
        
        // Soft delete (set is_active = false)
        $query = "UPDATE users SET is_active = 0, updated_at = NOW() WHERE id = ?";
        $db->execute($query, [$id]);
        
        // Log activity
        $currentUser = getCurrentUser();
        logActivity($currentUser['id'], 'user_deleted', "Deleted user: {$existingUser['username']}");
        
        $db->commit();
        
        sendSuccessResponse(null, 'User deleted successfully');
        
    } catch (Exception $e) {
        $db->rollback();
        
        if (defined('DEBUG_MODE') && DEBUG_MODE) {
            sendErrorResponse('Database error: ' . $e->getMessage());
        } else {
            sendErrorResponse('Failed to delete user');
        }
    }
}
?>

<?php
/**
 * PayCompare - Payment Methods API
 * 
 * RESTful API endpoints for payment method management
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

// Get request URI parts
$requestUri = $_SERVER['REQUEST_URI'];
$uriParts = explode('/', trim($requestUri, '/'));

// Get API endpoint
$endpoint = $uriParts[count($uriParts) - 1] ?? '';

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
    
    // Handle transaction calculation endpoint
    if (isset($_GET['action']) && $_GET['action'] === 'calculate') {
        handleTransactionCalculation();
        return;
    }
    
    // Check if specific payment method is requested
    if (isset($_GET['id'])) {
        $id = sanitizeInput($_GET['id']);
        
        if (!is_numeric($id)) {
            sendErrorResponse('Invalid payment method ID');
        }
        
        $query = "SELECT * FROM payment_methods WHERE id = ? AND is_active = 1";
        $stmt = $db->execute($query, [$id]);
        $paymentMethod = $stmt->fetch();
        
        if (!$paymentMethod) {
            sendErrorResponse('Payment method not found', 404);
        }
        
        sendSuccessResponse($paymentMethod);
    } else {
        // Get all payment methods with optional filters
        $query = "SELECT * FROM payment_methods WHERE is_active = 1";
        $params = [];
        
        // Apply filters
        if (isset($_GET['fee_type'])) {
            $query .= " AND fee_type = ?";
            $params[] = sanitizeInput($_GET['fee_type']);
        }
        
        if (isset($_GET['security_level'])) {
            $query .= " AND security_level = ?";
            $params[] = sanitizeInput($_GET['security_level']);
        }
        
        if (isset($_GET['max_fee'])) {
            $query .= " AND transaction_fee <= ?";
            $params[] = floatval($_GET['max_fee']);
        }
        
        if (isset($_GET['max_speed'])) {
            $query .= " AND speed_value <= ?";
            $params[] = intval($_GET['max_speed']);
        }
        
        // Search functionality
        if (isset($_GET['search'])) {
            $searchTerm = '%' . sanitizeInput($_GET['search']) . '%';
            $query .= " AND (name LIKE ? OR description LIKE ?)";
            $params[] = $searchTerm;
            $params[] = $searchTerm;
        }
        
        // Ordering
        $query .= " ORDER BY name ASC";
        
        // Limiting
        if (isset($_GET['limit'])) {
            $limit = intval($_GET['limit']);
            if ($limit > 0 && $limit <= 100) {
                $query .= " LIMIT ?";
                $params[] = $limit;
            }
        }
        
        $stmt = $db->execute($query, $params);
        $paymentMethods = $stmt->fetchAll();
        
        sendSuccessResponse($paymentMethods);
    }
}

/**
 * Handle transaction calculation
 */
function handleTransactionCalculation() {
    $amount = isset($_GET['amount']) ? floatval($_GET['amount']) : 0;
    
    if ($amount <= 0) {
        sendErrorResponse('Invalid transaction amount');
    }
    
    $db = Database::getInstance();
    
    // Get all active payment methods
    $query = "SELECT * FROM payment_methods WHERE is_active = 1";
    $stmt = $db->execute($query);
    $paymentMethods = $stmt->fetchAll();
    
    $results = [];
    
    foreach ($paymentMethods as $method) {
        $charge = calculateTransactionCharge($method, $amount);
        $finalAmount = $amount + $charge['amount'];
        $percentage = ($charge['amount'] / $amount) * 100;
        
        $results[] = [
            'id' => $method['id'],
            'name' => $method['name'],
            'description' => $method['description'],
            'originalAmount' => $amount,
            'chargeAmount' => $charge['amount'],
            'chargePercentage' => round($percentage, 2),
            'finalAmount' => $finalAmount,
            'chargeType' => $charge['type'],
            'chargeDescription' => $charge['description'],
            'transaction_speed' => $method['transaction_speed'],
            'speed_value' => $method['speed_value'],
            'processing_time' => $method['processing_time'],
            'availability_percentage' => $method['availability_percentage'],
            'security_level' => $method['security_level'],
            'security_score' => $method['security_score'],
            'ease_of_use' => $method['ease_of_use'],
            'ease_score' => $method['ease_score'],
            'uptime_score' => $method['uptime_score'],
            'score' => calculateMethodScore($method, $charge, $amount)
        ];
    }
    
    // Sort by final amount (lowest first)
    usort($results, function($a, $b) {
        return $a['finalAmount'] <=> $b['finalAmount'];
    });
    
    sendSuccessResponse($results);
}

/**
 * Calculate transaction charge for a payment method
 */
function calculateTransactionCharge($method, $amount) {
    $chargeAmount = 0;
    $chargeType = 'fixed';
    $description = '';
    
    switch ($method['fee_type']) {
        case 'fixed':
            $chargeAmount = $method['flat_fee'] ?? $method['transaction_fee'] ?? 0;
            $chargeType = 'fixed';
            $description = $chargeAmount === 0 ? 'Free transaction' : "Fixed fee ₹{$chargeAmount}";
            break;
            
        case 'percentage':
            $chargeAmount = ($amount * ($method['percentage_fee'] ?? $method['transaction_fee'] ?? 0)) / 100;
            $chargeType = 'percentage';
            $description = ($method['percentage_fee'] ?? $method['transaction_fee']) . "% of amount";
            break;
            
        case 'hybrid':
            // Complex logic for hybrid fee types
            if (stripos($method['name'], 'net banking') !== false) {
                // Net Banking: ₹5 below ₹10,000, ₹10 above
                $chargeAmount = $amount <= 10000 ? ($method['flat_fee'] ?? 5) : ($method['flat_fee'] ?? 10);
                $chargeType = 'tiered';
                $description = $amount <= 10000 ? '₹5 for amounts ≤ ₹10,000' : '₹10 for amounts > ₹10,000';
            } else if (stripos($method['name'], 'paytm') !== false && $amount <= 5000) {
                // PayTM: Free up to ₹5000
                $chargeAmount = 0;
                $chargeType = 'conditional';
                $description = 'Free for amounts ≤ ₹5,000';
            } else if (stripos($method['name'], 'amazon') !== false && $amount >= 1000) {
                // Amazon Pay: 1.5% above ₹1000
                $chargeAmount = ($amount * 1.5) / 100;
                $chargeType = 'conditional';
                $description = '1.5% for amounts ≥ ₹1,000';
            } else {
                // Default hybrid logic
                $chargeAmount = ($amount * ($method['percentage_fee'] ?? 0)) / 100 + ($method['flat_fee'] ?? 0);
                $chargeType = 'hybrid';
                $description = ($method['percentage_fee'] ?? 0) . "% + ₹" . ($method['flat_fee'] ?? 0);
            }
            break;
            
        case 'range':
            // Use minimum fee for range types
            $chargeAmount = $method['min_fee'] ?? 0;
            $chargeType = 'minimum';
            $description = "Minimum fee ₹{$chargeAmount}";
            break;
            
        default:
            $chargeAmount = 0;
            $chargeType = 'free';
            $description = 'Free transaction';
    }
    
    // Apply thresholds if specified
    if ($method['min_amount_threshold'] && $amount < $method['min_amount_threshold']) {
        $chargeAmount = 0;
        $chargeType = 'threshold';
        $description = "Free for amounts < ₹{$method['min_amount_threshold']}";
    }
    
    if ($method['max_amount_threshold'] && $amount > $method['max_amount_threshold'] && ($method['percentage_fee'] ?? 0) > 0) {
        $chargeAmount = ($amount * ($method['percentage_fee'] ?? 0)) / 100;
        $chargeType = 'threshold';
        $description = ($method['percentage_fee'] ?? 0) . "% for amounts > ₹{$method['max_amount_threshold']}";
    }
    
    return [
        'amount' => max(0, $chargeAmount),
        'type' => $chargeType,
        'description' => $description
    ];
}

/**
 * Calculate comprehensive score for recommendation engine
 */
function calculateMethodScore($method, $charge, $amount) {
    $score = 0;
    
    // Fee component (40% weight)
    $feeScore = max(0, 100 - ($charge['amount'] / $amount) * 100); // Lower fee = higher score
    $score += $feeScore * 0.4;
    
    // Speed component (25% weight)
    $speedScore = 0;
    if ($method['transaction_speed'] === 'instant') $speedScore = 100;
    else if ($method['speed_value'] <= 60) $speedScore = 80;
    else if ($method['speed_value'] <= 300) $speedScore = 60;
    else if ($method['speed_value'] <= 1800) $speedScore = 40;
    else $speedScore = 20;
    $score += $speedScore * 0.25;
    
    // Availability component (20% weight)
    $availabilityScore = $method['availability_percentage'] ?? 99;
    $score += $availabilityScore * 0.2;
    
    // Security component (15% weight)
    $securityScore = $method['security_score'] ?? 50;
    $score += $securityScore * 0.15;
    
    return round($score);
}

/**
 * Handle POST requests (Create new payment method)
 */
function handlePostRequest() {
    // Check if user is admin
    if (!isAdmin()) {
        sendErrorResponse('Admin access required', 403);
    }
    
    // Get JSON input
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input) {
        sendErrorResponse('Invalid JSON input');
    }
    
    // Validate required fields
    $requiredFields = ['name', 'description', 'fee_type', 'transaction_speed', 'speed_value', 'availability_percentage', 'security_level', 'ease_of_use'];
    
    foreach ($requiredFields as $field) {
        if (!isset($input[$field]) || empty($input[$field])) {
            sendErrorResponse("Field '{$field}' is required");
        }
    }
    
    // Validate fee type and corresponding fields
    $feeType = sanitizeInput($input['fee_type']);
    
    if (!in_array($feeType, ['fixed', 'percentage', 'range'])) {
        sendErrorResponse('Invalid fee type');
    }
    
    if ($feeType === 'fixed' && !isset($input['transaction_fee'])) {
        sendErrorResponse('Transaction fee is required for fixed fee type');
    }
    
    if ($feeType === 'percentage' && !isset($input['transaction_fee'])) {
        sendErrorResponse('Transaction fee percentage is required for percentage fee type');
    }
    
    if ($feeType === 'range' && (!isset($input['min_fee']) || !isset($input['max_fee']))) {
        sendErrorResponse('Both minimum and maximum fees are required for range fee type');
    }
    
    // Validate other fields
    $name = sanitizeInput($input['name']);
    $description = sanitizeInput($input['description']);
    $transactionSpeed = sanitizeInput($input['transaction_speed']);
    $speedValue = intval($input['speed_value']);
    $availabilityPercentage = floatval($input['availability_percentage']);
    $securityLevel = sanitizeInput($input['security_level']);
    $easeOfUse = sanitizeInput($input['ease_of_use']);
    $logoUrl = isset($input['logo_url']) ? sanitizeInput($input['logo_url']) : null;
    $isActive = isset($input['is_active']) ? (bool)$input['is_active'] : true;
    
    // Validate values
    if (!in_array($transactionSpeed, ['instant', 'seconds', 'minutes', 'hours'])) {
        sendErrorResponse('Invalid transaction speed');
    }
    
    if (!in_array($securityLevel, ['low', 'medium', 'high', 'very_high'])) {
        sendErrorResponse('Invalid security level');
    }
    
    if (!in_array($easeOfUse, ['poor', 'fair', 'good', 'excellent'])) {
        sendErrorResponse('Invalid ease of use value');
    }
    
    if ($speedValue < 1) {
        sendErrorResponse('Speed value must be greater than 0');
    }
    
    if ($availabilityPercentage < 0 || $availabilityPercentage > 100) {
        sendErrorResponse('Availability percentage must be between 0 and 100');
    }
    
    // Check if payment method name already exists
    $db = Database::getInstance();
    $checkQuery = "SELECT id FROM payment_methods WHERE name = ?";
    $checkStmt = $db->execute($checkQuery, [$name]);
    
    if ($checkStmt->fetch()) {
        sendErrorResponse('Payment method with this name already exists');
    }
    
    try {
        $db->beginTransaction();
        
        // Insert payment method
        $query = "INSERT INTO payment_methods 
                  (name, description, transaction_fee, fee_type, min_fee, max_fee, 
                   transaction_speed, speed_value, availability_percentage, security_level, 
                   ease_of_use, logo_url, is_active, created_at, updated_at)
                  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())";
        
        $params = [
            $name,
            $description,
            $feeType === 'range' ? floatval($input['min_fee']) : floatval($input['transaction_fee']),
            $feeType,
            $feeType === 'range' ? floatval($input['min_fee']) : null,
            $feeType === 'range' ? floatval($input['max_fee']) : null,
            $transactionSpeed,
            $speedValue,
            $availabilityPercentage,
            $securityLevel,
            $easeOfUse,
            $logoUrl,
            $isActive
        ];
        
        $db->execute($query, $params);
        $paymentMethodId = $db->getLastInsertId();
        
        // Log activity
        $user = getCurrentUser();
        logActivity($user['id'], 'payment_method_created', "Created payment method: {$name}");
        
        $db->commit();
        
        // Return created payment method
        $selectQuery = "SELECT * FROM payment_methods WHERE id = ?";
        $stmt = $db->execute($selectQuery, [$paymentMethodId]);
        $createdMethod = $stmt->fetch();
        
        sendSuccessResponse($createdMethod, 'Payment method created successfully');
        
    } catch (Exception $e) {
        $db->rollback();
        
        if (defined('DEBUG_MODE') && DEBUG_MODE) {
            sendErrorResponse('Database error: ' . $e->getMessage());
        } else {
            sendErrorResponse('Failed to create payment method');
        }
    }
}

/**
 * Handle PUT requests (Update payment method)
 */
function handlePutRequest() {
    // Check if user is admin
    if (!isAdmin()) {
        sendErrorResponse('Admin access required', 403);
    }
    
    // Get payment method ID from URL
    if (!isset($_GET['id'])) {
        sendErrorResponse('Payment method ID is required');
    }
    
    $id = intval($_GET['id']);
    
    if ($id <= 0) {
        sendErrorResponse('Invalid payment method ID');
    }
    
    // Get JSON input
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input) {
        sendErrorResponse('Invalid JSON input');
    }
    
    // Check if payment method exists
    $db = Database::getInstance();
    $checkQuery = "SELECT * FROM payment_methods WHERE id = ?";
    $checkStmt = $db->execute($checkQuery, [$id]);
    $existingMethod = $checkStmt->fetch();
    
    if (!$existingMethod) {
        sendErrorResponse('Payment method not found', 404);
    }
    
    // Build update query dynamically
    $updateFields = [];
    $params = [];
    
    // Updatable fields
    $updatableFields = [
        'name', 'description', 'fee_type', 'transaction_fee', 'min_fee', 'max_fee',
        'transaction_speed', 'speed_value', 'availability_percentage', 'security_level',
        'ease_of_use', 'logo_url', 'is_active'
    ];
    
    foreach ($updatableFields as $field) {
        if (isset($input[$field])) {
            $updateFields[] = "{$field} = ?";
            
            if ($field === 'is_active') {
                $params[] = (bool)$input[$field];
            } elseif (in_array($field, ['transaction_fee', 'min_fee', 'max_fee', 'availability_percentage', 'speed_value'])) {
                $params[] = floatval($input[$field]);
            } else {
                $params[] = sanitizeInput($input[$field]);
            }
        }
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
        
        $query = "UPDATE payment_methods SET " . implode(', ', $updateFields) . " WHERE id = ?";
        $db->execute($query, $params);
        
        // Log activity
        $user = getCurrentUser();
        logActivity($user['id'], 'payment_method_updated', "Updated payment method ID: {$id}");
        
        $db->commit();
        
        // Return updated payment method
        $selectQuery = "SELECT * FROM payment_methods WHERE id = ?";
        $stmt = $db->execute($selectQuery, [$id]);
        $updatedMethod = $stmt->fetch();
        
        sendSuccessResponse($updatedMethod, 'Payment method updated successfully');
        
    } catch (Exception $e) {
        $db->rollback();
        
        if (defined('DEBUG_MODE') && DEBUG_MODE) {
            sendErrorResponse('Database error: ' . $e->getMessage());
        } else {
            sendErrorResponse('Failed to update payment method');
        }
    }
}

/**
 * Handle DELETE requests
 */
function handleDeleteRequest() {
    // Check if user is admin
    if (!isAdmin()) {
        sendErrorResponse('Admin access required', 403);
    }
    
    // Get payment method ID from URL
    if (!isset($_GET['id'])) {
        sendErrorResponse('Payment method ID is required');
    }
    
    $id = intval($_GET['id']);
    
    if ($id <= 0) {
        sendErrorResponse('Invalid payment method ID');
    }
    
    // Check if payment method exists
    $db = Database::getInstance();
    $checkQuery = "SELECT * FROM payment_methods WHERE id = ?";
    $checkStmt = $db->execute($checkQuery, [$id]);
    $existingMethod = $checkStmt->fetch();
    
    if (!$existingMethod) {
        sendErrorResponse('Payment method not found', 404);
    }
    
    try {
        $db->beginTransaction();
        
        // Soft delete (set is_active = false)
        $query = "UPDATE payment_methods SET is_active = 0, updated_at = NOW() WHERE id = ?";
        $db->execute($query, [$id]);
        
        // Log activity
        $user = getCurrentUser();
        logActivity($user['id'], 'payment_method_deleted', "Deleted payment method: {$existingMethod['name']}");
        
        $db->commit();
        
        sendSuccessResponse(null, 'Payment method deleted successfully');
        
    } catch (Exception $e) {
        $db->rollback();
        
        if (defined('DEBUG_MODE') && DEBUG_MODE) {
            sendErrorResponse('Database error: ' . $e->getMessage());
        } else {
            sendErrorResponse('Failed to delete payment method');
        }
    }
}
?>

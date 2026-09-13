<?php
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['ok' => false, 'error' => 'Method not allowed']);
    exit;
}

$configPath = __DIR__ . '/config.php';
if (!file_exists($configPath)) {
    http_response_code(503);
    echo json_encode(['ok' => false, 'error' => 'Not configured']);
    exit;
}

require_once __DIR__ . '/email-tracking.php';

$input = json_decode(file_get_contents('php://input'), true);
$action = $input['action'] ?? 'refund';
$email = isset($input['email']) ? filter_var(trim($input['email']), FILTER_VALIDATE_EMAIL) : false;
$dataDir = __DIR__ . '/data';

if ($action === 'attempt') {
    if (!$email) {
        echo json_encode(['ok' => false, 'skipped' => true]);
        exit;
    }
    $ok = email_mark_refund_attempt($dataDir, $email, (int) ($input['step'] ?? 1), [
        'source' => $input['source'] ?? 'chat',
    ]);
    echo json_encode(['ok' => $ok]);
    exit;
}

if (!$email) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'Invalid email']);
    exit;
}

$ok = email_mark_refund($dataDir, $email, [
    'reason' => $input['reason'] ?? '',
    'protocol' => $input['protocol'] ?? '',
]);

echo json_encode(['ok' => $ok]);

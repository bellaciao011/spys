<?php
/**
 * Read-only client bootstrap — restores progress + first_seen without re-registering.
 * POST { "email": "user@example.com" }
 */
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
    echo json_encode(['ok' => false, 'error' => 'method_not_allowed']);
    exit;
}

require_once __DIR__ . '/subscribers.php';

$input = json_decode(file_get_contents('php://input'), true);
$email = isset($input['email']) ? filter_var(trim($input['email']), FILTER_VALIDATE_EMAIL) : false;

if (!$email) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'invalid_email']);
    exit;
}

$dataDir = __DIR__ . '/data';
$record = get_subscriber($dataDir, $email);

echo json_encode([
    'ok' => true,
    'found' => (bool) $record,
    'email' => $email,
    'client_state' => subscriber_client_state($record ?: []),
    'bootstrap' => $record ? subscriber_panel_bootstrap($record) : null,
]);

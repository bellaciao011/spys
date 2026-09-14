<?php
/**
 * Restore panel session without re-registering or triggering funnel emails.
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

$configPath = __DIR__ . '/config.php';
if (!file_exists($configPath)) {
    http_response_code(503);
    echo json_encode(['ok' => false, 'error' => 'not_configured']);
    exit;
}

require $configPath;
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

if (!$record || !subscriber_has_panel_access($record)) {
    http_response_code(403);
    echo json_encode([
        'ok' => false,
        'error' => 'no_panel_access',
        'message' => 'Use the same email from your purchase or from our emails.',
    ]);
    exit;
}

// Light touch — update last_seen only (no visit counter bump, no emails)
$subs = load_subscribers($dataDir);
$key = strtolower(trim($email));
if (isset($subs[$key])) {
    $subs[$key]['last_seen'] = date('c');
    file_put_contents(subscribers_file($dataDir), json_encode($subs, JSON_PRETTY_PRINT), LOCK_EX);
}

echo json_encode([
    'ok' => true,
    'session' => true,
    'email' => $email,
    'panel_access' => true,
    'bootstrap' => subscriber_panel_bootstrap($record),
    'redirect' => 'app/applications/index.html',
]);

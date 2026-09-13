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
    echo json_encode(['ok' => false, 'error' => 'Email not configured']);
    exit;
}

$config = require $configPath;
$input = json_decode(file_get_contents('php://input'), true);
$email = isset($input['email']) ? filter_var(trim($input['email']), FILTER_VALIDATE_EMAIL) : false;
$panelLogin = !empty($input['panel_login']);

if (!$email) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'Invalid email']);
    exit;
}

require_once __DIR__ . '/subscribers.php';

$dataDir = __DIR__ . '/data';

if ($panelLogin) {
    $record = get_subscriber($dataDir, $email);
    $panelAccess = subscriber_has_panel_access($record ?: []);

    if (!$panelAccess) {
        http_response_code(403);
        echo json_encode([
            'ok' => false,
            'error' => 'email_not_found',
            'message' => 'Use the same email from your purchase or from our emails.',
        ]);
        exit;
    }

    // First panel login only — updates subscriber record once
    save_subscriber($dataDir, $email, [
        'panel_url' => $config['panel_url'] ?? '',
        'ip' => $_SERVER['REMOTE_ADDR'] ?? '',
    ]);
    $record = get_subscriber($dataDir, $email);

    echo json_encode([
        'ok' => true,
        'saved' => true,
        'email' => $email,
        'subscriber' => $record,
        'panel_access' => true,
        'bootstrap' => subscriber_panel_bootstrap($record ?: ['email' => $email]),
        'redirect' => 'app/applications/index.html',
    ]);
    exit;
}

$saved = save_subscriber($dataDir, $email, [
    'panel_url' => $config['panel_url'] ?? '',
    'ip' => $_SERVER['REMOTE_ADDR'] ?? '',
]);

if (!$saved) {
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => 'Could not save subscriber']);
    exit;
}

$record = get_subscriber($dataDir, $email);
$panelAccess = subscriber_has_panel_access($record ?: []);

$response = [
    'ok' => true,
    'saved' => true,
    'email' => $email,
    'subscriber' => $record,
    'panel_access' => $panelAccess,
    'client_state' => subscriber_client_state($record ?: []),
];

if ($panelAccess) {
    $response['bootstrap'] = subscriber_panel_bootstrap($record ?: ['email' => $email]);
    $response['redirect'] = 'app/applications/index.html';
}

echo json_encode($response);

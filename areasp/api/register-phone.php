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

$config = require $configPath;
$input = json_decode(file_get_contents('php://input'), true);

$email = isset($input['email']) ? filter_var(trim($input['email']), FILTER_VALIDATE_EMAIL) : false;
$phoneNumber = isset($input['phone_number']) ? trim((string) $input['phone_number']) : '';
$phoneE164 = isset($input['phone_e164']) ? trim((string) $input['phone_e164']) : '';
$contactName = isset($input['contact_name']) ? trim((string) $input['contact_name']) : '';

if (!$email || (!$phoneNumber && !$phoneE164)) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'Invalid email or phone']);
    exit;
}

require_once __DIR__ . '/subscribers.php';
require_once __DIR__ . '/daily-email-data.php';

$dataDir = __DIR__ . '/data';
$subs = load_subscribers($dataDir);
$key = strtolower($email);

if (!isset($subs[$key])) {
    save_subscriber($dataDir, $email, [
        'panel_url' => $config['panel_url'] ?? '',
        'ip' => $_SERVER['REMOTE_ADDR'] ?? '',
    ]);
    $subs = load_subscribers($dataDir);
}

$subs[$key]['phone_number'] = substr($phoneNumber, 0, 40);
$subs[$key]['phone_e164'] = substr($phoneE164 ?: $phoneNumber, 0, 24);
if ($contactName) {
    $subs[$key]['contact_name'] = substr($contactName, 0, 40);
}
if (empty($subs[$key]['report_id'])) {
    $subs[$key]['report_id'] = daily_report_id($subs[$key]);
}

file_put_contents(subscribers_file($dataDir), json_encode($subs, JSON_PRETTY_PRINT), LOCK_EX);

echo json_encode([
    'ok' => true,
    'report_id' => $subs[$key]['report_id'],
    'phone_saved' => true,
]);

<?php
/**
 * Test SendPulse SMS — do not expose publicly in production.
 * /api/test-send-sms.php?key=CRON_SECRET&phone=15551234567&template=purchase_access&email=test@example.com
 */

header('Content-Type: application/json; charset=utf-8');

$configFile = __DIR__ . '/config.php';
if (!file_exists($configFile)) {
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => 'config_missing']);
    exit;
}

$config = require $configFile;
$cronKey = $config['cron_secret'] ?? '';
if (!$cronKey || ($_GET['key'] ?? '') !== $cronKey) {
    http_response_code(403);
    echo json_encode(['ok' => false, 'error' => 'forbidden']);
    exit;
}

require_once __DIR__ . '/send-sms.php';

$phone = preg_replace('/\D+/', '', (string) ($_GET['phone'] ?? ''));
$template = trim((string) ($_GET['template'] ?? 'purchase_access'));
$email = trim((string) ($_GET['email'] ?? 'test@example.com'));
$country = strtoupper(trim((string) ($_GET['country'] ?? 'US')));

if ($phone === '') {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'phone_required']);
    exit;
}

$result = send_sms($config, $phone, $template, [
    'email' => $email,
    'first_name' => 'Test',
    'checkout_url' => perfectpay_checkout_url($config),
    'country' => $country,
]);

echo json_encode([
    'ok' => !empty($result['ok']),
    'sendpulse_enabled' => sendpulse_enabled($config),
    'template' => $template,
    'phone' => $phone,
    'result' => $result,
], JSON_PRETTY_PRINT);

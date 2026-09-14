<?php
/**
 * Re-send purchase_access to buyers who never received it.
 * /api/resend-pending-purchases.php?key=YOUR_CRON_SECRET
 * Optional: &dry=1 to list only (no send)
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

require_once __DIR__ . '/subscribers.php';
require_once __DIR__ . '/send-mail.php';

$dataDir = __DIR__ . '/data';
$dry = !empty($_GET['dry']);
$max = min(20, max(1, (int) ($_GET['max'] ?? 10)));

$pending = [];
$subs = load_subscribers($dataDir);

foreach ($subs as $email => $sub) {
    $email = strtolower(trim((string) ($sub['email'] ?? $email)));
    if ($email === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
        continue;
    }
    if (empty($sub['purchased']) && empty($sub['perfectpay_sale_code'])) {
        continue;
    }
    if (subscriber_email_was_sent($dataDir, $email, 'purchase_access')) {
        continue;
    }
    $pending[] = [
        'email' => $email,
        'full_name' => $sub['full_name'] ?? '',
        'product_name' => $sub['product_name'] ?? '',
        'product_code' => $sub['product_code'] ?? '',
        'perfectpay_sale_code' => $sub['perfectpay_sale_code'] ?? '',
    ];
}

$result = [
    'ok' => true,
    'dry' => $dry,
    'pending' => count($pending),
    'sent' => 0,
    'errors' => 0,
    'items' => [],
];

if ($dry) {
    $result['list'] = array_slice($pending, 0, 50);
    echo json_encode($result, JSON_PRETTY_PRINT);
    exit;
}

if (empty($config['enabled'])) {
    http_response_code(503);
    echo json_encode(['ok' => false, 'error' => 'email_disabled']);
    exit;
}

foreach (array_slice($pending, 0, $max) as $buyer) {
    $email = $buyer['email'];
    $sent = process_one($config, [
        'template' => 'purchase_access',
        'email' => $email,
        'meta' => $buyer,
    ]);

    if ($sent) {
        subscriber_mark_email_sent($dataDir, $email, 'purchase_access');
        $result['sent']++;
        $result['items'][] = ['email' => $email, 'status' => 'sent'];
    } else {
        $result['errors']++;
        $result['items'][] = ['email' => $email, 'status' => 'failed'];
    }
}

echo json_encode($result, JSON_PRETTY_PRINT);

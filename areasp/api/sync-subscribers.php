<?php
/**
 * One-shot: rebuild subscribers from sent-log + perfectpay sales.
 * /api/sync-subscribers.php?key=YOUR_CRON_SECRET
 */

$configPath = __DIR__ . '/config.php';
if (!file_exists($configPath)) {
    http_response_code(503);
    exit('Not configured');
}

$config = require $configPath;
$cronKey = $config['cron_secret'] ?? '';
if (!$cronKey || ($_GET['key'] ?? '') !== $cronKey) {
    http_response_code(403);
    exit('Forbidden');
}

require_once __DIR__ . '/subscribers.php';

$dataDir = __DIR__ . '/data';
$result = subscribers_sync_from_logs($dataDir);

header('Content-Type: application/json; charset=utf-8');
echo json_encode([
    'ok' => true,
    'restored' => $result['added'],
    'subscribers' => $result['total'],
], JSON_PRETTY_PRINT) . "\n";

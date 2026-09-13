<?php
/**
 * Processes pending funnel emails whose send_after time has passed.
 * Called periodically from the browser while the user is on the panel.
 */
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

$configPath = __DIR__ . '/config.php';
if (!file_exists($configPath)) {
    http_response_code(503);
    echo json_encode(['ok' => false, 'error' => 'Not configured']);
    exit;
}

$config = require $configPath;
if (empty($config['enabled'])) {
    echo json_encode(['ok' => true, 'sent' => 0, 'note' => 'disabled']);
    exit;
}

require_once __DIR__ . '/queue-helpers.php';

$dataDir = __DIR__ . '/data';
$queueFile = $dataDir . '/queue.json';
$logFile = $dataDir . '/sent-log.json';

$sent = flush_ready_queue($config, $queueFile, $logFile, 2, $dataDir);

echo json_encode(['ok' => true, 'sent' => $sent]);

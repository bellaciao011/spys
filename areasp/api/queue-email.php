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
$template = isset($input['template']) ? preg_replace('/[^a-z0-9_]/', '', $input['template']) : '';

$allowed = [
    'welcome', 'phone_registered', 'tracking_done', 'dashboard_ready',
    'report_ready', 'report_reminder', 'unlock_reminder', 'unlock_code_pending',
    'retention', 'high_risk_detected', 'support_intro', 'delivery_proof',
    'analysis_progress', 'daily_progress', 'event_detected', 'weekly_summary'
];
if (!$email || !in_array($template, $allowed, true)) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'Invalid email or template']);
    exit;
}

if (empty($config['enabled'])) {
    echo json_encode(['ok' => true, 'queued' => false, 'note' => 'Email dispatch disabled in config']);
    exit;
}

require_once __DIR__ . '/subscribers.php';
require_once __DIR__ . '/queue-helpers.php';

$dataDir = __DIR__ . '/data';
$queueFile = $dataDir . '/queue.json';
$logFile = $dataDir . '/sent-log.json';

if (!is_dir($dataDir)) {
    mkdir($dataDir, 0755, true);
}

save_subscriber($dataDir, $email, [
    'panel_url' => $config['panel_url'] ?? '',
    'ip' => $_SERVER['REMOTE_ADDR'] ?? '',
]);

if (!queue_rate_limit_ok($logFile, $email, (int) ($config['max_per_hour_per_email'] ?? 8))) {
    http_response_code(429);
    echo json_encode(['ok' => false, 'error' => 'Rate limit exceeded for this email']);
    exit;
}

$jobMeta = [
    'ip' => $_SERVER['REMOTE_ADDR'] ?? '',
    'ua' => substr($_SERVER['HTTP_USER_AGENT'] ?? '', 0, 120),
];

if ($template === 'analysis_progress' && isset($input['meta']) && is_array($input['meta'])) {
    $jobMeta['day_num'] = max(1, min(60, (int) ($input['meta']['day_num'] ?? 1)));
    $jobMeta['pct'] = max(1, min(92, (int) ($input['meta']['pct'] ?? 5)));
    $daysLeft = preg_replace('/[<>"\']/', '', (string) ($input['meta']['days_left'] ?? '10–20 days'));
    $jobMeta['days_left'] = substr($daysLeft, 0, 40);
}

$cronOnly = $config['cron_only_templates'] ?? [
    'daily_progress', 'event_detected', 'weekly_summary', 'analysis_progress',
    'retention', 'high_risk_detected', 'unlock_reminder',
];

$queueResult = queue_atomic_update($queueFile, function (array &$queue) use (
    $email, $template, $logFile, $dataDir, $config, $jobMeta, $cronOnly
) {
    if (email_already_delivered($queue, $logFile, $email, $template, $dataDir, $jobMeta)) {
        return ['duplicate' => true];
    }

    $id = 'em_' . bin2hex(random_bytes(8));
    $sendAt = email_compute_send_after($queue, $logFile, $email, $template, $config);

    $queue[] = [
        'id' => $id,
        'email' => $email,
        'template' => $template,
        'status' => 'pending',
        'created_at' => date('c'),
        'send_after' => date('c', $sendAt),
        'meta' => $jobMeta,
    ];

    save_subscriber($dataDir, $email, ['template' => $template]);

    return [
        'duplicate' => false,
        'id' => $id,
        'send_at' => $sendAt,
        'cron_only' => in_array($template, $cronOnly, true),
    ];
});

if (!$queueResult) {
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => 'Could not update queue']);
    exit;
}

if (!empty($queueResult['duplicate'])) {
    echo json_encode(['ok' => true, 'queued' => false, 'skipped' => true, 'reason' => 'already_sent']);
    exit;
}

$id = $queueResult['id'];
$sendAt = (int) $queueResult['send_at'];

if (!empty($queueResult['cron_only'])) {
    echo json_encode([
        'ok' => true,
        'queued' => true,
        'sent' => false,
        'scheduled' => 'cron',
        'id' => $id,
        'send_after' => date('c', $sendAt),
        'note' => 'Will be sent by hourly cron at staggered time',
    ]);
    exit;
}

ignore_user_abort(true);
$sent = flush_ready_queue($config, $queueFile, $logFile, 1, $dataDir);

echo json_encode([
    'ok' => true,
    'queued' => true,
    'sent' => $sent > 0,
    'id' => $id,
    'send_after' => date('c', $sendAt),
    'delay_seconds' => max(0, $sendAt - time()),
]);

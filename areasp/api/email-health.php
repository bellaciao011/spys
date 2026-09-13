<?php
/**
 * Quick email system status — cron, Resend, PerfectPay webhook.
 * /api/email-health.php?key=YOUR_CRON_SECRET
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
require_once __DIR__ . '/send-sms.php';

$dataDir = __DIR__ . '/data';
$subs = load_subscribers($dataDir);
$pendingPurchases = 0;

foreach ($subs as $email => $sub) {
    $email = strtolower(trim((string) ($sub['email'] ?? $email)));
    if ($email === '') {
        continue;
    }
    $isBuyer = !empty($sub['purchased']) || !empty($sub['perfectpay_sale_code']);
    if ($isBuyer && !subscriber_email_was_sent($dataDir, $email, 'purchase_access')) {
        $pendingPurchases++;
    }
}

$resendErrors = [];
$errorLog = $dataDir . '/resend-errors.log';
if (file_exists($errorLog)) {
    $lines = array_filter(array_map('trim', file($errorLog, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES)));
    $resendErrors = array_slice($lines, -5);
}

$ppLog = $dataDir . '/perfectpay-webhook.log';
$ppRecent = [];
if (file_exists($ppLog)) {
    $lines = array_filter(array_map('trim', file($ppLog, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES)));
    $ppRecent = array_slice($lines, -5);
}

$smsLog = $dataDir . '/sendpulse-sms.log';
$smsRecent = [];
if (file_exists($smsLog)) {
    $lines = array_filter(array_map('trim', file($smsLog, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES)));
    $smsRecent = array_slice($lines, -5);
}

$lockFile = $dataDir . '/cron.lock';
$lockInfo = null;
if (file_exists($lockFile)) {
    $lockInfo = trim((string) file_get_contents($lockFile));
}

$resendQuota = ['quota_exceeded' => false, 'source' => 'log'];
if (!empty($resendErrors)) {
    $last = end($resendErrors);
    if (is_string($last) && (strpos($last, 'code=429') !== false || stripos($last, 'daily email sending quota') !== false)) {
        $resendQuota = [
            'quota_exceeded' => true,
            'source' => 'log',
            'message' => 'You have reached your daily email sending quota.',
        ];
    }
}

$estimatedDailySends = count($subs) * 2;

echo json_encode([
    'ok' => true,
    'date' => date('Y-m-d'),
    'hour' => (int) date('G'),
    'email_enabled' => !empty($config['enabled']),
    'provider' => $config['provider'] ?? 'resend',
    'from_email' => $config['from_email'] ?? '',
    'subscribers' => count($subs),
    'pending_purchase_emails' => $pendingPurchases,
    'perfectpay_webhook_url' => rtrim($config['panel_url'] ?? '', '/') . '/api/perfectpay-webhook.php',
    'perfectpay_token_set' => !empty($config['perfectpay']['webhook_token'] ?? ''),
    'cron_url' => rtrim($config['panel_url'] ?? '', '/') . '/api/cron-hourly.php?key=' . $cronKey,
    'cron_lock' => $lockInfo,
    'resend_errors_recent' => $resendErrors,
    'resend_quota' => $resendQuota,
    'estimated_daily_sends' => $estimatedDailySends,
    'resend_free_limit_hint' => 100,
    'perfectpay_log_recent' => $ppRecent,
    'sms_enabled' => sendpulse_enabled($config),
    'sms_sender' => $config['sendpulse']['sender'] ?? '',
    'sms_checkout_url_set' => perfectpay_checkout_url($config) !== '',
    'sms_log_recent' => $smsRecent,
], JSON_PRETTY_PRINT);

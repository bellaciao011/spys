<?php
/**
 * One-shot Resend diagnostic (does NOT send to real users).
 * /api/test-resend.php?key=YOUR_CRON_SECRET
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

$key = $config['resend_api_key'] ?? '';
if ($key === '') {
    echo json_encode(['ok' => false, 'error' => 'missing_api_key']);
    exit;
}

function resend_probe($apiKey, array $payload) {
    $ch = curl_init('https://api.resend.com/emails');
    curl_setopt_array($ch, [
        CURLOPT_POST => true,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPHEADER => [
            'Authorization: Bearer ' . $apiKey,
            'Content-Type: application/json',
        ],
        CURLOPT_POSTFIELDS => json_encode($payload),
        CURLOPT_TIMEOUT => 20,
    ]);
    $body = curl_exec($ch);
    $code = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $err = curl_error($ch);
    curl_close($ch);

    $decoded = json_decode((string) $body, true);
    return [
        'http' => $code,
        'ok' => $code >= 200 && $code < 300,
        'message' => is_array($decoded) ? ($decoded['message'] ?? $decoded) : substr((string) $body, 0, 300),
        'curl_error' => $err ?: null,
    ];
}

$from = ($config['from_name'] ?? 'Stalkea') . ' <' . ($config['from_email'] ?? '') . '>';
$to = 'delivered@resend.dev';

echo json_encode([
    'ok' => true,
    'from' => $from,
    'reply_to_config' => $config['reply_to'] ?? null,
    'with_reply_to' => resend_probe($key, [
        'from' => $from,
        'to' => [$to],
        'subject' => 'Stalkea Resend probe',
        'html' => '<p>Probe with reply_to</p>',
        'reply_to' => $config['reply_to'] ?? '',
    ]),
    'without_reply_to' => resend_probe($key, [
        'from' => $from,
        'to' => [$to],
        'subject' => 'Stalkea Resend probe',
        'html' => '<p>Probe without reply_to</p>',
    ]),
], JSON_PRETTY_PRINT);

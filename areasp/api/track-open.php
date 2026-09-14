<?php

$configPath = __DIR__ . '/config.php';
if (!file_exists($configPath)) {
    http_response_code(404);
    exit;
}

$config = require $configPath;
require_once __DIR__ . '/email-tracking.php';

$token = $_GET['t'] ?? '';
$template = preg_replace('/[^a-z0-9_]/', '', $_GET['tpl'] ?? 'unknown');
$date = preg_replace('/[^0-9\-]/', '', $_GET['d'] ?? date('Y-m-d'));

$email = '';
if (!empty($_GET['e'])) {
    $decoded = base64_decode($_GET['e'], true);
    if ($decoded && filter_var($decoded, FILTER_VALIDATE_EMAIL)) {
        $email = strtolower($decoded);
    }
}

if (!$email && !empty($_GET['m'])) {
    $subs = load_subscribers(__DIR__ . '/data');
    $hash = $_GET['m'];
    foreach ($subs as $sub) {
        $candidate = strtolower($sub['email'] ?? '');
        if ($candidate && hash_equals(substr(md5($candidate), 0, 12), $hash)) {
            $email = $candidate;
            break;
        }
    }
}

if ($email && $token) {
    $expected = email_tracking_token($email, $template, $date, $config['cron_secret'] ?? 'track');
    if (hash_equals($expected, $token)) {
        email_record_open(__DIR__ . '/data', $email, $template, [
            'ip' => $_SERVER['REMOTE_ADDR'] ?? '',
            'ua' => $_SERVER['HTTP_USER_AGENT'] ?? '',
            'source' => 'pixel',
        ]);
    }
}

header('Content-Type: image/gif');
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('Pragma: no-cache');
echo base64_decode('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7');

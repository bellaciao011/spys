<?php
/**
 * Local preview of the post-purchase email template.
 * Usage: /api/preview-purchase-email.php?key=YOUR_CRON_SECRET
 */

$configFile = __DIR__ . '/config.php';
if (!file_exists($configFile)) {
    http_response_code(500);
    exit('config missing');
}

$config = require $configFile;
$key = $_GET['key'] ?? '';
if ($key === '' || !hash_equals((string) ($config['cron_secret'] ?? ''), $key)) {
    http_response_code(403);
    exit('forbidden');
}

require_once __DIR__ . '/email-templates.php';

$panelUrl = $config['panel_url'] ?? 'https://stalkea.app/areasp';
$tpl = purchase_access_template($panelUrl, [
    'email' => 'customer@example.com',
    'full_name' => 'John Smith',
    'product_name' => 'Stalkea Full Access',
]);

header('Content-Type: text/html; charset=utf-8');
echo $tpl['html'];

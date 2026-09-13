<?php
/**
 * Short link redirect entry point.
 * Root: https://stalkea.app/s  (via public_html/.htaccess)
 * Fallback: https://stalkea.app/areasp/r/s
 */

$configFile = __DIR__ . '/config.php';
if (!file_exists($configFile)) {
    http_response_code(503);
    exit('Unavailable');
}

$config = require $configFile;
require_once __DIR__ . '/short-links.php';

$code = trim((string) ($_GET['c'] ?? ''));
if ($code === '') {
    $path = parse_url($_SERVER['REQUEST_URI'] ?? '', PHP_URL_PATH);
    if (is_string($path) && preg_match('#/(?:r/)?([A-Za-z0-9_-]+)/?$#', $path, $m)) {
        $candidate = $m[1];
        if ($candidate !== 'short-redirect.php' && $candidate !== 'index.php') {
            $code = $candidate;
        }
    }
}

if ($code === '') {
    http_response_code(404);
    exit('Not found');
}

$ref = trim((string) ($_GET['ref'] ?? ''));
$extra = [];
if ($ref !== '') {
    $extra['ref'] = $ref;
}

$destination = short_link_destination($config, $code, $extra);
if (!$destination) {
    http_response_code(404);
    exit('Not found');
}

$dataDir = __DIR__ . '/data';
short_link_log_click($dataDir, $code, [
    'ref' => $ref,
    'ip' => $_SERVER['REMOTE_ADDR'] ?? '',
]);

header('Cache-Control: no-store, no-cache, must-revalidate');
header('Location: ' . $destination, true, 302);
exit;

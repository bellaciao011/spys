<?php
/**
 * SendPulse SMS — https://sendpulse.com/integrations/api/bulk-sms
 */

require_once __DIR__ . '/short-links.php';

function sendpulse_config(array $config) {
    return is_array($config['sendpulse'] ?? null) ? $config['sendpulse'] : [];
}

function sendpulse_enabled(array $config) {
    $sp = sendpulse_config($config);
    if (empty($sp['enabled'])) {
        return false;
    }
    if (!empty($sp['api_key'])) {
        return true;
    }
    return !empty($sp['client_id']) && !empty($sp['client_secret']);
}

function sendpulse_token_cache_file($dataDir) {
    return rtrim($dataDir, '/\\') . '/sendpulse-token.json';
}

function sendpulse_get_token(array $config, $dataDir) {
    $sp = sendpulse_config($config);
    if (!empty($sp['api_key'])) {
        return $sp['api_key'];
    }

    $cacheFile = sendpulse_token_cache_file($dataDir);
    if (file_exists($cacheFile)) {
        $cached = json_decode(file_get_contents($cacheFile), true);
        if (is_array($cached) && !empty($cached['access_token']) && !empty($cached['expires_at'])) {
            if (time() < ((int) $cached['expires_at'] - 120)) {
                return $cached['access_token'];
            }
        }
    }

    $clientId = trim((string) ($sp['client_id'] ?? ''));
    $clientSecret = trim((string) ($sp['client_secret'] ?? ''));
    if ($clientId === '' || $clientSecret === '') {
        return null;
    }

    $ch = curl_init('https://api.sendpulse.com/oauth/access_token');
    curl_setopt_array($ch, [
        CURLOPT_POST => true,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPHEADER => ['Content-Type: application/json'],
        CURLOPT_POSTFIELDS => json_encode([
            'grant_type' => 'client_credentials',
            'client_id' => $clientId,
            'client_secret' => $clientSecret,
        ]),
        CURLOPT_TIMEOUT => 20,
    ]);
    $body = curl_exec($ch);
    $code = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($code < 200 || $code >= 300) {
        sendpulse_log($dataDir, 'token_failed code=' . $code . ' body=' . substr((string) $body, 0, 200));
        return null;
    }

    $decoded = json_decode($body, true);
    if (!is_array($decoded) || empty($decoded['access_token'])) {
        sendpulse_log($dataDir, 'token_invalid body=' . substr((string) $body, 0, 200));
        return null;
    }

    if (!is_dir($dataDir)) {
        mkdir($dataDir, 0755, true);
    }
    file_put_contents($cacheFile, json_encode([
        'access_token' => $decoded['access_token'],
        'expires_at' => time() + (int) ($decoded['expires_in'] ?? 3600),
    ], JSON_PRETTY_PRINT), LOCK_EX);

    return $decoded['access_token'];
}

function sendpulse_log($dataDir, $line) {
    if (!is_dir($dataDir)) {
        mkdir($dataDir, 0755, true);
    }
    $file = rtrim($dataDir, '/\\') . '/sendpulse-sms.log';
    file_put_contents($file, date('c') . ' ' . $line . PHP_EOL, FILE_APPEND | LOCK_EX);
}

/** Normalize PerfectPay customer phone to E.164 digits (no +). */
function perfectpay_customer_phone(array $customer) {
    $area = preg_replace('/\D+/', '', (string) ($customer['phone_area_code'] ?? ''));
    $number = preg_replace('/\D+/', '', (string) ($customer['phone_number'] ?? ''));
    if ($number === '') {
        return null;
    }

    $country = strtoupper(trim((string) ($customer['country'] ?? '')));
    $digits = $area . $number;

    if ($country === 'BR' || $country === 'BRA') {
        $digits = ltrim($digits, '0');
        if (strpos($digits, '55') !== 0) {
            $digits = '55' . $digits;
        }
        return $digits;
    }

    if (in_array($country, ['US', 'USA', 'CA', 'CAN'], true)) {
        if (strlen($digits) === 10) {
            return '1' . $digits;
        }
        if (strlen($digits) === 11 && $digits[0] === '1') {
            return $digits;
        }
        return $digits;
    }

    if (in_array($country, ['AU', 'AUS'], true)) {
        $digits = ltrim($digits, '0');
        if (strpos($digits, '61') !== 0) {
            $digits = '61' . $digits;
        }
        return $digits;
    }

    if (in_array($country, ['GB', 'UK', 'GBR'], true)) {
        $digits = ltrim($digits, '0');
        if (strpos($digits, '44') !== 0) {
            $digits = '44' . $digits;
        }
        return $digits;
    }

    // Generic: if number already looks international (12+ digits), keep it.
    if (strlen($digits) >= 11) {
        return $digits;
    }

    return null;
}

function sms_template_body($template, array $vars, array $config) {
    $brand = $config['brand_name'] ?? 'Stalkea';
    $panel = rtrim($config['panel_url'] ?? 'https://stalkea.app/areasp', '/');
    $email = $vars['email'] ?? '';

    $custom = sendpulse_config($config)['templates'][$template] ?? null;
    if (is_string($custom) && $custom !== '') {
        $out = $custom;
        foreach ($vars as $key => $value) {
            $out = str_replace('{' . $key . '}', (string) $value, $out);
        }
        $out = str_replace('{brand}', $brand, $out);
        $out = str_replace('{panel_url}', $panel, $out);
        return $out;
    }

    switch ($template) {
        case 'purchase_access':
            return $brand . ': Access ready. Panel: ' . $panel . '/ Login: ' . $email . ' Support: suporte@stalkea.app';

        default:
            return null;
    }
}

function sendpulse_route_for_country(array $config, $country) {
    $sp = sendpulse_config($config);
    $routes = $sp['routes'] ?? [];
    $country = strtoupper(trim((string) $country));
    if ($country !== '' && !empty($routes[$country])) {
        return $routes[$country];
    }
    if (!empty($sp['default_route'])) {
        return $sp['default_route'];
    }
    return null;
}

function send_sms(array $config, $phone, $template, array $vars = []) {
    $dataDir = __DIR__ . '/data';
    if (!sendpulse_enabled($config)) {
        return ['ok' => false, 'error' => 'sms_disabled'];
    }

    $phone = preg_replace('/\D+/', '', (string) $phone);
    if ($phone === '' || strlen($phone) < 8) {
        return ['ok' => false, 'error' => 'invalid_phone'];
    }

    $body = sms_template_body($template, $vars, $config);
    if ($body === null || $body === '') {
        return ['ok' => false, 'error' => 'unknown_template'];
    }

    $sp = sendpulse_config($config);
    $sender = substr((string) ($sp['sender'] ?? 'Stalkea'), 0, 11);
    $token = sendpulse_get_token($config, $dataDir);
    if (!$token) {
        return ['ok' => false, 'error' => 'auth_failed'];
    }

    $payload = [
        'sender' => $sender,
        'phones' => [$phone],
        'body' => $body,
        'emulate' => !empty($sp['test_mode']),
    ];

    $route = sendpulse_route_for_country($config, $vars['country'] ?? '');
    if ($route) {
        $country = strtoupper(trim((string) ($vars['country'] ?? '')));
        if ($country !== '') {
            $payload['route'] = [$country => $route];
        } else {
            $payload['route'] = ['default' => $route];
        }
    }

    $ch = curl_init('https://api.sendpulse.com/sms/send');
    curl_setopt_array($ch, [
        CURLOPT_POST => true,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPHEADER => [
            'Authorization: Bearer ' . $token,
            'Content-Type: application/json',
        ],
        CURLOPT_POSTFIELDS => json_encode($payload),
        CURLOPT_TIMEOUT => 25,
    ]);
    $response = curl_exec($ch);
    $code = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    $ok = $code >= 200 && $code < 300;
    if (!$ok) {
        sendpulse_log($dataDir, 'send_failed template=' . $template . ' phone=' . $phone . ' code=' . $code . ' body=' . substr((string) $response, 0, 300));
        return ['ok' => false, 'error' => 'send_failed', 'http_code' => $code, 'response' => $response];
    }

    sendpulse_log($dataDir, 'sent template=' . $template . ' phone=' . $phone);
    return ['ok' => true, 'template' => $template, 'phone' => $phone, 'response' => json_decode($response, true)];
}

function subscriber_sms_was_sent($dataDir, $email, $template) {
    require_once __DIR__ . '/subscribers.php';
    $sub = get_subscriber($dataDir, $email);
    if (!$sub || empty($sub['sms_sent']) || !is_array($sub['sms_sent'])) {
        return false;
    }
    return !empty($sub['sms_sent'][$template]);
}

function subscriber_mark_sms_sent($dataDir, $email, $template, $phone = '') {
    require_once __DIR__ . '/subscribers.php';
    $email = strtolower(trim($email));
    if ($email === '') {
        return false;
    }

    $subs = load_subscribers($dataDir);
    if (!isset($subs[$email])) {
        return false;
    }

    if (!isset($subs[$email]['sms_sent']) || !is_array($subs[$email]['sms_sent'])) {
        $subs[$email]['sms_sent'] = [];
    }
    $subs[$email]['sms_sent'][$template] = date('c');
    if ($phone !== '') {
        $subs[$email]['phone_e164'] = preg_replace('/\D+/', '', $phone);
    }

    file_put_contents(subscribers_file($dataDir), json_encode($subs, JSON_PRETTY_PRINT), LOCK_EX);
    return true;
}

function perfectpay_checkout_url(array $config, $productCode = '') {
    $pp = is_array($config['perfectpay'] ?? null) ? $config['perfectpay'] : [];
    $productCode = trim((string) $productCode);
    $map = $pp['checkout_urls'] ?? [];
    if ($productCode !== '' && !empty($map[$productCode])) {
        return trim((string) $map[$productCode]);
    }
    return trim((string) ($pp['checkout_url'] ?? ''));
}

function purchase_first_name_from_meta(array $meta) {
    if (!empty($meta['first_name'])) {
        return trim((string) $meta['first_name']);
    }
    $full = trim((string) ($meta['full_name'] ?? ''));
    if ($full === '') {
        return 'there';
    }
    $parts = preg_split('/\s+/', $full);
    return $parts[0] ?: 'there';
}

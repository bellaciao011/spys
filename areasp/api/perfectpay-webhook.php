<?php
/**
 * PerfectPay webhook — purchase access only (email + SMS).
 * Sem recuperação de carrinho e sem verificação/lookup de e-mail do checkout.
 *
 * Docs: https://help.perfectpay.com.br/article/597-integracao-via-webhook-com-a-perfect-pay
 *
 * Webhook URL (configure in PerfectPay):
 *   https://stalkea.app/areasp/api/perfectpay-webhook.php
 *
 * Enable events in PerfectPay:
 *   - Venda aprovada (2, 8, 10)
 */

header('Content-Type: application/json; charset=utf-8');

$configFile = __DIR__ . '/config.php';
if (!file_exists($configFile)) {
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => 'config_missing']);
    exit;
}

$config = require $configFile;
$pp = $config['perfectpay'] ?? [];
$dataDir = __DIR__ . '/data';

require_once __DIR__ . '/subscribers.php';
require_once __DIR__ . '/send-mail.php';
require_once __DIR__ . '/send-sms.php';

function perfectpay_json_response($code, array $payload) {
    http_response_code($code);
    echo json_encode($payload);
    exit;
}

function perfectpay_sales_file($dataDir) {
    return rtrim($dataDir, '/\\') . '/perfectpay-sales.json';
}

function perfectpay_sale_processed($dataDir, $saleCode) {
    $file = perfectpay_sales_file($dataDir);
    if (!file_exists($file)) {
        return false;
    }
    $data = json_decode(file_get_contents($file), true);
    return is_array($data) && !empty($data[$saleCode]);
}

function perfectpay_mark_sale($dataDir, $saleCode, array $record) {
    if (!is_dir($dataDir)) {
        mkdir($dataDir, 0755, true);
    }
    $file = perfectpay_sales_file($dataDir);
    $data = [];
    if (file_exists($file)) {
        $decoded = json_decode(file_get_contents($file), true);
        if (is_array($decoded)) {
            $data = $decoded;
        }
    }
    $data[$saleCode] = $record;
    file_put_contents($file, json_encode($data, JSON_PRETTY_PRINT), LOCK_EX);
}

function perfectpay_log($dataDir, $line) {
    if (!is_dir($dataDir)) {
        mkdir($dataDir, 0755, true);
    }
    $file = rtrim($dataDir, '/\\') . '/perfectpay-webhook.log';
    file_put_contents($file, date('c') . ' ' . $line . PHP_EOL, FILE_APPEND | LOCK_EX);
}

function perfectpay_product_allowed(array $pp, $productCode) {
    $productCodes = $pp['product_codes'] ?? [];
    if (!is_array($productCodes) || count($productCodes) === 0) {
        return true;
    }
    $allowed = array_map('strval', $productCodes);
    return $productCode !== '' && in_array($productCode, $allowed, true);
}

function perfectpay_handle_purchase(array $config, $dataDir, array $pp, array $payload) {
    $saleCode = trim((string) ($payload['code'] ?? ''));
    $status = (int) ($payload['sale_status_enum'] ?? -1);
    $customer = is_array($payload['customer'] ?? null) ? $payload['customer'] : [];
    $product = is_array($payload['product'] ?? null) ? $payload['product'] : [];
    $email = strtolower(trim((string) ($customer['email'] ?? '')));
    $productCode = trim((string) ($product['code'] ?? ''));
    $productName = trim((string) ($product['name'] ?? ''));
    $fullName = trim((string) ($customer['full_name'] ?? ''));
    $phone = perfectpay_customer_phone($customer);

    if ($saleCode === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
        perfectpay_log($dataDir, 'missing_data sale=' . $saleCode . ' email=' . $email);
        perfectpay_json_response(422, ['ok' => false, 'error' => 'missing_sale_or_email']);
    }

    if (perfectpay_sale_processed($dataDir, $saleCode)) {
        perfectpay_json_response(200, [
            'ok' => true,
            'duplicate' => true,
            'sale_code' => $saleCode,
        ]);
    }

    $emailAlreadySent = subscriber_email_was_sent($dataDir, $email, 'purchase_access');
    $smsAlreadySent = subscriber_sms_was_sent($dataDir, $email, 'purchase_access');

    if ($emailAlreadySent && $smsAlreadySent) {
        perfectpay_mark_sale($dataDir, $saleCode, [
            'email' => $email,
            'sent_at' => date('c'),
            'skipped' => true,
            'reason' => 'purchase_access_already_sent',
            'sale_status_enum' => $status,
        ]);
        perfectpay_json_response(200, [
            'ok' => true,
            'duplicate' => true,
            'reason' => 'purchase_access_already_sent',
            'sale_code' => $saleCode,
        ]);
    }

    if (empty($config['enabled']) && !$smsAlreadySent && !sendpulse_enabled($config)) {
        perfectpay_json_response(503, ['ok' => false, 'error' => 'notifications_disabled']);
    }

    $purchaseDate = trim((string) ($payload['date_approved'] ?? $payload['date_created'] ?? ''));
    if ($purchaseDate === '') {
        $purchaseDate = date('c');
    }

    save_subscriber($dataDir, $email, [
        'purchased' => true,
        'purchase_date' => $purchaseDate,
        'perfectpay_sale_code' => $saleCode,
        'product_name' => $productName,
        'product_code' => $productCode,
        'full_name' => $fullName,
        'phone_e164' => $phone ?: null,
        'panel_url' => $config['panel_url'] ?? '',
    ]);

    $emailSent = false;
    $smsSent = false;
    $smsResult = null;

    if (!$emailAlreadySent && !empty($config['enabled'])) {
        $emailSent = process_one($config, [
            'template' => 'purchase_access',
            'email' => $email,
            'meta' => [
                'email' => $email,
                'full_name' => $fullName,
                'product_name' => $productName,
                'product_code' => $productCode,
                'perfectpay_sale_code' => $saleCode,
            ],
        ]);
        if ($emailSent) {
            subscriber_mark_email_sent($dataDir, $email, 'purchase_access');
        }
    } elseif ($emailAlreadySent) {
        $emailSent = true;
    }

    if (!$smsAlreadySent && $phone && sendpulse_enabled($config)) {
        $smsResult = send_sms($config, $phone, 'purchase_access', [
            'email' => $email,
            'full_name' => $fullName,
            'first_name' => purchase_first_name_from_meta(['full_name' => $fullName]),
            'country' => strtoupper(trim((string) ($customer['country'] ?? ''))),
        ]);
        if (!empty($smsResult['ok'])) {
            subscriber_mark_sms_sent($dataDir, $email, 'purchase_access', $phone);
            $smsSent = true;
        }
    }

    if (!$emailSent && !$smsSent) {
        perfectpay_log($dataDir, 'send_failed sale=' . $saleCode . ' email=' . $email . ' sms=' . json_encode($smsResult));
        perfectpay_json_response(500, ['ok' => false, 'error' => 'send_failed', 'sale_code' => $saleCode, 'sms' => $smsResult]);
    }

    perfectpay_mark_sale($dataDir, $saleCode, [
        'email' => $email,
        'phone' => $phone,
        'product_code' => $productCode,
        'product_name' => $productName,
        'sale_status_enum' => $status,
        'email_sent' => $emailSent,
        'sms_sent' => $smsSent,
        'sent_at' => date('c'),
    ]);

    perfectpay_log($dataDir, 'sent purchase_access sale=' . $saleCode . ' email=' . $email . ' email_sent=' . ($emailSent ? '1' : '0') . ' sms_sent=' . ($smsSent ? '1' : '0'));

    perfectpay_json_response(200, [
        'ok' => true,
        'sent' => true,
        'sale_code' => $saleCode,
        'email' => $email,
        'email_sent' => $emailSent,
        'sms_sent' => $smsSent,
    ]);
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    perfectpay_json_response(405, ['ok' => false, 'error' => 'method_not_allowed']);
}

$raw = file_get_contents('php://input');
$payload = json_decode($raw, true);
if (!is_array($payload)) {
    perfectpay_log($dataDir, 'invalid_json');
    perfectpay_json_response(400, ['ok' => false, 'error' => 'invalid_json']);
}

$expectedToken = trim((string) ($pp['webhook_token'] ?? ''));
$receivedToken = trim((string) ($payload['token'] ?? ''));
if ($expectedToken === '' || !hash_equals($expectedToken, $receivedToken)) {
    perfectpay_log($dataDir, 'invalid_token sale=' . ($payload['code'] ?? '?'));
    perfectpay_json_response(403, ['ok' => false, 'error' => 'invalid_token']);
}

$saleCode = trim((string) ($payload['code'] ?? ''));
$status = (int) ($payload['sale_status_enum'] ?? -1);
$product = is_array($payload['product'] ?? null) ? $payload['product'] : [];
$productCode = trim((string) ($product['code'] ?? ''));

if (!perfectpay_product_allowed($pp, $productCode)) {
    perfectpay_json_response(200, [
        'ok' => true,
        'ignored' => true,
        'reason' => 'product_not_allowed',
        'product_code' => $productCode,
    ]);
}

$approvedStatuses = $pp['approved_statuses'] ?? [2, 8, 10];

if (in_array($status, $approvedStatuses, true)) {
    perfectpay_handle_purchase($config, $dataDir, $pp, $payload);
}

perfectpay_json_response(200, [
    'ok' => true,
    'ignored' => true,
    'reason' => 'status_not_handled',
    'sale_status_enum' => $status,
    'sale_code' => $saleCode,
]);

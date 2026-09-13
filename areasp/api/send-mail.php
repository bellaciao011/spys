<?php

require_once __DIR__ . '/email-templates.php';
require_once __DIR__ . '/subscribers.php';
require_once __DIR__ . '/daily-email-data.php';
require_once __DIR__ . '/email-tracking.php';

function process_one(array $config, array $job) {
    $panelUrl = $config['panel_url'] ?? '';
    $template = $job['template'] ?? '';
    $email = $job['email'] ?? '';
    $meta = $job['meta'] ?? [];
    $dataDir = __DIR__ . '/data';
    $sub = $email ? (get_subscriber($dataDir, $email) ?? []) : [];
    $merged = array_merge($sub, ['email' => $email]);

    if ($template === 'daily_progress' || $template === 'analysis_progress') {
        $built = daily_build_progress_meta($merged);
        daily_persist_report_id($dataDir, $email, $built['report_id']);
        $tpl = daily_progress_template($panelUrl, $built);
    } elseif ($template === 'event_detected') {
        $slot = max(1, (int) ($meta['slot'] ?? 1));
        $built = daily_build_event_meta($merged, $slot);
        daily_persist_report_id($dataDir, $email, $built['report_id']);
        $tpl = event_detected_template($panelUrl, $built);
    } elseif ($template === 'weekly_summary') {
        $built = daily_build_weekly_meta($merged);
        daily_persist_report_id($dataDir, $email, $built['report_id']);
        $tpl = weekly_summary_template($panelUrl, $built);
    } elseif ($template === 'analysis_progress_legacy') {
        $tpl = analysis_progress_template($panelUrl, $meta);
    } elseif ($template === 'purchase_access') {
        $tpl = purchase_access_template($panelUrl, array_merge($merged, $meta));
    } else {
        $templates = email_templates($panelUrl);
        $tpl = $templates[$template] ?? null;
    }

    if (!$tpl) {
        return false;
    }

    $trackTemplates = ['daily_progress', 'event_detected', 'weekly_summary', 'analysis_progress'];
    if (in_array($template, $trackTemplates, true) && $email) {
        $tpl['html'] = email_append_tracking_pixel(
            $tpl['html'],
            email_tracking_url($config, $email, $template)
        );
    }

    $sendConfig = $config;
    if (in_array($template, ['daily_progress', 'event_detected', 'weekly_summary', 'analysis_progress'], true)) {
        $sendConfig['from_name'] = $config['brand_name_ai'] ?? ($config['from_name'] ?? 'Stalkea') . ' AI';
    }

    $provider = $config['provider'] ?? 'resend';

    if ($provider === 'resend') {
        return send_via_resend($sendConfig, $email, $tpl['subject'], $tpl['html']);
    }
    if ($provider === 'brevo') {
        return send_via_brevo($sendConfig, $email, $tpl['subject'], $tpl['html']);
    }

    return false;
}

function send_via_resend(array $config, $to, $subject, $html) {
    $key = $config['resend_api_key'] ?? '';
    if (!$key) {
        return false;
    }

    $payload = [
        'from' => ($config['from_name'] ?? 'Stalkea') . ' <' . ($config['from_email'] ?? 'noreply@example.com') . '>',
        'to' => [$to],
        'subject' => $subject,
        'html' => $html,
    ];

    if (!empty($config['reply_to'])) {
        $payload['reply_to'] = $config['reply_to'];
    }

    $ch = curl_init('https://api.resend.com/emails');
    curl_setopt_array($ch, [
        CURLOPT_POST => true,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPHEADER => [
            'Authorization: Bearer ' . $key,
            'Content-Type: application/json',
        ],
        CURLOPT_POSTFIELDS => json_encode($payload),
        CURLOPT_TIMEOUT => 20,
    ]);
    $body = curl_exec($ch);
    $code = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    $ok = $code >= 200 && $code < 300;
    if (!$ok) {
        resend_log_error($to, $subject, $code, $body);
        if ($code === 429) {
            $GLOBALS['resend_quota_exceeded'] = true;
        }
    }

    return $ok;
}

function resend_quota_exceeded() {
    return !empty($GLOBALS['resend_quota_exceeded']);
}

function resend_log_error($to, $subject, $code, $body) {
    $dir = __DIR__ . '/data';
    if (!is_dir($dir)) {
        mkdir($dir, 0755, true);
    }
    $line = date('c') . ' to=' . $to . ' code=' . $code . ' subject=' . substr($subject, 0, 80);
    if ($body !== false && $body !== '') {
        $decoded = json_decode($body, true);
        $msg = is_array($decoded) ? ($decoded['message'] ?? json_encode($decoded)) : substr((string) $body, 0, 200);
        $line .= ' resend=' . $msg;
    }
    file_put_contents($dir . '/resend-errors.log', $line . PHP_EOL, FILE_APPEND | LOCK_EX);
}

function send_via_brevo(array $config, $to, $subject, $html) {
    $key = $config['brevo_api_key'] ?? '';
    if (!$key) {
        return false;
    }

    $payload = [
        'sender' => [
            'name' => $config['from_name'] ?? 'Stalkea',
            'email' => $config['from_email'] ?? 'noreply@example.com',
        ],
        'to' => [['email' => $to]],
        'subject' => $subject,
        'htmlContent' => $html,
    ];

    $ch = curl_init('https://api.brevo.com/v3/smtp/email');
    curl_setopt_array($ch, [
        CURLOPT_POST => true,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPHEADER => [
            'api-key: ' . $key,
            'Content-Type: application/json',
        ],
        CURLOPT_POSTFIELDS => json_encode($payload),
        CURLOPT_TIMEOUT => 20,
    ]);
    curl_exec($ch);
    $code = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    return $code >= 200 && $code < 300;
}

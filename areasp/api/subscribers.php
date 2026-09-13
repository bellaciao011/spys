<?php

function subscribers_file($dataDir) {
    return rtrim($dataDir, '/\\') . '/subscribers.json';
}

function load_subscribers($dataDir) {
    $file = subscribers_file($dataDir);
    if (!file_exists($file)) {
        return [];
    }
    $data = json_decode(file_get_contents($file), true);
    return is_array($data) ? $data : [];
}

function save_subscriber($dataDir, $email, array $extra = []) {
    $email = strtolower(trim($email));
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        return false;
    }

    if (!is_dir($dataDir)) {
        mkdir($dataDir, 0755, true);
    }

    $subs = load_subscribers($dataDir);
    $key = $email;
    $now = date('c');

    if (!isset($subs[$key])) {
        $subs[$key] = [
            'email' => $email,
            'first_seen' => $now,
            'last_seen' => $now,
            'templates' => [],
            'visits' => 1,
        ];
    } else {
        $subs[$key]['last_seen'] = $now;
        $subs[$key]['visits'] = ($subs[$key]['visits'] ?? 0) + 1;
    }

    if (!empty($extra['template'])) {
        $tpl = $extra['template'];
        if (!in_array($tpl, $subs[$key]['templates'], true)) {
            $subs[$key]['templates'][] = $tpl;
        }
    }

    if (!empty($extra['panel_url'])) {
        $subs[$key]['panel_url'] = $extra['panel_url'];
    }

    if (!empty($extra['ip'])) {
        $subs[$key]['last_ip'] = $extra['ip'];
    }

    foreach (['full_name', 'purchased', 'purchase_date', 'perfectpay_sale_code', 'product_name', 'product_code', 'phone_e164', 'phone_number', 'contact_name'] as $field) {
        if (array_key_exists($field, $extra) && $extra[$field] !== '' && $extra[$field] !== null) {
            $subs[$key][$field] = $extra[$field];
        }
    }

    if (empty($subs[$key]['analysis_start'])) {
        $subs[$key]['analysis_start'] = $subs[$key]['first_seen'] ?? $now;
    }

    file_put_contents(subscribers_file($dataDir), json_encode($subs, JSON_PRETTY_PRINT), LOCK_EX);
    return true;
}

function get_subscriber($dataDir, $email) {
    $subs = load_subscribers($dataDir);
    $key = strtolower(trim($email));
    return $subs[$key] ?? null;
}

function subscriber_email_was_sent($dataDir, $email, $template) {
    $sub = get_subscriber($dataDir, $email);
    if (!$sub) {
        return false;
    }
    if (!empty($sub['emails_sent'][$template])) {
        return true;
    }
    return !empty($sub['funnel_sent'][$template]);
}

function subscriber_mark_email_sent($dataDir, $email, $template) {
    $email = strtolower(trim($email));
    if (!$email) {
        return false;
    }

    $subs = load_subscribers($dataDir);
    if (!isset($subs[$email])) {
        return false;
    }

    if (!isset($subs[$email]['emails_sent']) || !is_array($subs[$email]['emails_sent'])) {
        $subs[$email]['emails_sent'] = [];
    }

    $subs[$email]['emails_sent'][$template] = date('c');

    if (in_array($template, ['welcome', 'phone_registered', 'tracking_done', 'dashboard_ready', 'support_intro'], true)) {
        if (!isset($subs[$email]['funnel_sent']) || !is_array($subs[$email]['funnel_sent'])) {
            $subs[$email]['funnel_sent'] = [];
        }
        $subs[$email]['funnel_sent'][$template] = date('c');
    }

    file_put_contents(subscribers_file($dataDir), json_encode($subs, JSON_PRETTY_PRINT), LOCK_EX);
    return true;
}

function subscriber_mark_funnel_sent($dataDir, $email, $template) {
    return subscriber_mark_email_sent($dataDir, $email, $template);
}

/** Email / purchase customers — skip onboarding funnel (map, collect-phone). */
function subscriber_has_panel_access(array $sub) {
    if (empty($sub) || !is_array($sub)) {
        return false;
    }
    if (!empty($sub['purchased']) || !empty($sub['perfectpay_sale_code'])) {
        return true;
    }
    if (!empty($sub['restored_from'])) {
        return true;
    }
    if (!empty($sub['cron']) && is_array($sub['cron']) && count($sub['cron']) > 0) {
        return true;
    }
    if (!empty($sub['emails_sent']) && is_array($sub['emails_sent']) && count($sub['emails_sent']) > 0) {
        return true;
    }
    $templates = $sub['templates'] ?? [];
    if (is_array($templates)) {
        foreach (['daily_progress', 'event_detected', 'purchase_access', 'weekly_summary'] as $tpl) {
            if (in_array($tpl, $templates, true)) {
                return true;
            }
        }
    }
    return false;
}

/** Phone + report data for panel dashboard (matches daily emails). */
function subscriber_panel_bootstrap(array $sub) {
    if (!function_exists('daily_report_id')) {
        require_once __DIR__ . '/daily-email-data.php';
    }
    $phone = daily_phone_display($sub);
    return [
        'phone_number' => $phone,
        'phone_e164' => !empty($sub['phone_e164']) ? $sub['phone_e164'] : $phone,
        'report_id' => daily_report_id($sub),
    ];
}

/** Browser sync — progress bar + analysis day count (server is source of truth). */
function subscriber_client_state(array $sub) {
    if (empty($sub) || !is_array($sub)) {
        return [
            'first_seen' => null,
            'analysis_start' => null,
            'progress' => ['login' => false, 'phone' => false, 'track' => false, 'apps' => false],
            'emails_sent' => [],
        ];
    }

    $sent = [];
    if (!empty($sub['emails_sent']) && is_array($sub['emails_sent'])) {
        $sent = array_keys($sub['emails_sent']);
    }
    if (!empty($sub['funnel_sent']) && is_array($sub['funnel_sent'])) {
        $sent = array_values(array_unique(array_merge($sent, array_keys($sub['funnel_sent']))));
    }

    $hasPhone = !empty($sub['phone_e164'])
        || (!empty($sub['phone_number']) && strpos((string) $sub['phone_number'], '****') === false);

    return [
        'first_seen' => $sub['first_seen'] ?? null,
        'analysis_start' => $sub['analysis_start'] ?? $sub['first_seen'] ?? null,
        'progress' => [
            'login' => true,
            'phone' => $hasPhone || in_array('phone_registered', $sent, true),
            'track' => in_array('tracking_done', $sent, true),
            'apps' => in_array('dashboard_ready', $sent, true),
        ],
        'emails_sent' => $sent,
    ];
}

/**
 * Re-add anyone who received emails before but is missing from subscribers.json.
 * Sources: sent-log.json + perfectpay-sales.json
 * Does not overwrite existing subscribers (keeps first_seen / cron state).
 */
function subscribers_sync_from_logs($dataDir) {
    if (!is_dir($dataDir)) {
        mkdir($dataDir, 0755, true);
    }

    $subs = load_subscribers($dataDir);
    $added = 0;
    $now = date('c');

    $logFile = rtrim($dataDir, '/\\') . '/sent-log.json';
    if (file_exists($logFile)) {
        $log = json_decode(file_get_contents($logFile), true);
        if (is_array($log)) {
            foreach ($log as $row) {
                $email = strtolower(trim((string) ($row['email'] ?? '')));
                if ($email === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
                    continue;
                }
                $at = !empty($row['at']) ? $row['at'] : $now;
                if (!isset($subs[$email])) {
                    $subs[$email] = [
                        'email' => $email,
                        'first_seen' => $at,
                        'last_seen' => $at,
                        'analysis_start' => $at,
                        'templates' => [],
                        'visits' => 1,
                        'restored_from' => 'sent-log',
                    ];
                    $added++;
                } else {
                    if (!empty($row['at']) && (empty($subs[$email]['first_seen']) || strtotime($row['at']) < strtotime($subs[$email]['first_seen']))) {
                        $subs[$email]['first_seen'] = $row['at'];
                    }
                    if (empty($subs[$email]['analysis_start'])) {
                        $subs[$email]['analysis_start'] = $subs[$email]['first_seen'] ?? $at;
                    }
                }
                $tpl = $row['template'] ?? '';
                if ($tpl !== '') {
                    if (!isset($subs[$email]['templates']) || !is_array($subs[$email]['templates'])) {
                        $subs[$email]['templates'] = [];
                    }
                    if (!in_array($tpl, $subs[$email]['templates'], true)) {
                        $subs[$email]['templates'][] = $tpl;
                    }
                }
            }
        }
    }

    $salesFile = rtrim($dataDir, '/\\') . '/perfectpay-sales.json';
    if (file_exists($salesFile)) {
        $sales = json_decode(file_get_contents($salesFile), true);
        if (is_array($sales)) {
            foreach ($sales as $saleCode => $sale) {
                $email = strtolower(trim((string) ($sale['email'] ?? '')));
                if ($email === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
                    continue;
                }
                $at = !empty($sale['sent_at']) ? $sale['sent_at'] : $now;
                if (!isset($subs[$email])) {
                    $subs[$email] = [
                        'email' => $email,
                        'first_seen' => $at,
                        'last_seen' => $at,
                        'analysis_start' => $at,
                        'templates' => [],
                        'visits' => 1,
                        'purchased' => true,
                        'perfectpay_sale_code' => $saleCode,
                        'restored_from' => 'perfectpay',
                    ];
                    $added++;
                } else {
                    $subs[$email]['purchased'] = true;
                    if (empty($subs[$email]['perfectpay_sale_code'])) {
                        $subs[$email]['perfectpay_sale_code'] = $saleCode;
                    }
                }
            }
        }
    }

    if ($added > 0 || !empty($subs)) {
        file_put_contents(subscribers_file($dataDir), json_encode($subs, JSON_PRETTY_PRINT), LOCK_EX);
    }

    return ['added' => $added, 'total' => count($subs)];
}

<?php

require_once __DIR__ . '/subscribers.php';

function email_tracking_token($email, $template, $date, $secret) {
    return substr(hash_hmac('sha256', strtolower(trim($email)) . '|' . $template . '|' . $date, $secret), 0, 32);
}

function email_tracking_url(array $config, $email, $template) {
    $panel = rtrim($config['panel_url'] ?? '', '/');
    $date = date('Y-m-d');
    $token = email_tracking_token($email, $template, $date, $config['cron_secret'] ?? 'track');
    $emailHash = substr(md5(strtolower(trim($email))), 0, 12);
    return $panel . '/api/track-open.php?t=' . $token
        . '&tpl=' . rawurlencode($template)
        . '&d=' . rawurlencode($date)
        . '&m=' . $emailHash;
}

function email_append_tracking_pixel($html, $url) {
    if (!$url || stripos($html, 'track-open.php') !== false) {
        return $html;
    }
    $pixel = '<img src="' . htmlspecialchars($url, ENT_QUOTES, 'UTF-8')
        . '" width="1" height="1" alt="" style="display:block;width:1px;height:1px;border:0;" />';
    if (stripos($html, '</body>') !== false) {
        return str_ireplace('</body>', $pixel . '</body>', $html);
    }
    return $html . $pixel;
}

function email_record_open($dataDir, $email, $template, array $extra = []) {
    $email = strtolower(trim($email));
    if (!$email) {
        return false;
    }

    $subs = load_subscribers($dataDir);
    if (!isset($subs[$email])) {
        $subs[$email] = [
            'email' => $email,
            'first_seen' => date('c'),
            'last_seen' => date('c'),
            'templates' => [],
            'visits' => 0,
        ];
    }

    if (!isset($subs[$email]['tracking']) || !is_array($subs[$email]['tracking'])) {
        $subs[$email]['tracking'] = [
            'opens' => [],
            'open_count' => 0,
            'last_open_at' => null,
        ];
    }

    $now = date('c');
    $subs[$email]['tracking']['opens'][] = array_merge([
        'template' => $template,
        'at' => $now,
        'date' => date('Y-m-d'),
        'ip' => $extra['ip'] ?? '',
        'ua' => substr($extra['ua'] ?? '', 0, 120),
    ], $extra);

    if (count($subs[$email]['tracking']['opens']) > 200) {
        $subs[$email]['tracking']['opens'] = array_slice($subs[$email]['tracking']['opens'], -150);
    }

    $subs[$email]['tracking']['open_count'] = ($subs[$email]['tracking']['open_count'] ?? 0) + 1;
    $subs[$email]['tracking']['last_open_at'] = $now;
    $subs[$email]['tracking']['last_open_template'] = $template;

    file_put_contents(subscribers_file($dataDir), json_encode($subs, JSON_PRETTY_PRINT), LOCK_EX);
    return true;
}

function email_mark_refund($dataDir, $email, array $extra = []) {
    $email = strtolower(trim($email));
    if (!$email) {
        return false;
    }

    $subs = load_subscribers($dataDir);
    if (!isset($subs[$email])) {
        $subs[$email] = [
            'email' => $email,
            'first_seen' => date('c'),
            'last_seen' => date('c'),
            'templates' => [],
            'visits' => 0,
        ];
    }

    $subs[$email]['refund_requested'] = true;
    $subs[$email]['refund_at'] = date('c');
    if (!empty($extra['reason'])) {
        $subs[$email]['refund_reason'] = substr((string) $extra['reason'], 0, 80);
    }
    if (!empty($extra['protocol'])) {
        $subs[$email]['refund_protocol'] = substr((string) $extra['protocol'], 0, 40);
    }

    file_put_contents(subscribers_file($dataDir), json_encode($subs, JSON_PRETTY_PRINT), LOCK_EX);
    return true;
}

function email_mark_refund_attempt($dataDir, $email, $step, array $extra = []) {
    $email = strtolower(trim((string) $email));
    if (!$email) {
        return false;
    }

    $subs = load_subscribers($dataDir);
    if (!isset($subs[$email])) {
        $subs[$email] = [
            'email' => $email,
            'first_seen' => date('c'),
            'last_seen' => date('c'),
            'templates' => [],
            'visits' => 0,
        ];
    }

    if (!isset($subs[$email]['refund_attempts']) || !is_array($subs[$email]['refund_attempts'])) {
        $subs[$email]['refund_attempts'] = [];
    }

    $subs[$email]['refund_attempts'][] = [
        'step' => (int) $step,
        'at' => date('c'),
        'source' => $extra['source'] ?? 'chat',
    ];
    $subs[$email]['refund_attempt_count'] = ($subs[$email]['refund_attempt_count'] ?? 0) + 1;
    $subs[$email]['last_refund_attempt_at'] = date('c');

    file_put_contents(subscribers_file($dataDir), json_encode($subs, JSON_PRETTY_PRINT), LOCK_EX);
    return true;
}

function email_stats_summary($dataDir) {
    $subs = load_subscribers($dataDir);
    $rows = [];
    $totals = [
        'subscribers' => 0,
        'opened' => 0,
        'refunds' => 0,
        'never_opened_refund' => 0,
        'opened_refund' => 0,
    ];

    foreach ($subs as $sub) {
        $email = $sub['email'] ?? '';
        if (!$email) {
            continue;
        }
        $openCount = (int) ($sub['tracking']['open_count'] ?? 0);
        $refund = !empty($sub['refund_requested']);
        $totals['subscribers']++;
        if ($openCount > 0) {
            $totals['opened']++;
        }
        if ($refund) {
            $totals['refunds']++;
            if ($openCount > 0) {
                $totals['opened_refund']++;
            } else {
                $totals['never_opened_refund']++;
            }
        }

        $rows[] = [
            'email' => $email,
            'open_count' => $openCount,
            'last_open_at' => $sub['tracking']['last_open_at'] ?? null,
            'last_open_template' => $sub['tracking']['last_open_template'] ?? null,
            'refund_requested' => $refund,
            'refund_at' => $sub['refund_at'] ?? null,
            'day_num' => null,
        ];

        $start = $sub['analysis_start'] ?? $sub['first_seen'] ?? null;
        if ($start && function_exists('analysis_get_state')) {
            $rows[count($rows) - 1]['day_num'] = analysis_get_state($start)['day_num'];
        }
    }

    usort($rows, function ($a, $b) {
        return strcmp($b['last_open_at'] ?? '', $a['last_open_at'] ?? '');
    });

    return ['totals' => $totals, 'rows' => $rows];
}

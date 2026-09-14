<?php
/**
 * Hourly cron — run every hour in cPanel.
 * CLI:  php /path/api/cron-hourly.php
 * HTTP: /api/cron-hourly.php?key=YOUR_CRON_SECRET
 *
 * Sends 1–2 emails per subscriber per day for ~30 days:
 *   • daily_progress  — every day (Day N report)
 *   • event_detected  — every day (photo / message / call alert)
 *   • event_detected_2 — ~75% of days (second alert)
 *
 * Catch-up: if the preferred hour was missed, send later the same day.
 */

$configPath = __DIR__ . '/config.php';
if (!file_exists($configPath)) {
    exit(1);
}

$config = require $configPath;
if (empty($config['enabled'])) {
    echo "disabled\n";
    exit(0);
}

$cronKey = $config['cron_secret'] ?? '';
if (php_sapi_name() !== 'cli') {
    header('Content-Type: application/json; charset=utf-8');
    if (!$cronKey || ($_GET['key'] ?? '') !== $cronKey) {
        http_response_code(403);
        exit('Forbidden');
    }
}

require_once __DIR__ . '/send-mail.php';
require_once __DIR__ . '/subscribers.php';
require_once __DIR__ . '/analysis-state.php';
require_once __DIR__ . '/cron-state.php';
require_once __DIR__ . '/daily-email-data.php';
require_once __DIR__ . '/queue-helpers.php';

$dataDir = __DIR__ . '/data';
$logFile = $dataDir . '/sent-log.json';
$queueFile = $dataDir . '/queue.json';

// Prevent duplicate sends when cron + browser run at the same time
$lock = cron_acquire_lock($dataDir);
if ($lock === false) {
    echo json_encode([
        'ok' => false,
        'skipped' => true,
        'reason' => 'another_cron_running',
        'hour' => (int) date('G'),
        'date' => date('Y-m-d'),
    ], JSON_PRETTY_PRINT) . "\n";
    exit(0);
}

$hour = (int) date('G');
$maxPerRun = (int) ($config['cron_max_per_run'] ?? 50);
$schedule = $config['cron_schedule'] ?? [];

$results = [
    'hour' => $hour,
    'date' => date('Y-m-d'),
    'subscribers' => 0,
    'queue' => 0,
    'daily_progress' => 0,
    'event_detected' => 0,
    'event_detected_2' => 0,
    'weekly_summary' => 0,
    'retention' => 0,
    'high_risk_detected' => 0,
    'unlock_reminder' => 0,
    'errors' => 0,
    'skipped_dup' => 0,
];

$results['queue'] = flush_ready_queue($config, $queueFile, $logFile, min(8, $maxPerRun), $dataDir);

// Restore anyone who got emails before but is missing from subscribers.json
$sync = subscribers_sync_from_logs($dataDir);
$results['restored'] = (int) ($sync['added'] ?? 0);

// Clear false "claimed" entries from failed sends (allows retry same day)
$results['cleared_stale'] = cron_clear_stale_claims($dataDir, $logFile);

$subs = load_subscribers($dataDir);
$results['subscribers'] = count($subs);
$sentTotal = $results['queue'];

/**
 * Preferred hour for this subscriber, then catch-up for the rest of the day.
 * Avoids losing the whole day when the exact slot hour is missed.
 */
function cron_slot_due($hour, $slotHour) {
    return $hour >= (int) $slotHour;
}

function cron_try_send(array $config, $dataDir, $logFile, $email, $template, array $meta, &$results, &$sentTotal, $resultKey, $markKey = null) {
    $markKey = $markKey ?: $template;

    if (cron_log_has_today($logFile, $email, $markKey)) {
        $results['skipped_dup']++;
        return false;
    }

    if (cron_was_sent_on_date($dataDir, $email, $markKey)) {
        $results['skipped_dup']++;
        return false;
    }

    $job = ['email' => $email, 'template' => $template, 'meta' => $meta];
    if (!process_one($config, $job)) {
        $results['errors']++;
        if (resend_quota_exceeded()) {
            $results['quota_exceeded'] = true;
        }
        return false;
    }

    cron_mark_sent($dataDir, $email, $markKey, ['sent' => true]);
    cron_append_sent_log($logFile, $email, $markKey);
    $results[$resultKey]++;
    $sentTotal++;
    return true;
}

foreach ($subs as $sub) {
    if ($sentTotal >= $maxPerRun) {
        $results['capped'] = true;
        break;
    }

    if (!empty($results['quota_exceeded'])) {
        break;
    }

    $email = strtolower(trim((string) ($sub['email'] ?? '')));
    if ($email === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
        continue;
    }

    $days = cron_days_since_first_seen($sub);
    $analysisStart = $sub['analysis_start'] ?? $sub['first_seen'] ?? date('c');
    $dayNum = (int) (analysis_get_state($analysisStart)['day_num'] ?? 1);

    // Active monitoring window: days 1–30
    $inWindow = $dayNum >= 1 && $dayNum <= 30;

    // ── Daily progress report (every day, Day 1–30) ──────────────────────
    $dp = $schedule['daily_progress'] ?? ['start_hour' => 9, 'span' => 4];
    $dpHour = analysis_subscriber_slot($email, (int) $dp['start_hour'], (int) $dp['span']);
    if ($inWindow
        && cron_slot_due($hour, $dpHour)
        && !cron_was_sent_on_date($dataDir, $email, 'daily_progress')
    ) {
        cron_try_send($config, $dataDir, $logFile, $email, 'daily_progress', [], $results, $sentTotal, 'daily_progress');
    }

    if ($sentTotal >= $maxPerRun) {
        $results['capped'] = true;
        break;
    }

    // ── Random alert #1 (every day — photo, message, call…) ──────────────
    $ev = $schedule['event_detected'] ?? ['start_hour' => 11, 'span' => 5];
    $evHour = analysis_subscriber_slot($email, (int) $ev['start_hour'], (int) $ev['span']);
    if ($inWindow
        && cron_slot_due($hour, $evHour)
        && !cron_was_sent_on_date($dataDir, $email, 'event_detected')
    ) {
        cron_try_send($config, $dataDir, $logFile, $email, 'event_detected', ['slot' => 1], $results, $sentTotal, 'event_detected');
    }

    if ($sentTotal >= $maxPerRun) {
        $results['capped'] = true;
        break;
    }

    // ── Random alert #2 (~75% of days, evening) ──────────────────────────
    $ev2 = $schedule['event_detected_2'] ?? ['start_hour' => 18, 'span' => 4];
    $ev2Hour = analysis_subscriber_slot($email, (int) $ev2['start_hour'], (int) $ev2['span']);
    if ($inWindow
        && cron_slot_due($hour, $ev2Hour)
        && daily_send_second_event_today($email)
        && !cron_was_sent_on_date($dataDir, $email, 'event_detected_2')
    ) {
        cron_try_send($config, $dataDir, $logFile, $email, 'event_detected', ['slot' => 2], $results, $sentTotal, 'event_detected_2', 'event_detected_2');
    }

    if ($sentTotal >= $maxPerRun) {
        $results['capped'] = true;
        break;
    }

    // ── Weekly summary — days 7, 14, 21 ───────────────────────────────────
    $weekMilestone = daily_weekly_milestone($dayNum);
    $ws = $schedule['weekly_summary'] ?? ['start_hour' => 11, 'span' => 3];
    $wsHour = analysis_subscriber_slot($email, (int) $ws['start_hour'], (int) $ws['span']);
    $wsKey = $weekMilestone ? 'weekly_summary_w' . $weekMilestone : '';
    if ($weekMilestone
        && cron_slot_due($hour, $wsHour)
        && !cron_was_sent_ever($dataDir, $email, $wsKey)
    ) {
        cron_try_send($config, $dataDir, $logFile, $email, 'weekly_summary', ['week' => $weekMilestone], $results, $sentTotal, 'weekly_summary', $wsKey);
    }

    if ($sentTotal >= $maxPerRun) {
        $results['capped'] = true;
        break;
    }

    // ── One-time funnel emails (retention / high risk / unlock) ───────────
    $ret = $schedule['retention'] ?? ['start_hour' => 19, 'span' => 3, 'after_days' => 1];
    $retHour = analysis_subscriber_slot($email, (int) $ret['start_hour'], (int) $ret['span']);
    if ($days >= (int) $ret['after_days']
        && cron_slot_due($hour, $retHour)
        && !cron_was_sent_ever($dataDir, $email, 'retention')
        && !subscriber_email_was_sent($dataDir, $email, 'retention')
    ) {
        if (cron_try_send($config, $dataDir, $logFile, $email, 'retention', [], $results, $sentTotal, 'retention')) {
            subscriber_mark_email_sent($dataDir, $email, 'retention');
        }
    }

    if ($sentTotal >= $maxPerRun) {
        $results['capped'] = true;
        break;
    }

    $hr = $schedule['high_risk_detected'] ?? ['start_hour' => 10, 'span' => 4, 'after_days' => 2];
    $hrHour = analysis_subscriber_slot($email, (int) $hr['start_hour'], (int) $hr['span']);
    if ($days >= (int) $hr['after_days']
        && cron_slot_due($hour, $hrHour)
        && !cron_was_sent_ever($dataDir, $email, 'high_risk_detected')
        && !subscriber_email_was_sent($dataDir, $email, 'high_risk_detected')
    ) {
        if (cron_try_send($config, $dataDir, $logFile, $email, 'high_risk_detected', [], $results, $sentTotal, 'high_risk_detected')) {
            subscriber_mark_email_sent($dataDir, $email, 'high_risk_detected');
        }
    }

    if ($sentTotal >= $maxPerRun) {
        $results['capped'] = true;
        break;
    }

    $ul = $schedule['unlock_reminder'] ?? ['start_hour' => 15, 'span' => 3, 'after_days' => 3];
    $ulHour = analysis_subscriber_slot($email, (int) $ul['start_hour'], (int) $ul['span']);
    if ($days >= (int) $ul['after_days']
        && cron_slot_due($hour, $ulHour)
        && !cron_was_sent_ever($dataDir, $email, 'unlock_reminder')
        && !subscriber_email_was_sent($dataDir, $email, 'unlock_reminder')
    ) {
        if (cron_try_send($config, $dataDir, $logFile, $email, 'unlock_reminder', [], $results, $sentTotal, 'unlock_reminder')) {
            subscriber_mark_email_sent($dataDir, $email, 'unlock_reminder');
        }
    }
}

cron_release_lock($lock);
echo json_encode($results, JSON_PRETTY_PRINT) . "\n";

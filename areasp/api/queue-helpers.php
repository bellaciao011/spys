<?php

require_once __DIR__ . '/subscribers.php';

function funnel_templates() {
    return ['welcome', 'phone_registered', 'tracking_done', 'dashboard_ready', 'support_intro'];
}

function funnel_is_template($template) {
    return in_array($template, funnel_templates(), true);
}

/** Static templates — deliver once per subscriber, ever. */
function once_ever_email_templates() {
    return [
        'welcome',
        'phone_registered',
        'tracking_done',
        'dashboard_ready',
        'support_intro',
        'report_ready',
        'report_reminder',
        'unlock_reminder',
        'unlock_code_pending',
        'retention',
        'high_risk_detected',
        'delivery_proof',
        'purchase_access',
    ];
}

function email_is_once_ever($template) {
    return in_array($template, once_ever_email_templates(), true);
}

/** Dynamic templates — new content each day / milestone. */
function repeatable_daily_templates() {
    return ['daily_progress', 'event_detected', 'analysis_progress'];
}

function email_is_repeatable_daily($template) {
    return in_array($template, repeatable_daily_templates(), true);
}

function email_delivery_key($template, array $meta = []) {
    if ($template === 'weekly_summary') {
        $week = max(1, (int) ($meta['week'] ?? $meta['week_num'] ?? 0));
        if ($week > 0) {
            return 'weekly_summary_w' . $week;
        }
    }
    return $template;
}

function email_log_has_entry($logFile, $email, $template, $todayOnly = false) {
    $log = file_exists($logFile) ? json_decode(file_get_contents($logFile), true) : [];
    if (!is_array($log)) {
        return false;
    }

    $email = strtolower(trim($email));
    $today = date('Y-m-d');

    foreach ($log as $row) {
        if (strtolower(trim($row['email'] ?? '')) !== $email) {
            continue;
        }
        if (($row['template'] ?? '') !== $template) {
            continue;
        }
        if ($todayOnly && substr($row['at'] ?? '', 0, 10) !== $today) {
            continue;
        }
        return true;
    }

    return false;
}

function email_queue_has_entry(array $queue, $email, $template, $todayOnly = false, $excludeJobId = null) {
    $email = strtolower(trim($email));
    $today = date('Y-m-d');

    foreach ($queue as $job) {
        if ($excludeJobId && ($job['id'] ?? '') === $excludeJobId) {
            continue;
        }
        if (strtolower(trim($job['email'] ?? '')) !== $email) {
            continue;
        }
        if (($job['template'] ?? '') !== $template) {
            continue;
        }
        if (!in_array($job['status'] ?? '', ['pending', 'sent'], true)) {
            continue;
        }
        if ($todayOnly) {
            $jobDate = substr($job['sent_at'] ?? $job['created_at'] ?? '', 0, 10);
            if ($jobDate !== $today) {
                continue;
            }
        }
        return true;
    }

    return false;
}

function email_already_delivered(array $queue, $logFile, $email, $template, $dataDir = null, array $meta = [], $excludeJobId = null) {
    $email = strtolower(trim($email));

    if (email_is_once_ever($template)) {
        if ($dataDir && subscriber_email_was_sent($dataDir, $email, $template)) {
            return true;
        }
        if (email_queue_has_entry($queue, $email, $template, false, $excludeJobId)) {
            return true;
        }
        return email_log_has_entry($logFile, $email, $template, false);
    }

    if (email_is_repeatable_daily($template)) {
        if ($dataDir) {
            require_once __DIR__ . '/cron-state.php';
            if (cron_was_sent_on_date($dataDir, $email, $template)) {
                return true;
            }
        }
        if (email_queue_has_entry($queue, $email, $template, true, $excludeJobId)) {
            return true;
        }
        return email_log_has_entry($logFile, $email, $template, true);
    }

    if ($template === 'weekly_summary') {
        $deliveryKey = email_delivery_key($template, $meta);
        if ($dataDir) {
            require_once __DIR__ . '/cron-state.php';
            if (cron_was_sent_ever($dataDir, $email, $deliveryKey)) {
                return true;
            }
        }
        foreach ($queue as $job) {
            if ($excludeJobId && ($job['id'] ?? '') === $excludeJobId) {
                continue;
            }
            if (strtolower(trim($job['email'] ?? '')) !== $email) {
                continue;
            }
            if (($job['template'] ?? '') !== 'weekly_summary') {
                continue;
            }
            if (!in_array($job['status'] ?? '', ['pending', 'sent'], true)) {
                continue;
            }
            $jobKey = email_delivery_key('weekly_summary', $job['meta'] ?? []);
            if ($jobKey === $deliveryKey) {
                return true;
            }
        }
        return false;
    }

    if (email_queue_has_entry($queue, $email, $template, false, $excludeJobId)) {
        return true;
    }
    return email_log_has_entry($logFile, $email, $template, false);
}

function funnel_already_queued_or_sent(array $queue, $logFile, $email, $template, $dataDir = null) {
    return email_already_delivered($queue, $logFile, $email, $template, $dataDir);
}

function email_record_delivery($dataDir, $logFile, $email, $template, array $meta = []) {
    queue_append_sent_log($logFile, $email, $template);
    if ($dataDir && email_is_once_ever($template)) {
        subscriber_mark_email_sent($dataDir, $email, $template);
    }
}

function funnel_last_scheduled_time(array $queue, $logFile, $email) {
    $last = 0;
    $funnel = funnel_templates();
    $email = strtolower(trim($email));

    foreach ($queue as $job) {
        if (strtolower(trim($job['email'] ?? '')) !== $email) {
            continue;
        }
        if (!in_array($job['template'] ?? '', $funnel, true)) {
            continue;
        }
        $t = 0;
        if (!empty($job['send_after'])) {
            $t = strtotime($job['send_after']);
        } elseif (($job['status'] ?? '') === 'sent' && !empty($job['sent_at'])) {
            $t = strtotime($job['sent_at']);
        } elseif (!empty($job['created_at'])) {
            $t = strtotime($job['created_at']);
        }
        if ($t > $last) {
            $last = $t;
        }
    }

    $log = file_exists($logFile) ? json_decode(file_get_contents($logFile), true) : [];
    if (is_array($log)) {
        foreach ($log as $row) {
            if (strtolower(trim($row['email'] ?? '')) !== $email) {
                continue;
            }
            if (!in_array($row['template'] ?? '', $funnel, true)) {
                continue;
            }
            $t = strtotime($row['at'] ?? '');
            if ($t > $last) {
                $last = $t;
            }
        }
    }

    return $last;
}

function email_compute_send_after(array $queue, $logFile, $email, $template, array $config) {
    if (!funnel_is_template($template)) {
        return time();
    }

    $gap = max(60, (int) ($config['funnel_email_gap_seconds'] ?? 300));
    $supportGap = max($gap, (int) ($config['funnel_support_gap_seconds'] ?? 480));
    $now = time();
    $last = funnel_last_scheduled_time($queue, $logFile, $email);

    if ($template === 'welcome' && $last === 0) {
        return $now;
    }

    $gapUse = ($template === 'support_intro') ? $supportGap : $gap;
    if ($last === 0) {
        return $now + $gapUse;
    }

    return max($now, $last + $gapUse);
}

function funnel_compute_send_after(array $queue, $logFile, $email, $template, array $config) {
    return email_compute_send_after($queue, $logFile, $email, $template, $config);
}

function queue_atomic_update($queueFile, callable $callback) {
    $dir = dirname($queueFile);
    if (!is_dir($dir)) {
        mkdir($dir, 0755, true);
    }

    $fp = fopen($queueFile, 'c+');
    if (!$fp) {
        return null;
    }

    flock($fp, LOCK_EX);
    $raw = stream_get_contents($fp);
    $queue = $raw ? json_decode($raw, true) : [];
    if (!is_array($queue)) {
        $queue = [];
    }

    $result = $callback($queue);

    ftruncate($fp, 0);
    rewind($fp);
    fwrite($fp, json_encode($queue, JSON_PRETTY_PRINT));
    fflush($fp);
    flock($fp, LOCK_UN);
    fclose($fp);

    return $result;
}

function queue_job_is_ready(array $job, $now = null) {
    $now = $now ?? time();
    if (($job['status'] ?? '') !== 'pending') {
        return false;
    }
    $sendAfter = !empty($job['send_after']) ? strtotime($job['send_after']) : 0;
    return !$sendAfter || $sendAfter <= $now;
}

function flush_ready_queue(array $config, $queueFile, $logFile, $max = 1, $dataDir = null) {
    if (!file_exists($queueFile)) {
        return 0;
    }

    require_once __DIR__ . '/send-mail.php';

    $queue = json_decode(file_get_contents($queueFile), true);
    if (!is_array($queue)) {
        return 0;
    }

    $now = time();
    $flushed = 0;

    foreach ($queue as &$job) {
        if ($flushed >= $max) {
            break;
        }
        if (!queue_job_is_ready($job, $now)) {
            continue;
        }

        $template = $job['template'] ?? '';
        $jobEmail = $job['email'] ?? '';
        $jobMeta = $job['meta'] ?? [];

        if ($dataDir && email_already_delivered($queue, $logFile, $jobEmail, $template, $dataDir, $jobMeta, $job['id'] ?? null)) {
            $isThisPending = ($job['status'] ?? '') === 'pending';
            if ($isThisPending) {
                $job['status'] = 'skipped';
                $job['skipped_at'] = date('c');
                $job['skip_reason'] = 'duplicate';
            }
            continue;
        }

        if (process_one($config, $job)) {
            $job['status'] = 'sent';
            $job['sent_at'] = date('c');
            email_record_delivery($dataDir, $logFile, $jobEmail, $template, $jobMeta);
            $flushed++;
        } else {
            $job['attempts'] = ($job['attempts'] ?? 0) + 1;
        }
    }
    unset($job);

    file_put_contents($queueFile, json_encode($queue, JSON_PRETTY_PRINT), LOCK_EX);

    return $flushed;
}

function queue_rate_limit_ok($logFile, $email, $max) {
    $log = file_exists($logFile) ? json_decode(file_get_contents($logFile), true) : [];
    if (!is_array($log)) {
        return true;
    }
    $since = time() - 3600;
    $count = 0;
    $email = strtolower(trim($email));
    foreach ($log as $row) {
        if (strtolower(trim($row['email'] ?? '')) === $email && strtotime($row['at'] ?? '') >= $since) {
            $count++;
        }
    }
    return $count < $max;
}

function queue_append_sent_log($logFile, $email, $template) {
    $log = file_exists($logFile) ? json_decode(file_get_contents($logFile), true) : [];
    if (!is_array($log)) {
        $log = [];
    }
    $log[] = ['email' => strtolower(trim($email)), 'template' => $template, 'at' => date('c')];
    if (count($log) > 5000) {
        $log = array_slice($log, -3000);
    }
    file_put_contents($logFile, json_encode($log), LOCK_EX);
}

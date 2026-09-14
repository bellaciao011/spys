<?php

require_once __DIR__ . '/subscribers.php';

function cron_lock_file($dataDir) {
    return rtrim($dataDir, '/\\') . '/cron.lock';
}

/** Only one cron process at a time. Returns lock handle or false. */
function cron_acquire_lock($dataDir) {
    if (!is_dir($dataDir)) {
        mkdir($dataDir, 0755, true);
    }
    $path = cron_lock_file($dataDir);
    $fh = fopen($path, 'c+');
    if (!$fh) {
        return false;
    }
    if (!flock($fh, LOCK_EX | LOCK_NB)) {
        fclose($fh);
        return false;
    }
    ftruncate($fh, 0);
    fwrite($fh, (string) getmypid() . ' ' . date('c'));
    fflush($fh);
    return $fh;
}

function cron_release_lock($fh) {
    if (!$fh) {
        return;
    }
    flock($fh, LOCK_UN);
    fclose($fh);
}

function cron_mark_sent($dataDir, $email, $template, $extra = []) {
    $subs = load_subscribers($dataDir);
    $key = strtolower(trim($email));
    if (!isset($subs[$key])) {
        return false;
    }
    if (!isset($subs[$key]['cron']) || !is_array($subs[$key]['cron'])) {
        $subs[$key]['cron'] = [];
    }
    $subs[$key]['cron'][$template] = array_merge([
        'at' => date('c'),
        'date' => date('Y-m-d'),
    ], $extra);

    file_put_contents(subscribers_file($dataDir), json_encode($subs, JSON_PRETTY_PRINT), LOCK_EX);
    return true;
}

/**
 * Atomically claim today's send slot BEFORE calling Resend.
 * Returns true only for the first claim — prevents duplicates.
 */
function cron_claim_send_today($dataDir, $email, $template, $date = null) {
    $date = $date ?: date('Y-m-d');
    $email = strtolower(trim($email));
    if ($email === '' || $template === '') {
        return false;
    }

    $file = subscribers_file($dataDir);
    $fh = fopen($file, 'c+');
    if (!$fh) {
        return false;
    }

    if (!flock($fh, LOCK_EX)) {
        fclose($fh);
        return false;
    }

    $raw = stream_get_contents($fh);
    $subs = $raw !== '' && $raw !== false ? json_decode($raw, true) : [];
    if (!is_array($subs)) {
        $subs = [];
    }

    if (!isset($subs[$email])) {
        flock($fh, LOCK_UN);
        fclose($fh);
        return false;
    }

    if (!isset($subs[$email]['cron']) || !is_array($subs[$email]['cron'])) {
        $subs[$email]['cron'] = [];
    }

    $entry = $subs[$email]['cron'][$template] ?? null;
    if (is_array($entry)) {
        if (!empty($entry['date']) && $entry['date'] === $date) {
            flock($fh, LOCK_UN);
            fclose($fh);
            return false;
        }
        if (!empty($entry['at']) && date('Y-m-d', strtotime($entry['at'])) === $date) {
            flock($fh, LOCK_UN);
            fclose($fh);
            return false;
        }
    }

    $subs[$email]['cron'][$template] = [
        'at' => date('c'),
        'date' => $date,
        'claimed' => true,
    ];

    $json = json_encode($subs, JSON_PRETTY_PRINT);
    ftruncate($fh, 0);
    rewind($fh);
    fwrite($fh, $json);
    fflush($fh);
    flock($fh, LOCK_UN);
    fclose($fh);

    return true;
}

function cron_was_sent_on_date($dataDir, $email, $template, $date = null) {
    $date = $date ?: date('Y-m-d');
    $logFile = rtrim($dataDir, '/\\') . '/sent-log.json';
    if (cron_log_has_today($logFile, $email, $template, $date)) {
        return true;
    }

    $sub = get_subscriber($dataDir, $email);
    if (!$sub || empty($sub['cron'][$template])) {
        return false;
    }
    $entry = $sub['cron'][$template];
    if (empty($entry['sent'])) {
        return false;
    }
    if (!empty($entry['date']) && $entry['date'] === $date) {
        return true;
    }
    if (!empty($entry['at']) && date('Y-m-d', strtotime($entry['at'])) === $date) {
        return true;
    }
    return false;
}

/**
 * Remove today's cron marks that never made it to sent-log (failed Resend attempts).
 */
function cron_clear_stale_claims($dataDir, $logFile) {
    $today = date('Y-m-d');
    $subs = load_subscribers($dataDir);
    $cleared = 0;

    foreach ($subs as $key => &$sub) {
        if (empty($sub['cron']) || !is_array($sub['cron'])) {
            continue;
        }
        foreach ($sub['cron'] as $tpl => $entry) {
            if (!is_array($entry)) {
                continue;
            }
            $entryDate = $entry['date'] ?? (isset($entry['at']) ? date('Y-m-d', strtotime($entry['at'])) : '');
            if ($entryDate !== $today) {
                continue;
            }
            if (!empty($entry['sent'])) {
                continue;
            }
            if (cron_log_has_today($logFile, $key, $tpl, $today)) {
                continue;
            }
            unset($sub['cron'][$tpl]);
            $cleared++;
        }
    }
    unset($sub);

    if ($cleared > 0) {
        file_put_contents(subscribers_file($dataDir), json_encode($subs, JSON_PRETTY_PRINT), LOCK_EX);
    }

    return $cleared;
}

function cron_log_has_today($logFile, $email, $template, $date = null) {
    $date = $date ?: date('Y-m-d');
    $email = strtolower(trim($email));
    if (!file_exists($logFile)) {
        return false;
    }
    $log = json_decode(file_get_contents($logFile), true);
    if (!is_array($log)) {
        return false;
    }
    foreach ($log as $row) {
        if (strtolower(trim($row['email'] ?? '')) !== $email) {
            continue;
        }
        if (($row['template'] ?? '') !== $template) {
            continue;
        }
        if (substr($row['at'] ?? '', 0, 10) === $date) {
            return true;
        }
    }
    return false;
}

function cron_was_sent_ever($dataDir, $email, $template) {
    $sub = get_subscriber($dataDir, $email);
    return $sub && !empty($sub['cron'][$template]);
}

function cron_days_since_first_seen(array $sub) {
    $first = strtotime($sub['first_seen'] ?? '');
    if (!$first) {
        return 0;
    }
    return (int) floor((time() - $first) / 86400);
}

function cron_append_sent_log($logFile, $email, $template) {
    $dir = dirname($logFile);
    if (!is_dir($dir)) {
        mkdir($dir, 0755, true);
    }

    $fh = fopen($logFile, 'c+');
    if (!$fh) {
        return;
    }
    flock($fh, LOCK_EX);
    $raw = stream_get_contents($fh);
    $log = $raw !== '' && $raw !== false ? json_decode($raw, true) : [];
    if (!is_array($log)) {
        $log = [];
    }

    $email = strtolower(trim($email));
    $today = date('Y-m-d');
    foreach ($log as $row) {
        if (strtolower(trim($row['email'] ?? '')) === $email
            && ($row['template'] ?? '') === $template
            && substr($row['at'] ?? '', 0, 10) === $today
        ) {
            // already logged today — skip duplicate log line
            flock($fh, LOCK_UN);
            fclose($fh);
            return;
        }
    }

    $log[] = ['email' => $email, 'template' => $template, 'at' => date('c'), 'source' => 'cron'];
    if (count($log) > 5000) {
        $log = array_slice($log, -3000);
    }

    ftruncate($fh, 0);
    rewind($fh);
    fwrite($fh, json_encode($log));
    fflush($fh);
    flock($fh, LOCK_UN);
    fclose($fh);
}

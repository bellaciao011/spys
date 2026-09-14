<?php
/**
 * Optional — manually reprocess the queue.
 * Normal delivery is handled by queue-email.php and cron-hourly.php.
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
    if (!$cronKey || ($_GET['key'] ?? '') !== $cronKey) {
        http_response_code(403);
        exit('Forbidden');
    }
}

require_once __DIR__ . '/send-mail.php';

$queueFile = __DIR__ . '/data/queue.json';
$logFile = __DIR__ . '/data/sent-log.json';
$batch = (int) ($config['batch_size'] ?? 50);

if (!file_exists($queueFile)) {
    echo "empty\n";
    exit(0);
}

$queue = json_decode(file_get_contents($queueFile), true);
if (!is_array($queue)) {
    exit(1);
}

$sent = 0;
foreach ($queue as &$job) {
    if ($sent >= $batch) {
        break;
    }
    if (($job['status'] ?? '') !== 'pending') {
        continue;
    }

    if (process_one($config, $job)) {
        $job['status'] = 'sent';
        $job['sent_at'] = date('c');
        $sent++;
        append_log($logFile, $job['email'], $job['template']);
    } else {
        $job['attempts'] = ($job['attempts'] ?? 0) + 1;
        if ($job['attempts'] >= 3) {
            $job['status'] = 'failed';
        }
    }
}
unset($job);

file_put_contents($queueFile, json_encode($queue, JSON_PRETTY_PRINT), LOCK_EX);
echo "sent:$sent\n";

function append_log($file, $email, $template) {
    $log = file_exists($file) ? json_decode(file_get_contents($file), true) : [];
    if (!is_array($log)) {
        $log = [];
    }
    $log[] = ['email' => $email, 'template' => $template, 'at' => date('c')];
    file_put_contents($file, json_encode($log), LOCK_EX);
}

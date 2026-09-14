<?php
/**
 * Simple dashboard: opens vs refunds.
 * /api/email-stats.php?key=YOUR_CRON_SECRET
 */

$configPath = __DIR__ . '/config.php';
if (!file_exists($configPath)) {
    http_response_code(503);
    exit('Not configured');
}

$config = require $configPath;
$cronKey = $config['cron_secret'] ?? '';
if (!$cronKey || ($_GET['key'] ?? '') !== $cronKey) {
    http_response_code(403);
    exit('Forbidden');
}

require_once __DIR__ . '/email-tracking.php';
require_once __DIR__ . '/analysis-state.php';

$stats = email_stats_summary(__DIR__ . '/data');
$totals = $stats['totals'];
$rows = $stats['rows'];

$openRate = $totals['subscribers'] > 0
    ? round(($totals['opened'] / $totals['subscribers']) * 100, 1)
    : 0;
$refundRate = $totals['subscribers'] > 0
    ? round(($totals['refunds'] / $totals['subscribers']) * 100, 1)
    : 0;

header('Content-Type: text/html; charset=utf-8');
?>
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Stalkea — Email stats</title>
<style>
body{font-family:Inter,Arial,sans-serif;background:#0f172a;color:#e2e8f0;margin:0;padding:24px;}
h1{font-size:20px;margin:0 0 8px;}
.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:12px;margin:20px 0;}
.card{background:#1e293b;border:1px solid #334155;border-radius:12px;padding:16px;}
.card strong{display:block;font-size:24px;margin-top:6px;}
table{width:100%;border-collapse:collapse;margin-top:20px;font-size:13px;}
th,td{padding:10px 12px;border-bottom:1px solid #334155;text-align:left;}
th{color:#94a3b8;font-size:11px;text-transform:uppercase;}
.badge{display:inline-block;padding:2px 8px;border-radius:999px;font-size:11px;font-weight:700;}
.badge-yes{background:#7f1d1d;color:#fecaca;}
.badge-no{background:#14532d;color:#bbf7d0;}
.muted{color:#94a3b8;font-size:12px;}
</style>
</head>
<body>
<h1>📊 Email tracking — opens vs refunds</h1>
<p class="muted">Updated <?= htmlspecialchars(date('M j, Y H:i')) ?></p>

<div class="grid">
<div class="card">Subscribers<strong><?= (int) $totals['subscribers'] ?></strong></div>
<div class="card">Opened email<strong><?= (int) $totals['opened'] ?> <span class="muted">(<?= $openRate ?>%)</span></strong></div>
<div class="card">Requested refund<strong><?= (int) $totals['refunds'] ?> <span class="muted">(<?= $refundRate ?>%)</span></strong></div>
<div class="card">Refund + opened<strong><?= (int) $totals['opened_refund'] ?></strong></div>
<div class="card">Refund, never opened<strong><?= (int) $totals['never_opened_refund'] ?></strong></div>
</div>

<table>
<thead>
<tr>
<th>Email</th>
<th>Day</th>
<th>Opens</th>
<th>Last open</th>
<th>Template</th>
<th>Refund</th>
</tr>
</thead>
<tbody>
<?php foreach ($rows as $row): ?>
<tr>
<td><?= htmlspecialchars($row['email']) ?></td>
<td><?= $row['day_num'] ? 'Day ' . (int) $row['day_num'] : '—' ?></td>
<td><?= (int) $row['open_count'] ?></td>
<td><?= $row['last_open_at'] ? htmlspecialchars(date('M j H:i', strtotime($row['last_open_at']))) : '—' ?></td>
<td><?= htmlspecialchars($row['last_open_template'] ?? '—') ?></td>
<td>
<?php if ($row['refund_requested']): ?>
<span class="badge badge-yes">Yes</span>
<?php else: ?>
<span class="badge badge-no">No</span>
<?php endif; ?>
</td>
</tr>
<?php endforeach; ?>
</tbody>
</table>
</body>
</html>

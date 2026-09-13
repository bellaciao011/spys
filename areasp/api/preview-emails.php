<?php
/**
 * Preview — daily email samples (content changes each day).
 * /api/preview-emails.php
 */
require __DIR__ . '/email-templates.php';
require __DIR__ . '/analysis-state.php';
require __DIR__ . '/daily-email-data.php';

$config = file_exists(__DIR__ . '/config.php') ? require __DIR__ . '/config.php' : [];
$panelUrl = $config['panel_url'] ?? 'http://localhost:8080';

$demoBase = [
    'email' => 'demo@example.com',
    'report_id' => 'ZD-LE356Z',
    'phone_e164' => '+55 15996749481',
    'phone_number' => '+55 15 99674-9481',
    'first_seen' => date('c'),
];

function demo_sub_for_day(array $base, $dayNum) {
    $sub = $base;
    $sub['analysis_start'] = date('c', strtotime('-' . max(0, $dayNum - 1) . ' days'));
    $sub['first_seen'] = $sub['analysis_start'];
    return $sub;
}

$sampleDays = [1, 2, 3, 4, 5, 6, 7];
$dailySamples = [];
foreach ($sampleDays as $d) {
    $sub = demo_sub_for_day($demoBase, $d);
    $dailySamples[$d] = [
        'event1' => event_detected_template($panelUrl, daily_build_event_meta($sub, 1)),
        'event2' => event_detected_template($panelUrl, daily_build_event_meta($sub, 2)),
    ];
    $dailySamples[$d]['progress'] = daily_progress_template($panelUrl, daily_build_progress_meta($sub));
}

$weeklySub = demo_sub_for_day($demoBase, 7);
$weeklySummaryTpl = weekly_summary_template($panelUrl, daily_build_weekly_meta($weeklySub));

$purchaseTpl = purchase_access_template($panelUrl, [
    'email' => 'customer@example.com',
    'full_name' => 'John Smith',
    'product_name' => 'Stalkea Full Access',
]);

$staticTemplates = email_templates($panelUrl);

header('Content-Type: text/html; charset=utf-8');
?>
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Stalkea — Daily email preview</title>
<style>
body{font-family:Inter,Arial,sans-serif;background:#0b1218;color:#eef2f6;margin:0;padding:20px;}
.banner{background:#1e3a5f;border:1px solid #3b82f6;border-radius:12px;padding:16px 20px;margin-bottom:28px;max-width:900px;line-height:1.6;font-size:14px;}
.banner strong{color:#93c5fd;}
nav{position:sticky;top:0;background:#121c26;border-bottom:1px solid #1e2d3d;padding:10px 16px;z-index:10;overflow-x:auto;white-space:nowrap;margin:0 -20px 24px;padding-left:20px;}
nav a{color:#25d366;margin-right:14px;font-size:13px;text-decoration:none;}
h2{font-size:14px;color:#8fa3b8;margin:0 0 8px;text-transform:uppercase;letter-spacing:0.05em;}
h3{font-size:13px;color:#64748b;margin:24px 0 10px;}
iframe{width:100%;max-width:560px;height:600px;border:1px solid #1e2d3d;border-radius:12px;background:#fff;}
section{margin-bottom:40px;padding-top:8px;border-top:1px solid #1e2d3d;}
.grid{display:grid;gap:32px;}
.muted{color:#94a3b8;font-size:12px;margin:4px 0 12px;}
</style>
</head>
<body>

<div class="banner">
<strong>How it works — every day (days 1–30)</strong><br>
The cron sends <strong>1–2 emails per day</strong> with different content each day.<br><br>
• <strong>Progress report</strong> — every morning (Day N phase)<br>
• <strong>Alert #1</strong> — mid-day (photo / message / call…)<br>
• <strong>Alert #2</strong> — evening (~75% of days)<br>
• <strong>Weekly summary</strong> — days 7, 14 and 21<br>
If the preferred hour is missed, the next hourly run still sends (catch-up).
</div>

<nav>
<strong style="color:#fff;margin-right:16px;">Daily samples</strong>
<a href="#purchase">PerfectPay</a>
<a href="#static">Funnel</a>
<?php foreach ($sampleDays as $d): ?>
<a href="#day<?= $d ?>">Day <?= $d ?></a>
<?php endforeach; ?>
<a href="#weekly">Week 1</a>
</nav>

<section id="purchase">
<h2>PerfectPay — purchase access email</h2>
<p class="muted">Sent automatically when payment is approved via webhook</p>
<p class="muted"><?= htmlspecialchars($purchaseTpl['subject']) ?></p>
<iframe srcdoc="<?= htmlspecialchars($purchaseTpl['html'], ENT_QUOTES) ?>"></iframe>
</section>

<section id="static">
<h2>Funnel — static templates</h2>
<p class="muted">Welcome, tracking, dashboard, support, etc.</p>
<?php foreach ($staticTemplates as $name => $tpl): ?>
<h3><?= htmlspecialchars($name) ?></h3>
<p class="muted"><?= htmlspecialchars($tpl['subject']) ?></p>
<iframe srcdoc="<?= htmlspecialchars($tpl['html'], ENT_QUOTES) ?>"></iframe>
<?php endforeach; ?>
</section>

<div class="grid">
<?php foreach ($sampleDays as $d): ?>
<section id="day<?= $d ?>">
<h2>Day <?= $d ?> — what the user receives</h2>
<p class="muted">1–2 random detection alerts (different content every day)</p>

<h3>🔔 Alert #1 — event_detected</h3>
<p class="muted"><?= htmlspecialchars($dailySamples[$d]['event1']['subject']) ?></p>
<iframe srcdoc="<?= htmlspecialchars($dailySamples[$d]['event1']['html'], ENT_QUOTES) ?>"></iframe>

<h3>🔔 Alert #2 — event_detected (evening)</h3>
<p class="muted"><?= htmlspecialchars($dailySamples[$d]['event2']['subject']) ?></p>
<iframe srcdoc="<?= htmlspecialchars($dailySamples[$d]['event2']['html'], ENT_QUOTES) ?>"></iframe>

<h3>📊 Morning — daily_progress</h3>
<p class="muted"><?= htmlspecialchars($dailySamples[$d]['progress']['subject']) ?></p>
<iframe srcdoc="<?= htmlspecialchars($dailySamples[$d]['progress']['html'], ENT_QUOTES) ?>"></iframe>
</section>
<?php endforeach; ?>

<section id="weekly">
<h2>Weekly summary (days 7, 14 and 21)</h2>
<p class="muted"><?= htmlspecialchars($weeklySummaryTpl['subject']) ?></p>
<iframe srcdoc="<?= htmlspecialchars($weeklySummaryTpl['html'], ENT_QUOTES) ?>"></iframe>
</section>
</div>

</body>
</html>

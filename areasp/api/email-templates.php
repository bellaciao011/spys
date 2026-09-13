<?php

function areaspy_brand_name() {
    static $name;
    if ($name === null) {
        $f = __DIR__ . '/config.php';
        $c = file_exists($f) ? require $f : [];
        $name = (string) ($c['brand_name'] ?? 'Stalkea');
    }
    return $name;
}

function areaspy_brand_ai() {
    static $name;
    if ($name === null) {
        $f = __DIR__ . '/config.php';
        $c = file_exists($f) ? require $f : [];
        $name = (string) ($c['brand_name_ai'] ?? (areaspy_brand_name() . ' AI'));
    }
    return $name;
}

function zapp_urls($panelUrl) {
    $panel = rtrim($panelUrl, '/');
    return [
        'login' => $panel . '/',
        'panel' => $panel . '/',
        'purchase_login' => $panel . '/',
        'phone' => $panel . '/collect-phone/',
        'track' => $panel . '/app/',
        'apps' => $panel . '/app/applications/',
        'chat' => $panel . '/chat/',
        'chat_analysis' => $panel . '/chat/#analise',
        'chat_refund' => $panel . '/chat/#reembolso',
    ];
}

/** Visible panel URL + login link — avoids customers opening wrong sites. */
function zapp_panel_access_block($loginUrl) {
    $safe = htmlspecialchars($loginUrl, ENT_QUOTES, 'UTF-8');
    return '<div style="margin:18px 0 0;background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:14px 16px;text-align:center;">
<p style="margin:0 0 6px;font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.05em;">Your panel</p>
<p style="margin:0;font-size:13px;color:#475569;">Sign in with your <strong>purchase email</strong> — no password.</p>
<p style="margin:10px 0 0;font-size:13px;">
<a href="' . $safe . '" style="color:#128c7e;font-weight:700;text-decoration:none;word-break:break-all;">' . $safe . '</a>
</p>
</div>';
}

function zapp_panel_cta_button($loginUrl, $label = 'Access your panel') {
    $safe = htmlspecialchars($loginUrl, ENT_QUOTES, 'UTF-8');
    $label = htmlspecialchars($label, ENT_QUOTES, 'UTF-8');
    return '<p style="margin:18px 0 0;text-align:center;">
<a href="' . $safe . '" style="display:inline-block;background:#25d366;color:#052e16;text-decoration:none;font-weight:700;padding:12px 22px;border-radius:8px;font-size:13px;">' . $label . '</a>
</p>';
}

function email_templates($panelUrl) {
    $u = zapp_urls($panelUrl);

    return [
        'welcome' => [
            'subject' => '✓ Your Stalkea panel is active',
            'html' => email_layout(
                'Welcome back',
                '<p>Your secure diagnostic panel has been activated with the email you provided.</p>
                <p><strong>Next step:</strong> enter the phone number you want to monitor and start the forensic scan.</p>
                <p style="font-size:12px;color:#64748b;">End-to-end encrypted · One number per account</p>',
                'Access Panel',
                $u['phone'],
                ['label' => 'Contact 24/7 support', 'url' => $u['chat']],
                $u['chat']
            ),
        ],
        'phone_registered' => [
            'subject' => 'Target registered — tracking started',
            'html' => email_layout(
                'Monitored target linked',
                '<p>The phone number has been registered on your license.</p>
                <p>Our forensic engine is now syncing intercept buffers. Complete the tracking screen to unlock the full diagnostic dashboard.</p>',
                'Continue tracking',
                $u['track'],
                ['label' => 'Need help?', 'url' => $u['chat']],
                $u['chat']
            ),
        ],
        'tracking_done' => [
            'subject' => 'Tracking complete — data collected',
            'html' => email_layout(
                'Analysis in progress',
                '<p>Device tracking finished successfully.</p>
                <p>Intercepted data is being processed across 9 diagnostic modules. Open your panel to explore SMS, calls, location and live intercept feed.</p>',
                'Open diagnostic panel',
                $u['apps'],
                ['label' => 'Talk to Ana — Support', 'url' => $u['chat']],
                $u['chat']
            ),
        ],
        'dashboard_ready' => [
            'subject' => 'Your diagnostic dashboard is ready',
            'html' => email_layout(
                '9 modules syncing live',
                '<p>Your Stalkea dashboard is live with real-time intercept feed.</p>
                <ul style="margin:12px 0;padding-left:18px;color:#475569;font-size:13px;">
                <li>WhatsApp, Instagram, SMS mirrors</li>
                <li>GPS &amp; location timeline</li>
                <li>Behavior risk score (AI v3.2)</li>
                <li>Deep forensic analysis (10–20 days)</li>
                </ul>
                <p style="font-size:12px;color:#64748b;">Due to high data demand, cloned social apps unlock after the analysis window. SMS, calls and Wi-Fi are available now.</p>',
                'Access dashboard',
                $u['apps'],
                ['label' => 'Analysis status', 'url' => $u['chat_analysis']],
                $u['chat']
            ),
        ],
        'report_ready' => [
            'subject' => 'Forensic data sync update',
            'html' => email_layout(
                'New data available',
                '<p>Additional intercept data has been synced to your panel.</p>
                <p>Open your dashboard to review messages, location shifts and risk indicators.</p>',
                'Open dashboard',
                $u['apps'],
                ['label' => 'Support chat', 'url' => $u['chat']],
                $u['chat']
            ),
        ],
        'report_reminder' => [
            'subject' => 'New activity on your monitored target',
            'html' => email_layout(
                'Have you checked your panel?',
                '<p>Our forensic engine detected activity on the monitored device.</p>
                <p>Review SMS, calls, location and live intercept feed in your diagnostic dashboard.</p>',
                'Open panel now',
                $u['apps'],
                ['label' => 'Get help via chat', 'url' => $u['chat']],
                $u['chat']
            ),
        ],
        'unlock_reminder' => [
            'subject' => 'Cloned apps — deep analysis in progress',
            'html' => email_layout(
                'Deep forensic analysis running',
                '<p>Cloned apps (WhatsApp, Instagram, etc.) are decrypting on our secure cluster.</p>
                <p>Due to <strong>high data demand</strong>, full mirror access takes <strong>10 to 20 days</strong>. Buffered previews are available now in your panel.</p>',
                'Open cloned apps',
                $u['login'],
                ['label' => 'Check analysis status', 'url' => $u['chat_analysis']],
                $u['chat']
            ),
        ],
        'unlock_code_pending' => [
            'subject' => 'Analysis session paused',
            'html' => email_layout(
                'Deep analysis continues in background',
                '<p>Your cloned app mirrors are still processing on our secure cluster.</p>
                <p>Due to high data volume, this takes longer than standard. SMS, calls and Wi-Fi remain available while you wait.</p>',
                'View live progress',
                $u['apps'],
                null,
                $u['chat']
            ),
        ],
        'retention' => [
            'subject' => '⚠ New activity on monitored target',
            'html' => email_layout(
                'Live intercept alert',
                '<p>Our forensic engine detected <strong>new activity</strong> on the monitored device.</p>
                <p>Review messages, location shifts and risk flags in your panel before the analysis window closes.</p>',
                'Review data now',
                $u['login'],
                ['label' => '24/7 support', 'url' => $u['chat']],
                $u['chat']
            ),
        ],
        'high_risk_detected' => [
            'subject' => 'HIGH risk behavior flagged — review required',
            'html' => email_layout(
                'Behavior risk score elevated',
                '<p>AI model v3.2 flagged atypical patterns on the monitored target.</p>
                <p>Open your dashboard to review flagged conversations, suspicious Wi-Fi and social activity.</p>',
                'View risk dashboard',
                $u['login'],
                ['label' => 'Talk to support', 'url' => $u['chat']],
                $u['chat']
            ),
        ],
        'support_intro' => [
            'subject' => 'Ana from Stalkea Support — how can we help?',
            'html' => email_layout(
                'We are here 24/7',
                '<p>I\'m Ana, your Stalkea specialist.</p>
                <p>I can help you:</p>
                <ul style="margin:12px 0;padding-left:18px;color:#475569;font-size:13px;">
                <li>Check deep analysis status (10–20 days)</li>
                <li>Fix access or tracking issues</li>
                <li>Answer questions before any refund request</li>
                </ul>',
                'Open support chat',
                $u['chat'],
                ['label' => 'Analysis status', 'url' => $u['chat_analysis']],
                $u['chat']
            ),
        ],
        'delivery_proof' => [
            'subject' => 'Your license is active — data syncing',
            'html' => email_layout(
                'Service delivery in progress',
                '<p>Your Stalkea license includes access to cloned app mirrors, location data and live intercept modules.</p>
                <p>SMS, calls and Wi-Fi are available now. Cloned social apps complete after the deep analysis window (10–20 days due to high data demand).</p>
                <p style="font-size:12px;color:#b45309;">Questions? Our support team resolves 94% of issues without a refund.</p>',
                'Open your panel',
                $u['apps'],
                ['label' => 'Chat with Ana', 'url' => $u['chat']],
                $u['chat']
            ),
        ],
    ];
}

function analysis_progress_template($panelUrl, array $meta) {
    $u = zapp_urls($panelUrl);
    $day = max(1, (int) ($meta['day_num'] ?? 1));
    $pct = max(1, min(92, (int) ($meta['pct'] ?? 8)));
    $daysLeft = htmlspecialchars($meta['days_left'] ?? '10–20 days', ENT_QUOTES, 'UTF-8');

    return [
        'subject' => '📊 Day ' . $day . ' — Deep analysis ' . $pct . '% complete',
        'html' => email_layout(
            'Deep forensic analysis — Day ' . $day,
            '<p>Due to <strong>high data demand</strong> on the monitored device, deep clone analysis will take <strong>several days</strong> to complete.</p>
            <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:10px;padding:18px;margin:18px 0;">
            <p style="margin:0 0 10px;font-size:14px;color:#991b1b;"><strong>Progress: ' . $pct . '%</strong> · Day ' . $day . '</p>
            <div style="height:8px;background:#fee2e2;border-radius:4px;overflow:hidden;">
            <div style="height:100%;width:' . $pct . '%;background:linear-gradient(90deg,#dc2626,#ef4444);border-radius:4px;"></div></div>
            <p style="margin:12px 0 0;font-size:12px;color:#7f1d1d;">Estimated remaining: <strong style="color:#991b1b;">' . $daysLeft . '</strong></p>
            <p style="margin:8px 0 0;font-size:11px;color:#9f1239;">Window: 10 to 20 days due to elevated data demand.</p></div>
            <p>Cloned social apps unlock after the analysis window. SMS, calls and Wi-Fi remain available in your panel now.</p>
            <p style="font-size:12px;color:#64748b;">You will receive one progress update per day until analysis completes.</p>',
            'View live progress',
            $u['login'],
            ['label' => 'Check status via chat', 'url' => $u['chat_analysis']],
            $u['chat']
        ),
    ];
}

function zapspy_card_layout($headerSuffix, $reportId, $bodyHtml, $footerText = '', $loginUrl = '') {
    $reportId = htmlspecialchars($reportId, ENT_QUOTES, 'UTF-8');
    $footer = $footerText ?: 'Use only the official link below — stalkea.app';
    $footerLink = '';
    if ($loginUrl !== '') {
        $safe = htmlspecialchars($loginUrl, ENT_QUOTES, 'UTF-8');
        $footerLink = '<p style="margin:8px 0 0;font-size:12px;">
<a href="' . $safe . '" style="color:#128c7e;text-decoration:underline;word-break:break-all;">' . $safe . '</a>
</p>';
    }

    return '<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:Inter,Arial,Helvetica,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:28px 12px;">
<tr><td align="center">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border:1px solid #e2e8f0;border-radius:14px;overflow:hidden;box-shadow:0 1px 3px rgba(15,23,42,0.06);">
<tr><td style="padding:20px 24px;background:linear-gradient(135deg,#128c7e,#25d366);">
<div style="font-size:17px;line-height:1.4;">
<span style="display:inline-block;background:#fff;color:#047857;font-weight:800;padding:2px 8px;border-radius:5px;">Stalkea</span>
<span style="color:#f8fafc;font-weight:600;"> AI — ' . htmlspecialchars($headerSuffix, ENT_QUOTES, 'UTF-8') . '</span>
</div>
<div style="margin-top:8px;font-size:13px;color:rgba(255,255,255,0.9);">Report ' . $reportId . '</div>
</td></tr>
<tr><td style="padding:24px 24px 20px;color:#0f172a;font-size:14px;line-height:1.6;">' . $bodyHtml . '</td></tr>
</table>
<p style="margin:16px 0 0;font-size:12px;color:#64748b;text-align:center;max-width:560px;">' . htmlspecialchars($footer, ENT_QUOTES, 'UTF-8') . $footerLink . '</p>
</td></tr></table></body></html>';
}

function zapspy_data_row($label, $value) {
    return '<tr>
<td style="padding:6px 0;color:#94a3b8;font-size:13px;width:90px;vertical-align:top;">' . htmlspecialchars($label, ENT_QUOTES, 'UTF-8') . '</td>
<td style="padding:6px 0;color:#0f172a;font-size:14px;font-weight:700;">' . htmlspecialchars($value, ENT_QUOTES, 'UTF-8') . '</td>
</tr>';
}

function zapspy_event_box($icon, $text) {
    return '<div style="margin-top:18px;background:#f1f5f9;border-radius:10px;padding:14px 16px;border-left:4px solid #3b82f6;">
<div style="font-size:11px;color:#94a3b8;margin-bottom:6px;text-transform:uppercase;letter-spacing:0.04em;">Event details</div>
<div style="font-size:15px;color:#0f172a;font-weight:600;">' . htmlspecialchars($icon . ' ' . $text, ENT_QUOTES, 'UTF-8') . '</div>
<div style="margin-top:8px;color:#94a3b8;font-size:18px;line-height:1;">...</div>
</div>';
}

function daily_progress_template($panelUrl, array $meta) {
    $u = zapp_urls($panelUrl);
    $reportId = $meta['report_id'] ?? 'ZD-UNKNOWN';
    $day = max(1, (int) ($meta['day_num'] ?? 1));
    $phase = $meta['phase'] ?? 'Request received';
    $pct = max(1, min(92, (int) ($meta['pct'] ?? 8)));
    $phone = $meta['phone'] ?? '+55 9****-****';
    $daysLeft = htmlspecialchars($meta['days_left'] ?? '10–20 days', ENT_QUOTES, 'UTF-8');
    $statusLine = htmlspecialchars($meta['status_line'] ?? 'Buffers are syncing on our secure cluster.', ENT_QUOTES, 'UTF-8');

    $body = '<p style="margin:0 0 16px;color:#334155;">Your monitoring request is being processed on our secure cluster.</p>
<table cellpadding="0" cellspacing="0" width="100%" style="margin:0 0 4px;">'
    . zapspy_data_row('Report', $reportId)
    . zapspy_data_row('Day', 'Day ' . $day)
    . zapspy_data_row('Phase', $phase)
    . zapspy_data_row('Phone', $phone)
    . zapspy_data_row('Progress', $pct . '%')
    . '</table>
<div style="margin-top:16px;background:#f8fafc;border-radius:10px;padding:14px 16px;border-left:4px solid #22c55e;">
<div style="font-size:11px;color:#94a3b8;margin-bottom:6px;">Status update</div>
<div style="font-size:14px;color:#0f172a;">' . $statusLine . ' Estimated remaining: <strong>' . $daysLeft . '</strong>.</div>
</div>'
    . zapp_panel_access_block($u['login'])
    . zapp_panel_cta_button($u['login'], 'Access your panel')
    . '';

    return [
        'subject' => '🔔 Report ' . $reportId . ' — Day ' . $day . ': ' . $phase,
        'html' => zapspy_card_layout('Progress update', $reportId, $body, '', $u['login']),
    ];
}

function weekly_summary_template($panelUrl, array $meta) {
    $u = zapp_urls($panelUrl);
    $reportId = $meta['report_id'] ?? 'ZD-UNKNOWN';
    $week = max(1, (int) ($meta['week_num'] ?? 1));
    $day = max(1, (int) ($meta['day_num'] ?? 7));
    $phone = $meta['phone'] ?? '+55 9****-****';
    $pct = max(1, min(92, (int) ($meta['pct'] ?? 20)));
    $events = (int) ($meta['events_captured'] ?? 12);
    $messages = (int) ($meta['messages_intercepted'] ?? 7);
    $calls = (int) ($meta['calls_logged'] ?? 2);
    $locations = (int) ($meta['location_pings'] ?? 3);
    $photos = (int) ($meta['photos_indexed'] ?? 2);
    $riskFlags = (int) ($meta['risk_flags'] ?? 1);

    $body = '<p style="margin:0 0 14px;color:#334155;">Weekly monitoring summary for your target. Data continues syncing on our secure cluster.</p>
<table cellpadding="0" cellspacing="0" width="100%" style="margin:0 0 4px;">'
    . zapspy_data_row('Report', $reportId)
    . zapspy_data_row('Week', 'Week ' . $week . ' · Day ' . $day)
    . zapspy_data_row('Phone', $phone)
    . zapspy_data_row('Progress', $pct . '%')
    . '</table>
<div style="margin-top:16px;background:#f8fafc;border-radius:10px;padding:14px 16px;border-left:4px solid #3b82f6;">
<div style="font-size:11px;color:#94a3b8;margin-bottom:8px;text-transform:uppercase;letter-spacing:0.04em;">Captured this week</div>
<table cellpadding="0" cellspacing="0" width="100%">'
    . zapspy_data_row('Total events', (string) $events)
    . zapspy_data_row('Messages', (string) $messages)
    . zapspy_data_row('Calls', (string) $calls)
    . zapspy_data_row('Location pings', (string) $locations)
    . zapspy_data_row('Photos indexed', (string) $photos)
    . zapspy_data_row('Risk flags', (string) $riskFlags)
    . '</table>
</div>
<p style="margin:14px 0 0;font-size:13px;color:#64748b;">Deep clone modules are still processing due to high data demand. Your panel shows buffered previews now.</p>'
    . zapp_panel_access_block($u['login'])
    . zapp_panel_cta_button($u['login'], 'Access your panel')
    . '';

    return [
        'subject' => '🔔 Week ' . $week . ' summary — ' . $events . ' events captured · ' . $reportId,
        'html' => zapspy_card_layout('Weekly summary', $reportId, $body, '', $u['login']),
    ];
}

function event_detected_template($panelUrl, array $meta) {
    $u = zapp_urls($panelUrl);
    $reportId = $meta['report_id'] ?? 'ZD-UNKNOWN';
    $phone = $meta['phone'] ?? '+55 9****-****';
    $when = $meta['when'] ?? 'Today • 12:00';
    $icon = $meta['event_icon'] ?? '💬';
    $text = $meta['event_text'] ?? 'New message intercepted';

    $body = '<p style="margin:0 0 14px;color:#334155;">A new event was captured on the monitored number:</p>
<table cellpadding="0" cellspacing="0" width="100%">'
    . zapspy_data_row('Phone', $phone)
    . zapspy_data_row('When', $when)
    . '</table>'
    . zapspy_event_box($icon, $text)
    . zapp_panel_access_block($u['login'])
    . zapp_panel_cta_button($u['login'], 'Access your panel')
    . '';

    return [
        'subject' => $meta['subject'] ?? ('🔔 New event detected · ' . $reportId),
        'html' => zapspy_card_layout('Event update', $reportId, $body, '', $u['login']),
    ];
}

function purchase_first_name(array $meta) {
    if (!empty($meta['first_name'])) {
        return trim((string) $meta['first_name']);
    }
    $full = trim((string) ($meta['full_name'] ?? ''));
    if ($full === '') {
        return 'there';
    }
    $parts = preg_split('/\s+/', $full);
    return $parts[0] ?: 'there';
}

/** Post-purchase access email — sent via PerfectPay webhook. */
function purchase_access_template($panelUrl, array $meta = []) {
    $u = zapp_urls($panelUrl);
    $loginUrl = $u['purchase_login'];
    $firstName = htmlspecialchars(purchase_first_name($meta), ENT_QUOTES, 'UTF-8');
    $email = htmlspecialchars($meta['email'] ?? '', ENT_QUOTES, 'UTF-8');
    $productLine = '';
    if (!empty($meta['product_name'])) {
        $productLine = '<p style="margin:0 0 14px;font-size:13px;color:#64748b;">Product: <strong style="color:#0f172a;">'
            . htmlspecialchars($meta['product_name'], ENT_QUOTES, 'UTF-8') . '</strong></p>';
    }

    $body = '
    <p style="margin:0 0 12px;">Hello <strong>' . $firstName . '</strong>,</p>
    <p style="margin:0 0 16px;">Thank you for your purchase. <strong>Your secure diagnostic panel is ready.</strong></p>
    ' . $productLine . '
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;margin:20px 0;">
    <tr><td style="padding:18px 20px;">
    <p style="margin:0 0 12px;font-size:12px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.05em;">Members Area</p>
    <p style="margin:0 0 8px;font-size:13px;color:#475569;"><strong style="color:#0f172a;">Panel URL</strong><br>
    <a href="' . htmlspecialchars($loginUrl, ENT_QUOTES, 'UTF-8') . '" style="color:#128c7e;text-decoration:none;word-break:break-all;">'
        . htmlspecialchars($loginUrl, ENT_QUOTES, 'UTF-8') . '</a></p>
    <p style="margin:12px 0 0;font-size:13px;color:#475569;"><strong style="color:#0f172a;">Login email</strong><br>' . $email . '</p>
    </td></tr></table>
    <p style="margin:0 0 16px;padding:14px 16px;background:#fef2f2;border:1px solid #fecaca;border-radius:8px;color:#dc2626;font-size:13px;line-height:1.55;">
    ⚠️ <strong>Please do not cancel or ask for a refund until the end of the process, or all progress will be lost.</strong> ⚠️
    </p>
    <p style="margin:0;">Inside your panel you will find the setup guide and instructions to get started with your forensic scan.</p>';

    return [
        'subject' => 'Welcome to Stalkea — Your access is ready',
        'html' => email_layout(
            'Your access is ready',
            $body,
            'Access Your Panel',
            $loginUrl,
            ['label' => 'Need help? 24/7 Support', 'url' => $u['chat']],
            $u['chat']
        ),
    ];
}

function email_layout($title, $body, $ctaLabel, $ctaUrl, $secondary = null, $footerChatUrl = '#') {
    $year = date('Y');
    $secondaryHtml = '';
    if ($secondary && !empty($secondary['url'])) {
        $secondaryHtml = '<p style="margin:16px 0 0;text-align:center;">
            <a href="' . htmlspecialchars($secondary['url']) . '" style="color:#25d366;font-size:13px;text-decoration:underline;">' .
            htmlspecialchars($secondary['label'] ?? 'Learn more') . '</a></p>';
    }

    return '<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:Inter,Arial,Helvetica,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:28px 12px;">
<tr><td align="center">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border:1px solid #e2e8f0;border-radius:14px;overflow:hidden;box-shadow:0 1px 3px rgba(15,23,42,0.06);">
<tr><td style="padding:20px 24px;background:linear-gradient(135deg,#128c7e,#25d366);">
<table width="100%"><tr>
<td><strong style="color:#fff;font-size:18px;">🛡️ Stalkea</strong><br>
<span style="color:rgba(255,255,255,0.92);font-size:11px;">Secure diagnostic panel</span></td>
<td align="right" style="color:rgba(255,255,255,0.9);font-size:10px;font-weight:600;">LIVE</td>
</tr></table>
</td></tr>
<tr><td style="padding:24px 24px 20px;color:#0f172a;">
<h1 style="margin:0 0 14px;font-size:20px;color:#0f172a;line-height:1.3;">' . $title . '</h1>
<div style="font-size:14px;line-height:1.65;color:#475569;">' . $body . '</div>
<p style="margin:24px 0 0;text-align:center;">
<a href="' . htmlspecialchars($ctaUrl) . '" style="display:inline-block;background:#25d366;color:#052e16;text-decoration:none;font-weight:700;padding:13px 26px;border-radius:8px;font-size:14px;">' . htmlspecialchars($ctaLabel) . '</a>
</p>' . $secondaryHtml . '
</td></tr>
<tr><td style="padding:16px 24px;border-top:1px solid #e2e8f0;font-size:11px;color:#94a3b8;text-align:center;line-height:1.6;background:#f8fafc;">
End-to-end encrypted · One number per account<br>
Use only official links — stalkea.app<br>
<a href="' . htmlspecialchars($ctaUrl) . '" style="color:#64748b;text-decoration:underline;word-break:break-all;">' . htmlspecialchars($ctaUrl) . '</a> ·
<a href="' . htmlspecialchars($footerChatUrl) . '" style="color:#64748b;text-decoration:underline;">Support</a><br>
Stalkea &copy; ' . $year . ' · Authorized auditing only
</td></tr>
</table>
</td></tr></table></body></html>';
}

if (php_sapi_name() !== 'cli' && realpath($_SERVER['SCRIPT_FILENAME'] ?? '') === realpath(__FILE__)) {
    header('Location: preview-emails.php');
    exit;
}

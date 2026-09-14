<?php

require_once __DIR__ . '/analysis-state.php';
require_once __DIR__ . '/subscribers.php';

function daily_report_id(array $sub) {
    if (!empty($sub['report_id'])) {
        return $sub['report_id'];
    }
    $seed = strtolower($sub['email'] ?? 'user');
    $hash = strtoupper(substr(md5($seed), 0, 6));
    return 'ZD-' . $hash;
}

function daily_contact_name(array $sub) {
    if (!empty($sub['contact_name'])) {
        return $sub['contact_name'];
    }
    $email = $sub['email'] ?? 'contact';
    $local = explode('@', $email)[0];
    $local = preg_replace('/[^a-zA-Z]/', '', $local);
    if (strlen($local) >= 2) {
        return strtolower($local);
    }
    return 'contact';
}

function daily_phone_display(array $sub) {
    if (!empty($sub['phone_e164'])) {
        return $sub['phone_e164'];
    }
    if (!empty($sub['phone_number'])) {
        return $sub['phone_number'];
    }
    return '+55 9****-****';
}

function daily_progress_phases() {
    return [
        1 => 'Request received',
        2 => 'Number validation',
        3 => 'Carrier handshake',
        4 => 'TLS buffer capture',
        5 => 'Social shard sync',
        6 => 'Media attachment index',
        7 => 'Behavior model warmup',
        8 => 'Deep clone queue',
        9 => 'Mirror decrypt pass',
        10 => 'Priority data merge',
        11 => 'Intercept cross-check',
        12 => 'Risk flag scan',
        13 => 'Location timeline build',
        14 => 'Conversation pattern map',
        15 => 'Contact graph expansion',
        16 => 'Encrypted payload split',
        17 => 'Session token replay',
        18 => 'Multi-device correlation',
        19 => 'Night-activity profiling',
        20 => 'Social mirror stabilization',
        21 => 'Attachment hash matching',
        22 => 'Geo-fence anomaly scan',
        23 => 'Voice pattern indexing',
        24 => 'Deleted message recovery',
        25 => 'Cross-app identity link',
        26 => 'Behavior drift analysis',
        27 => 'High-priority shard merge',
        28 => 'Final decrypt sweep',
        29 => 'Integrity verification pass',
        30 => 'Pre-release buffer lock',
    ];
}

function daily_all_events() {
    return [
        ['icon' => '📷', 'text' => 'Photo detected in monitored chat'],
        ['icon' => '💬', 'text' => 'New message intercepted'],
        ['icon' => '📷', 'text' => 'Image attachment captured'],
        ['icon' => '💬', 'text' => 'Message snippet: "see you tonight"'],
        ['icon' => '📷', 'text' => 'Gallery upload spike detected'],
        ['icon' => '💬', 'text' => 'Quick reply sent on active thread'],
        ['icon' => '📹', 'text' => 'Video note received'],
        ['icon' => '📷', 'text' => 'Screenshot activity detected'],
        ['icon' => '💬', 'text' => 'Deleted chat fragment recovered'],
        ['icon' => '📷', 'text' => 'Profile photo updated'],
        ['icon' => '💬', 'text' => 'Typing burst on private chat'],
        ['icon' => '🎵', 'text' => 'Voice note ({audio}s) captured'],
        ['icon' => '💬', 'text' => 'Message edited after send'],
        ['icon' => '📷', 'text' => 'Photo forwarded to new contact'],
        ['icon' => '💬', 'text' => 'Emoji reaction on old thread'],
        ['icon' => '📍', 'text' => 'Location shared in chat'],
        ['icon' => '💬', 'text' => 'Group mention captured'],
        ['icon' => '📷', 'text' => 'Camera roll sync spike'],
        ['icon' => '💬', 'text' => 'Late-night message logged'],
        ['icon' => '📞', 'text' => 'Outgoing call logged'],
        ['icon' => '💬', 'text' => 'Message snippet: "call me later"'],
        ['icon' => '📷', 'text' => 'Blurred image payload indexed'],
        ['icon' => '🔒', 'text' => 'App opened after hours'],
        ['icon' => '💬', 'text' => 'Unread thread activity spike'],
        ['icon' => '📍', 'text' => 'GPS shift detected'],
        ['icon' => '📷', 'text' => 'Story media captured'],
        ['icon' => '💬', 'text' => 'Voice-to-text message flagged'],
        ['icon' => '🌐', 'text' => 'Unknown Wi-Fi connection'],
        ['icon' => '💬', 'text' => 'Message snippet: "don\'t tell anyone"'],
        ['icon' => '👀', 'text' => 'Story viewed twice'],
        ['icon' => '📷', 'text' => 'Selfie attachment detected'],
        ['icon' => '💬', 'text' => 'Pinned message changed'],
        ['icon' => '🚗', 'text' => 'Route deviation flagged'],
        ['icon' => '📷', 'text' => 'Media download burst'],
        ['icon' => '💬', 'text' => 'Contact added to favorites'],
        ['icon' => '🔋', 'text' => 'Device online after midnight'],
        ['icon' => '📍', 'text' => 'Live location started'],
        ['icon' => '💬', 'text' => 'Archive chat reopened'],
        ['icon' => '📷', 'text' => 'Photo deleted after viewing'],
        ['icon' => '🎵', 'text' => 'Voice note forwarded'],
        ['icon' => '💬', 'text' => 'Message snippet: "I miss you"'],
        ['icon' => '📞', 'text' => 'Missed call pattern logged'],
        ['icon' => '🌙', 'text' => 'Late-night session opened'],
        ['icon' => '📷', 'text' => 'HD image transfer logged'],
        ['icon' => '💬', 'text' => 'Reply within 2 minutes detected'],
        ['icon' => '🔔', 'text' => 'Notification spike detected'],
    ];
}

function daily_random_events($seed, $dayNum = 1, $slot = 1) {
    $events = daily_all_events();
    $idx = abs(crc32($seed . 'event' . (int) $dayNum . 'slot' . (int) $slot)) % count($events);
    $event = $events[$idx];

    if (strpos($event['text'], '{audio}') !== false) {
        $secs = 12 + (abs(crc32($seed . 'audio' . $dayNum . $slot)) % 46);
        $event['text'] = str_replace('{audio}', (string) $secs, $event['text']);
    }

    return $event;
}

function daily_event_subject($phone, array $event, $reportId, $seed, $dayNum = 1, $slot = 1) {
    $patterns = [
        '🔔 {icon} Detected on {phone} · {report}',
        '🔔 New capture — {phone}',
        '🔔 {icon} Activity alert · {report}',
        '🔔 {phone} · {event}',
        '🔔 Monitoring ping · {report}',
        '🔔 Live intercept — {phone}',
        '🔔 {report} — new signal on {phone}',
        '🔔 {icon} Event logged · {phone}',
        '🔔 Timeline alert · {report}',
        '🔔 {phone} — suspicious activity',
    ];
    $idx = abs(crc32($seed . 'subj' . $dayNum . 'slot' . $slot)) % count($patterns);
    $subject = $patterns[$idx];
    $eventShort = mb_strlen($event['text']) > 42 ? mb_substr($event['text'], 0, 39) . '...' : $event['text'];
    return str_replace(
        ['{phone}', '{icon}', '{report}', '{event}'],
        [$phone, $event['icon'], $reportId, $eventShort],
        $subject
    );
}

function daily_random_when($seed, $dayNum = 1, $slot = 1) {
    $offsets = ['Just now', 'Today', 'Earlier today', '3 hours ago', 'This morning', 'This afternoon'];
    $pick = $offsets[abs(crc32($seed . 'when' . $dayNum . $slot)) % count($offsets)];
    $hour = 8 + (abs(crc32($seed . 'hour' . $dayNum . $slot)) % 14);
    $min = abs(crc32($seed . 'min' . $dayNum . $slot)) % 60;
    return $pick . ' • ' . sprintf('%02d:%02d', $hour, $min);
}

function daily_progress_status_line($dayNum, $seed = '') {
    $lines = [
        1 => 'Request queued on secure cluster. Initial handshake pending.',
        2 => 'Number validation passed. Carrier node responding.',
        3 => 'TLS buffers opening on target shard.',
        4 => 'Social mirror fragments arriving in batches.',
        5 => 'Media index building from intercepted payloads.',
        6 => 'Behavior model warming up on historical signals.',
        7 => 'Deep clone queue advancing — week 1 checkpoint reached.',
        8 => 'Mirror decrypt pass running on priority threads.',
        9 => 'Cross-shard merge at 40% — elevated data demand.',
        10 => 'Intercept cross-check flagged 2 new patterns.',
        11 => 'Risk scan completed on overnight activity window.',
        12 => 'Location timeline expanded with 6 new pings.',
        13 => 'Conversation map updated with fresh message nodes.',
        14 => 'Contact graph branch expanded on secondary device.',
        15 => 'Encrypted payload split resolved on 3 channels.',
        16 => 'Session token replay matched to active device.',
        17 => 'Multi-device correlation linked 2 endpoints.',
        18 => 'Night-activity profile enriched with new events.',
        19 => 'Social mirror stabilizing after buffer spike.',
        20 => 'Attachment hash index grew by 14 entries.',
        21 => 'Week 3 summary window — geo anomalies under review.',
        22 => 'Voice pattern index merged with call metadata.',
        23 => 'Deleted message recovery found 3 fragments.',
        24 => 'Cross-app identity link confirmed on messaging layer.',
        25 => 'Behavior drift score shifted on monitored number.',
        26 => 'High-priority shard merge running in background.',
        27 => 'Final decrypt sweep started on remaining buffers.',
        28 => 'Integrity verification pass at 88% completion.',
        29 => 'Pre-release buffer lock scheduled for next cycle.',
        30 => 'Analysis window closing — final commits in progress.',
    ];
    if (isset($lines[$dayNum])) {
        return $lines[$dayNum];
    }
    $fallback = [
        'Secure buffers syncing due to high data demand.',
        'Forensic cluster processing new intercept batches.',
        'Mirror nodes rebalancing — analysis continues.',
    ];
    return $fallback[abs(crc32($seed . 'st' . $dayNum)) % count($fallback)];
}

function daily_analysis_day(array $sub) {
    $start = $sub['analysis_start'] ?? $sub['first_seen'] ?? date('c');
    return analysis_get_state($start);
}

function daily_build_progress_meta(array $sub) {
    $state = daily_analysis_day($sub);
    $phases = daily_progress_phases();
    $dayNum = $state['day_num'];
    $phase = $phases[$dayNum] ?? ('Deep analysis stage ' . $dayNum);

    return [
        'report_id' => daily_report_id($sub),
        'day_num' => $dayNum,
        'pct' => $state['pct'],
        'days_left' => $state['days_left'],
        'phase' => $phase,
        'phone' => daily_phone_display($sub),
        'status_line' => daily_progress_status_line($dayNum, $sub['email'] ?? ''),
    ];
}

function daily_build_event_meta(array $sub, $slot = 1) {
    $email = $sub['email'] ?? '';
    $state = daily_analysis_day($sub);
    $dayNum = $state['day_num'];
    $slot = max(1, (int) $slot);
    $event = daily_random_events($email, $dayNum, $slot);
    $reportId = daily_report_id($sub);
    $phone = daily_phone_display($sub);

    return [
        'report_id' => $reportId,
        'phone' => $phone,
        'when' => daily_random_when($email, $dayNum, $slot),
        'event_icon' => $event['icon'],
        'event_text' => $event['text'],
        'subject' => daily_event_subject($phone, $event, $reportId, $email, $dayNum, $slot),
        'day_num' => $dayNum,
        'slot' => $slot,
    ];
}

/** ~75% of users get a 2nd random alert the same day. */
function daily_send_second_event_today($email, $date = null) {
    $date = $date ?: date('Y-m-d');
    return (abs(crc32(strtolower(trim($email)) . '|ev2|' . $date)) % 100) < 75;
}

function daily_progress_milestone_day($dayNum) {
    return in_array((int) $dayNum, [1, 7, 14, 21, 30], true);
}

function daily_weekly_milestone($dayNum) {
    if (in_array((int) $dayNum, [7, 14, 21], true)) {
        return (int) ($dayNum / 7);
    }
    return 0;
}

function daily_build_weekly_meta(array $sub) {
    $email = $sub['email'] ?? '';
    $state = daily_analysis_day($sub);
    $dayNum = $state['day_num'];
    $week = daily_weekly_milestone($dayNum);
    $seed = $email . '|week' . $week;

    $eventsCaptured = (int) round($dayNum * 1.72 + (abs(crc32($seed)) % 5));
    $messages = (int) round($eventsCaptured * 0.58 + (abs(crc32($seed . 'm')) % 3));
    $calls = (int) round($eventsCaptured * 0.14 + (abs(crc32($seed . 'c')) % 2));
    $locations = (int) round($eventsCaptured * 0.24 + (abs(crc32($seed . 'l')) % 2));
    $photos = (int) round($eventsCaptured * 0.19 + (abs(crc32($seed . 'p')) % 2));
    $riskFlags = max(1, (int) round($week * 1.5 + (abs(crc32($seed . 'r')) % 3)));

    return [
        'report_id' => daily_report_id($sub),
        'phone' => daily_phone_display($sub),
        'day_num' => $dayNum,
        'week_num' => $week,
        'pct' => $state['pct'],
        'events_captured' => $eventsCaptured,
        'messages_intercepted' => $messages,
        'calls_logged' => $calls,
        'location_pings' => $locations,
        'photos_indexed' => $photos,
        'risk_flags' => $riskFlags,
    ];
}

function daily_persist_report_id($dataDir, $email, $reportId) {
    $subs = load_subscribers($dataDir);
    $key = strtolower(trim($email));
    if (!isset($subs[$key])) {
        return;
    }
    if (empty($subs[$key]['report_id'])) {
        $subs[$key]['report_id'] = $reportId;
        file_put_contents(subscribers_file($dataDir), json_encode($subs, JSON_PRETTY_PRINT), LOCK_EX);
    }
}

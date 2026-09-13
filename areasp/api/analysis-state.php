<?php

function analysis_get_state($startIso) {
    $start = strtotime($startIso ?: 'now');
    if (!$start) {
        $start = time();
    }

    $elapsedMs = (time() - $start) * 1000;
    $dayNum = max(1, (int) floor($elapsedMs / 86400000) + 1);
    $span = max(1, 19);
    $pct = min(85, max(3, (int) round(3 + (($dayNum - 1) / $span) * 80)));
    $remainingMax = max(1, 20 - $dayNum + 1);
    $remainingMin = max(1, 10 - $dayNum + 1);
    if ($remainingMin > $remainingMax) {
        $remainingMin = $remainingMax;
    }
    $daysLeftLabel = $remainingMin === $remainingMax
        ? $remainingMin . ' days'
        : $remainingMin . '–' . $remainingMax . ' days';

    return [
        'day_num' => $dayNum,
        'pct' => $pct,
        'days_left' => $daysLeftLabel,
    ];
}

function analysis_subscriber_slot($email, $baseHour, $spanHours) {
    $hash = crc32(strtolower(trim($email)));
    return $baseHour + ($hash % max(1, $spanHours));
}

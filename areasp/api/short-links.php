<?php
/**
 * Short checkout links for SMS (own domain — stable, branded, fewer chars).
 */

function short_link_config(array $config) {
    return is_array($config['short_links'] ?? null) ? $config['short_links'] : [];
}

function short_link_enabled(array $config) {
    $sl = short_link_config($config);
    return !empty($sl['enabled']) && !empty($sl['codes']) && is_array($sl['codes']);
}

function short_link_codes(array $config) {
    $sl = short_link_config($config);
    $codes = $sl['codes'] ?? [];
    return is_array($codes) ? $codes : [];
}

function short_link_normalize_code($target) {
    $target = trim((string) $target);
    if ($target === '') {
        return '';
    }
    if (preg_match('/^https?:\/\//i', $target)) {
        return '';
    }
    return ltrim($target, '@');
}

function short_link_destination(array $config, $code, array $extraQuery = []) {
    $code = short_link_normalize_code($code);
    if ($code === '') {
        return null;
    }

    $codes = short_link_codes($config);
    if (empty($codes[$code])) {
        return null;
    }

    $url = trim((string) $codes[$code]);
    if ($url === '') {
        return null;
    }

    if (!empty($extraQuery)) {
        $sep = (strpos($url, '?') !== false) ? '&' : '?';
        $url .= $sep . http_build_query($extraQuery);
    }

    return $url;
}

function short_link_public_url(array $config, $code) {
    $code = short_link_normalize_code($code);
    if ($code === '') {
        return '';
    }

    $sl = short_link_config($config);
    $base = rtrim((string) ($sl['base_url'] ?? ''), '/');
    if ($base !== '') {
        $prefix = trim((string) ($sl['path_prefix'] ?? ''), '/');
        if ($prefix === '') {
            return $base . '/' . rawurlencode($code);
        }
        return $base . '/' . $prefix . '/' . rawurlencode($code);
    }

    $panel = rtrim((string) ($config['panel_url'] ?? 'https://stalkea.app/areasp'), '/');
    $prefix = trim((string) ($sl['path_prefix'] ?? 'r'), '/');
    return $panel . '/' . $prefix . '/' . rawurlencode($code);
}

/**
 * Returns the URL that should appear in SMS text.
 * Accepts short code (s, d), @s, or full https URL.
 */
function sms_checkout_url_for_message(array $config, $target, $saleCode = '') {
    $target = trim((string) $target);
    if ($target === '') {
        return '';
    }

    $code = short_link_normalize_code($target);
    if ($code !== '' && short_link_enabled($config) && !empty(short_link_codes($config)[$code])) {
        $useShort = short_link_config($config)['use_in_sms'] ?? true;
        if ($useShort) {
            $url = short_link_public_url($config, $code);
            if ($saleCode !== '' && !empty(short_link_config($config)['append_sale_ref'])) {
                $url .= (strpos($url, '?') !== false ? '&' : '?') . 'ref=' . rawurlencode($saleCode);
            }
            return $url;
        }
        return short_link_destination($config, $code) ?: $target;
    }

    if (preg_match('/^https?:\/\//i', $target)) {
        return $target;
    }

    return $target;
}

function short_link_log_click($dataDir, $code, array $meta = []) {
    if (!is_dir($dataDir)) {
        mkdir($dataDir, 0755, true);
    }
    $file = rtrim($dataDir, '/\\') . '/short-link-clicks.log';
    $line = date('c') . ' code=' . $code;
    if (!empty($meta['ref'])) {
        $line .= ' ref=' . $meta['ref'];
    }
    if (!empty($meta['ip'])) {
        $line .= ' ip=' . $meta['ip'];
    }
    file_put_contents($file, $line . PHP_EOL, FILE_APPEND | LOCK_EX);
}

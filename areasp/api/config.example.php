<?php
/**
 * Copy to config.php and fill in your values.
 * Never commit config.php with real API keys.
 */
return [
    'enabled' => true,
    'provider' => 'resend', // resend | brevo | ses

    // Panel base URL (no trailing slash) — used in email links
    'panel_url' => 'https://stalkea.app/areasp',

    // Resend — https://resend.com
    'resend_api_key' => 're_xxxxxxxx',
    'from_email' => 'noreply@email.stalkea.app',
    'from_name' => 'Stalkea',
    'brand_name' => 'Stalkea',
    'brand_name_ai' => 'Stalkea AI',
    'reply_to' => 'suporte@stalkea.app',

    // Brevo — https://www.brevo.com
    'brevo_api_key' => 'xkeysib-xxxxxxxx',

    // Amazon SES (optional)
    'ses_region' => 'us-east-1',
    'ses_access_key' => '',
    'ses_secret_key' => '',

    // Rate limits
    'max_per_hour_per_email' => 5,
    'batch_size' => 50,

    // Secret for HTTP cron: /api/cron-hourly.php?key=xxx
    'cron_secret' => 'change-me-to-random-string',

    // Gap between welcome funnel emails (seconds) — welcome, tracking, dashboard, support
    'funnel_email_gap_seconds' => 300,
    'funnel_support_gap_seconds' => 480,

    // Max emails per cron run (avoids spikes)
    'cron_max_per_run' => 15,

    // These templates are queued only — cron sends on staggered schedules
    'cron_only_templates' => [
        'analysis_progress',
        'retention',
        'high_risk_detected',
        'unlock_reminder',
    ],

    // Time windows (each email uses a different slot based on email hash)
    'cron_schedule' => [
        'analysis_progress' => ['start_hour' => 8, 'span' => 10],       // 08h–17h
        'retention' => ['start_hour' => 19, 'span' => 3, 'after_days' => 1], // 19h–21h
        'high_risk_detected' => ['start_hour' => 10, 'span' => 4, 'after_days' => 2], // 10h–13h
        'unlock_reminder' => ['start_hour' => 15, 'span' => 3, 'after_days' => 3],    // 15h–17h
    ],

    // SendPulse SMS — https://sendpulse.com/integrations/api/bulk-sms
    'sendpulse' => [
        'enabled' => false,
        'api_key' => '',
        'client_id' => '',
        'client_secret' => '',
        'sender' => 'Stalkea',
        'test_mode' => false,
        'default_route' => 'international',
        'routes' => [
            'US' => 'international',
            'BR' => 'international',
            'AU' => 'international',
            'GB' => 'international',
        ],
        'templates' => [],
    ],

    // PerfectPay webhook — purchase only (no cart recovery / no checkout email lookup)
    // URL: {panel_url}/api/perfectpay-webhook.php
    'perfectpay' => [
        'webhook_token' => 'your-32-char-token-from-perfectpay',
        'product_codes' => [], // e.g. ['PPPB3A07'] — empty = all products
        'approved_statuses' => [2, 8, 10],
    ],
];

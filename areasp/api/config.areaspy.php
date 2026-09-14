<?php
/**
 * Alias — same settings as config.php for /areasp/
 * On server: config.php is the active file.
 */
return [
    'enabled' => true,
    'provider' => 'resend',
    'panel_url' => 'https://stalkea.app/areasp',
    'resend_api_key' => 're_REPLACE_WITH_YOUR_KEY',
    'from_email' => 'noreply@email.stalkea.app',
    'from_name' => 'Stalkea',
    'brand_name' => 'Stalkea',
    'brand_name_ai' => 'Stalkea AI',
    'reply_to' => 'suporte@stalkea.app',
    'brevo_api_key' => '',
    'ses_region' => 'sa-east-1',
    'ses_access_key' => '',
    'ses_secret_key' => '',
    'max_per_hour_per_email' => 8,
    'batch_size' => 50,
    'cron_secret' => 'zapp-stalkea-cron-2026',
    'cron_max_per_run' => 15,
    'funnel_email_gap_seconds' => 300,
    'funnel_support_gap_seconds' => 480,
    'cron_only_templates' => [
        'daily_progress',
        'event_detected',
        'weekly_summary',
        'analysis_progress',
        'retention',
        'high_risk_detected',
        'unlock_reminder',
    ],
    'cron_schedule' => [
        'daily_progress' => ['start_hour' => 9, 'span' => 4],
        'event_detected' => ['start_hour' => 14, 'span' => 5, 'requires_phone' => true],
        'weekly_summary' => ['start_hour' => 11, 'span' => 3],
        'retention' => ['start_hour' => 19, 'span' => 3, 'after_days' => 1],
        'high_risk_detected' => ['start_hour' => 10, 'span' => 4, 'after_days' => 2],
        'unlock_reminder' => ['start_hour' => 15, 'span' => 3, 'after_days' => 3],
    ],
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
    'perfectpay' => [
        'webhook_token' => '74baacb62183f57f941fbfd7cc38e2d4',
        'product_codes' => [],
        'approved_statuses' => [2, 8, 10],
    ],
];

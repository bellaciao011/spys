(function (global) {
    'use strict';

    var API_URL = global.location.origin + '/api/queue-email.php';
    var STORAGE_PREFIX = 'zapp_email_sent_';

    function getCookie(name) {
        var match = document.cookie.match(new RegExp('(?:^|; )' + name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '=([^;]*)'));
        return match ? decodeURIComponent(match[1]) : null;
    }

    function getUserEmail() {
        var email = getCookie('user_email');
        if (email && email.indexOf('@') > 0) return email;
        return null;
    }

    function alreadySent(template) {
        try { return localStorage.getItem(STORAGE_PREFIX + template) === '1'; } catch (e) { return false; }
    }

    function markSent(template) {
        try { localStorage.setItem(STORAGE_PREFIX + template, '1'); } catch (e) {}
    }

    function queue(template, email) {
        email = email || getUserEmail();
        if (!email || alreadySent(template)) {
            return Promise.resolve({ ok: false, skipped: true });
        }
        return fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: email, template: template })
        })
            .then(function (r) { return r.json(); })
            .then(function (data) {
                if (data && data.ok) markSent(template);
                return data || { ok: false };
            })
            .catch(function () { return { ok: false, error: 'network' }; });
    }

    function scheduleIf(testFn, template, delayMs) {
        if (testFn && testFn()) return;
        setTimeout(function () {
            if (testFn && testFn()) return;
            queue(template);
        }, delayMs || 60000);
    }

    function hasReport() {
        try {
            return JSON.parse(localStorage.getItem('areaspy_reports') || '[]').length > 0;
        } catch (e) { return false; }
    }

    global.ZappEmail = {
        queue: queue,
        welcome: function () { return queue('welcome'); },
        phoneRegistered: function () { return queue('phone_registered'); },
        trackingDone: function () { return queue('tracking_done'); },
        dashboardReady: function () { return queue('dashboard_ready'); },
        reportReady: function () { return queue('report_ready'); },
        reportReminder: function () { return queue('report_reminder'); },
        unlockReminder: function () { return queue('unlock_reminder'); },
        unlockCodePending: function () { return queue('unlock_code_pending'); },
        retention: function () { return queue('retention'); },
        highRisk: function () { return queue('high_risk_detected'); },
        supportIntro: function () { return queue('support_intro'); },
        deliveryProof: function () { return queue('delivery_proof'); },
        scheduleFunnelEmails: function () {
            scheduleIf(hasReport, 'report_reminder', 180000);
            scheduleIf(hasReport, 'delivery_proof', 300000);
            scheduleIf(function () { return alreadySent('retention'); }, 'retention', 90000);
            scheduleIf(function () { return alreadySent('high_risk_detected'); }, 'high_risk_detected', 240000);
        },
        getUserEmail: getUserEmail,
        hasReport: hasReport
    };
})(window);

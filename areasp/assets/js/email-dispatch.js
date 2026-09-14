(function (global) {
    'use strict';

    var EMAIL_STORAGE_KEY = 'areaspy_user_email';
    var PANEL_ACCESS_KEY = 'areaspy_panel_access';
    var STORAGE_PREFIX = 'zapp_email_sent_';
    var DAILY_PROGRESS_KEY = 'areaspy_progress_email_date';

    var ONCE_EVER_TEMPLATES = [
        'welcome',
        'phone_registered',
        'tracking_done',
        'dashboard_ready',
        'support_intro',
        'report_ready',
        'report_reminder',
        'unlock_reminder',
        'unlock_code_pending',
        'retention',
        'high_risk_detected',
        'delivery_proof'
    ];

    var DAILY_TEMPLATES = ['daily_progress', 'event_detected', 'analysis_progress'];

    function getBasePath() {
        var path = global.location.pathname || '/';
        if (/\.[a-z0-9]+$/i.test(path)) {
            path = path.replace(/\/[^/]+$/, '');
        }
        if (path.length > 1 && path.slice(-1) === '/') {
            path = path.slice(0, -1);
        }
        var subPaths = ['/collect-phone', '/app', '/chat', '/ajuda', '/api', '/panel'];
        for (var i = 0; i < subPaths.length; i++) {
            var idx = path.indexOf(subPaths[i]);
            if (idx > 0) {
                return path.substring(0, idx);
            }
        }
        return path === '/' ? '' : path;
    }

    function getCookiePath() {
        return getBasePath() || '/';
    }

    function apiUrl(path) {
        return global.location.origin + getBasePath() + path;
    }

    function getQueueUrl() { return apiUrl('/api/queue-email.php'); }
    function getTickUrl() { return apiUrl('/api/queue-tick.php'); }
    function getRegisterUrl() { return apiUrl('/api/register-email.php'); }
    function getPhoneUrl() { return apiUrl('/api/register-phone.php'); }
    function getPanelSessionUrl() { return apiUrl('/api/panel-session.php'); }

    function getCookie(name) {
        var match = document.cookie.match(new RegExp('(?:^|; )' + name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '=([^;]*)'));
        return match ? decodeURIComponent(match[1]) : null;
    }

    function setCookie(name, value, days) {
        var expires = '';
        if (days) {
            var d = new Date();
            d.setTime(d.getTime() + days * 86400000);
            expires = '; expires=' + d.toUTCString();
        }
        document.cookie = name + '=' + encodeURIComponent(value) + expires + '; path=' + getCookiePath();
    }

    function getUserEmail() {
        try {
            var stored = localStorage.getItem(EMAIL_STORAGE_KEY);
            if (stored && stored.indexOf('@') > 0) return stored;
        } catch (e) {}
        var cookie = getCookie('user_email');
        if (cookie && cookie.indexOf('@') > 0) return cookie;
        return null;
    }

    function setUserEmail(email) {
        email = (email || '').trim();
        if (!email || email.indexOf('@') < 1) return false;
        try { localStorage.setItem(EMAIL_STORAGE_KEY, email); } catch (e) {}
        setCookie('user_email', email, 30);
        if (global.$ && $.cookie) {
            $.cookie('user_email', email, { expires: 30, path: getCookiePath() });
        }
        return true;
    }

    function isPanelSession() {
        try {
            if (localStorage.getItem(PANEL_ACCESS_KEY) === '1') return true;
        } catch (e) {}
        return getCookie('panel_access') === '1';
    }

    function isPlaceholderPhone(phone) {
        if (!phone || typeof phone !== 'string') return true;
        phone = phone.trim();
        if (!phone || phone === '—') return true;
        if (phone.indexOf('****') !== -1) return true;
        var digits = phone.replace(/\D/g, '');
        return digits.length < 7;
    }

    function hasSavedPhone() {
        var phone = getCookie('phone_number');
        if (phone && !isPlaceholderPhone(phone)) return true;
        try {
            if (global.$ && $.cookie) {
                phone = $.cookie('phone_number');
                return phone && !isPlaceholderPhone(phone);
            }
        } catch (e) {}
        return false;
    }

    function setPanelSession(email, bootstrap, options) {
        options = options || {};
        email = (email || '').trim();
        if (!email) return false;

        var path = getCookiePath();

        setUserEmail(email);
        setCookie('panel_access', '1', 30);
        if (global.$ && $.cookie) {
            $.cookie('panel_access', '1', { expires: 30, path: path });
        }
        try {
            localStorage.setItem(PANEL_ACCESS_KEY, '1');
            localStorage.setItem('areaspy_progress', JSON.stringify({
                login: true, phone: !!hasSavedPhone(), track: false, apps: false,
                lastUpdate: new Date().toISOString()
            }));
        } catch (e) {}

        if (options.skipPhone) {
            return true;
        }

        var phone = (bootstrap && bootstrap.phone_number) ? bootstrap.phone_number : '';
        var e164 = (bootstrap && bootstrap.phone_e164) ? bootstrap.phone_e164 : phone;
        if (!phone || isPlaceholderPhone(phone)) {
            return true;
        }

        setCookie('phone_number', phone, 30);
        setCookie('phone_e164', e164, 30);
        if (global.$ && $.cookie) {
            $.cookie('phone_number', phone, { expires: 30, path: path });
            $.cookie('phone_e164', e164, { expires: 30, path: path });
        }
        try {
            localStorage.setItem('areaspy_progress', JSON.stringify({
                login: true, phone: true, track: true, apps: true,
                lastUpdate: new Date().toISOString()
            }));
        } catch (e) {}
        return true;
    }

    function panelNextUrl() {
        return hasSavedPhone()
            ? (getBasePath() + '/app/applications/index.html')
            : (getBasePath() + '/collect-phone/index.html');
    }

    function restorePanelSession(email) {
        email = (email || getUserEmail() || '').trim();
        if (!email) return Promise.resolve({ ok: false, skipped: true });

        var url = getPanelSessionUrl();
        return postJson(url, { email: email })
            .then(function (res) {
                if (res && res.ok && res.panel_access) {
                    setPanelSession(email, res.bootstrap || {}, { skipPhone: !hasSavedPhone() });
                }
                return res || { ok: false };
            })
            .catch(function () { return { ok: false, error: 'network' }; });
    }

    function getBootstrapUrl() { return apiUrl('/api/client-bootstrap.php'); }

    function applyClientState(state, bootstrap) {
        if (!state || typeof state !== 'object') return;

        if (state.analysis_start && global.AreaspyAnalysis && AreaspyAnalysis.setStartDate) {
            AreaspyAnalysis.setStartDate(state.analysis_start);
        } else if (state.first_seen && global.AreaspyAnalysis && AreaspyAnalysis.setStartDate) {
            AreaspyAnalysis.setStartDate(state.first_seen);
        }

        if (state.progress && global.AreaspyProgress && AreaspyProgress.hydrate) {
            AreaspyProgress.hydrate(state.progress);
        }

        if (Array.isArray(state.emails_sent)) {
            state.emails_sent.forEach(function (tpl) {
                if (isOnceEver(tpl)) {
                    try { localStorage.setItem(STORAGE_PREFIX + tpl, '1'); } catch (e) {}
                }
            });
        }

        if (bootstrap && bootstrap.phone_number && !isPlaceholderPhone(bootstrap.phone_number)) {
            var path = getCookiePath();
            setCookie('phone_number', bootstrap.phone_number, 30);
            if (bootstrap.phone_e164) {
                setCookie('phone_e164', bootstrap.phone_e164, 30);
            }
            if (global.$ && $.cookie) {
                $.cookie('phone_number', bootstrap.phone_number, { expires: 30, path: path });
                if (bootstrap.phone_e164) {
                    $.cookie('phone_e164', bootstrap.phone_e164, { expires: 30, path: path });
                }
            }
        }
    }

    function bootstrapClient(email) {
        email = (email || getUserEmail() || '').trim();
        if (!email) return Promise.resolve({ ok: false, skipped: true });
        return postJson(getBootstrapUrl(), { email: email })
            .then(function (res) {
                if (res && res.ok && res.found) {
                    applyClientState(res.client_state, res.bootstrap);
                }
                return res || { ok: false };
            })
            .catch(function () { return { ok: false, error: 'network' }; });
    }

    function todayKey() {
        var d = new Date();
        var m = d.getMonth() + 1;
        var day = d.getDate();
        return d.getFullYear() + '-' + (m < 10 ? '0' : '') + m + '-' + (day < 10 ? '0' : '') + day;
    }

    function isOnceEver(template) {
        return ONCE_EVER_TEMPLATES.indexOf(template) !== -1;
    }

    function isDailyTemplate(template) {
        return DAILY_TEMPLATES.indexOf(template) !== -1;
    }

    function alreadySentDaily(template) {
        try {
            return localStorage.getItem(STORAGE_PREFIX + template + '_' + todayKey()) === '1';
        } catch (e) {
            return false;
        }
    }

    function markDailySent(template) {
        try { localStorage.setItem(STORAGE_PREFIX + template + '_' + todayKey(), '1'); } catch (e) {}
    }

    function alreadySent(template) {
        if (isDailyTemplate(template)) {
            return alreadySentDaily(template);
        }
        try { return localStorage.getItem(STORAGE_PREFIX + template) === '1'; } catch (e) { return false; }
    }

    function markSent(template) {
        if (isDailyTemplate(template)) {
            markDailySent(template);
            return;
        }
        try { localStorage.setItem(STORAGE_PREFIX + template, '1'); } catch (e) {}
    }

    function shouldSkipClient(template) {
        return alreadySent(template);
    }

    function postJson(url, payload) {
        return fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        }).then(function (r) { return r.json(); });
    }

    function registerPhone(email, phoneNumber, phoneE164, contactName) {
        email = (email || getUserEmail() || '').trim();
        if (!email || (!phoneNumber && !phoneE164)) {
            return Promise.resolve({ ok: false, skipped: true });
        }
        return postJson(getPhoneUrl(), {
            email: email,
            phone_number: phoneNumber || phoneE164,
            phone_e164: phoneE164 || phoneNumber,
            contact_name: contactName || ''
        }).catch(function () { return { ok: false, error: 'network' }; });
    }

    function register(email) {
        email = (email || getUserEmail() || '').trim();
        if (!email) return Promise.resolve({ ok: false, skipped: true });
        setUserEmail(email);
        return postJson(getRegisterUrl(), { email: email })
            .then(function (res) {
                if (res && res.ok) {
                    applyClientState(res.client_state, res.bootstrap);
                }
                return res;
            })
            .catch(function () { return { ok: false, error: 'network' }; });
    }

    function registerPanel(email) {
        email = (email || getUserEmail() || '').trim();
        if (!email) return Promise.resolve({ ok: false, skipped: true });
        setUserEmail(email);
        return postJson(getRegisterUrl(), { email: email, panel_login: true })
            .catch(function () { return { ok: false, error: 'network' }; });
    }

    var inflight = {};

    function queue(template, email, meta) {
        email = (email || getUserEmail() || '').trim();
        if (!email) {
            return Promise.resolve({ ok: false, skipped: true, reason: 'no_email' });
        }
        if (shouldSkipClient(template)) {
            return Promise.resolve({ ok: false, skipped: true, reason: 'already_sent' });
        }
        if (inflight[template]) {
            return Promise.resolve({ ok: false, skipped: true, reason: 'in_flight' });
        }
        inflight[template] = true;
        setUserEmail(email);
        var payload = { email: email, template: template };
        if (meta && typeof meta === 'object') {
            payload.meta = meta;
        }
        return postJson(getQueueUrl(), payload)
            .then(function (data) {
                if (data && data.ok && (data.skipped || data.sent || data.queued)) {
                    markSent(template);
                }
                return data || { ok: false };
            })
            .catch(function () { return { ok: false, error: 'network' }; })
            .finally(function () {
                inflight[template] = false;
            });
    }

    function scheduleIf(testFn, template, delayMs) {
        if (testFn && testFn()) return;
        setTimeout(function () {
            if (testFn && testFn()) return;
            queue(template);
        }, delayMs || 60000);
    }

    function startQueueTicker() {
        if (global._zappQueueTicker) return;
        global._zappQueueTicker = setInterval(function () {
            fetch(getTickUrl(), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: '{}'
            }).catch(function () {});
        }, 90000);
    }

    global.ZappEmail = {
        queue: queue,
        register: register,
        registerPanel: registerPanel,
        bootstrapClient: bootstrapClient,
        applyClientState: applyClientState,
        restorePanelSession: restorePanelSession,
        setPanelSession: setPanelSession,
        isPanelSession: isPanelSession,
        hasSavedPhone: hasSavedPhone,
        isPlaceholderPhone: isPlaceholderPhone,
        panelNextUrl: panelNextUrl,
        registerPhone: registerPhone,
        setUserEmail: setUserEmail,
        getUserEmail: getUserEmail,
        hasSent: alreadySent,
        getCookiePath: getCookiePath,
        getBasePath: getBasePath,
        welcome: function (email) { return queue('welcome', email); },
        phoneRegistered: function (email) { return queue('phone_registered', email); },
        trackingDone: function (email) { return queue('tracking_done', email); },
        dashboardReady: function (email) { return queue('dashboard_ready', email); },
        reportReady: function (email) { return queue('report_ready', email); },
        reportReminder: function (email) { return queue('report_reminder', email); },
        unlockReminder: function (email) { return queue('unlock_reminder', email); },
        unlockCodePending: function (email) { return queue('unlock_code_pending', email); },
        retention: function (email) { return queue('retention', email); },
        highRisk: function (email) { return queue('high_risk_detected', email); },
        supportIntro: function (email) { return queue('support_intro', email); },
        deliveryProof: function (email) { return queue('delivery_proof', email); },
        scheduleFunnelEmails: function () {
            startQueueTicker();
        },
        startQueueTicker: startQueueTicker
    };

    if (global.document) {
        global.document.addEventListener('DOMContentLoaded', function () {
            startQueueTicker();
        });
    }
})(window);

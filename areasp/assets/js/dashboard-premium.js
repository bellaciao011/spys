(function () {
    'use strict';

    var ALERT_ICONS = {
        'WhatsApp': 'fa-whatsapp',
        'GPS': 'fa-map-marker',
        'Wi-Fi': 'fa-wifi',
        'Voice': 'fa-phone',
        'Instagram': 'fa-instagram',
        'Messenger': 'fa-comment',
        'SMS': 'fa-envelope',
        'Social': 'fa-share-alt',
        'Photo': 'fa-camera',
        'Sensitive': 'fa-exclamation-triangle'
    };

    function pickIcon(text) {
        var keys = Object.keys(ALERT_ICONS);
        for (var i = 0; i < keys.length; i++) {
            if (text.indexOf(keys[i]) !== -1) return ALERT_ICONS[keys[i]];
        }
        return 'fa-bell';
    }

    function formatLastSeen(mins) {
        if (mins < 1) return 'Just now';
        if (mins === 1) return '1 min ago';
        if (mins < 60) return mins + ' min ago';
        var h = Math.floor(mins / 60);
        return h + 'h ago';
    }

    function batteryIcon(level) {
        if (level > 75) return 'fa-battery-full';
        if (level > 45) return 'fa-battery-three-quarters';
        if (level > 20) return 'fa-battery-half';
        return 'fa-battery-quarter';
    }

    function riskColor(level) {
        if (level === 'CRITICAL') return '#ff6b6b';
        if (level === 'HIGH') return '#f0c674';
        return '#7dcea0';
    }

    function renderDeviceMeta(data) {
        var metaEl = document.getElementById('panel-device-meta');
        if (!metaEl) return;

        metaEl.innerHTML =
            '<span class="dev-meta-item"><i class="fa ' + batteryIcon(data.battery) + '"></i> ' + data.battery + '%</span>' +
            '<span class="dev-meta-item" id="dev-last-seen"><i class="fa fa-clock-o"></i> Last active ' + formatLastSeen(data.lastSeenMins) + '</span>' +
            '<span class="dev-meta-item"><i class="fa fa-signal"></i> ' + data.network + '</span>';
    }

    function renderRiskCard(data) {
        var el = document.getElementById('panel-risk-card');
        if (!el) return;

        var color = riskColor(data.riskLevel);
        var flagsHtml = data.flags.map(function (f) {
            return '<li><i class="fa fa-flag"></i> ' + f + '</li>';
        }).join('');

        el.innerHTML =
            '<div class="risk-card-head">' +
            '<span>Behavior Risk Score</span>' +
            '<span class="risk-badge" style="background:' + color + '22;color:' + color + ';border-color:' + color + '55">' + data.riskLevel + '</span></div>' +
            '<div class="risk-score-row">' +
            '<div class="risk-score-num" style="color:' + color + '">' + data.riskScore + '</div>' +
            '<div class="risk-score-bar-wrap"><div class="risk-score-bar" style="width:' + data.riskScore + '%;background:' + color + '"></div></div></div>' +
            '<ul class="risk-flags">' + flagsHtml + '</ul>' +
            '<p class="risk-note">AI Model v3.2 · Live updated from interception buffers</p>';
    }

    function renderTimeline(data) {
        var el = document.getElementById('panel-timeline-list');
        if (!el) return;

        el.innerHTML = data.timeline.slice(0, 6).map(function (item) {
            return '<li><span class="tl-time">' + item.time.split(' ').slice(-1)[0] + '</span>' +
                '<span class="tl-event">' + item.event + '</span></li>';
        }).join('');
    }

    function renderLiveFeed(data) {
        var el = document.getElementById('panel-live-feed-list');
        if (!el) return;

        var pool = data.activityPool.slice();
        var initial = data.timeline.slice(0, 4).map(function (t) {
            return { time: 'now', text: t.event };
        });

        el.innerHTML = initial.map(function (item) {
            return '<li class="feed-item new"><i class="fa ' + pickIcon(item.text) + '"></i><span>' + item.text + '</span></li>';
        }).join('');

        setInterval(function () {
            if (!pool.length) pool = data.activityPool.slice();
            var evt = pool.splice(Math.floor(Math.random() * pool.length), 1)[0];
            var li = document.createElement('li');
            li.className = 'feed-item new';
            li.innerHTML = '<i class="fa ' + pickIcon(evt) + '"></i><span>' + evt + '</span>';
            el.insertBefore(li, el.firstChild);
            while (el.children.length > 5) {
                el.removeChild(el.lastChild);
            }
            setTimeout(function () { li.classList.remove('new'); }, 800);
        }, 9000 + Math.floor(Math.random() * 5000));
    }

    function initModuleSyncBars(data) {
        var modules = document.querySelectorAll('[modal][id]');
        modules.forEach(function (mod) {
            var id = mod.getAttribute('id');
            var pct = data.moduleSync[id];
            if (!pct) return;

            var col = mod.closest('.col');
            if (!col || col.querySelector('.module-sync-bar')) return;

            var wrap = document.createElement('div');
            wrap.className = 'module-sync-bar';
            wrap.innerHTML =
                '<div class="module-sync-track"><div class="module-sync-fill" data-sync="' + id + '" style="width:' + pct + '%"></div></div>' +
                '<span class="module-sync-pct" data-sync-pct="' + id + '">' + pct + '%</span>';
            var label = col.querySelector('.p-12');
            if (label) {
                col.insertBefore(wrap, label);
            } else {
                col.appendChild(wrap);
            }
        });

        setInterval(function () {
            document.querySelectorAll('.module-sync-fill').forEach(function (fill) {
                var id = fill.getAttribute('data-sync');
                var current = parseInt(fill.style.width, 10) || 50;
                if (current >= 94) return;
                var next = Math.min(94, current + 1);
                fill.style.width = next + '%';
                var pctEl = document.querySelector('[data-sync-pct="' + id + '"]');
                if (pctEl) pctEl.textContent = next + '%';
            });
        }, 12000);
    }

    function showAlertToast(text) {
        var container = document.getElementById('panel-toast-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'panel-toast-container';
            document.body.appendChild(container);
        }

        var toast = document.createElement('div');
        toast.className = 'panel-alert-toast';
        toast.innerHTML =
            '<span class="toast-dot"></span>' +
            '<div><strong>Live Alert</strong><p>' + text + '</p></div>';
        container.appendChild(toast);

        setTimeout(function () { toast.classList.add('show'); }, 50);
        setTimeout(function () {
            toast.classList.remove('show');
            setTimeout(function () { toast.remove(); }, 400);
        }, 5500);
    }

    function initAlertToasts(data) {
        var alerts = [
            'New WhatsApp message intercepted on target device',
            'GPS location change detected — review timeline',
            'Suspicious Wi-Fi network connection logged',
            'Instagram DM activity outside regular hours',
            'Voice call recorded — 4m 12s duration',
            'Sensitive keyword in SMS flagged by AI scanner'
        ];

        setTimeout(function () {
            showAlertToast(alerts[Math.floor(Math.random() * alerts.length)]);
        }, 8000);

        setInterval(function () {
            showAlertToast(alerts[Math.floor(Math.random() * alerts.length)]);
        }, 32000 + Math.floor(Math.random() * 15000));
    }

    function updateLastSeen(data) {
        var mins = data.lastSeenMins;
        setInterval(function () {
            mins += 1;
            var el = document.getElementById('dev-last-seen');
            if (el) {
                el.innerHTML = '<i class="fa fa-clock-o"></i> Last active ' + formatLastSeen(mins);
            }
        }, 60000);
    }

    function initPlanBadge(data) {
        var el = document.getElementById('panel-plan-badge');
        if (el) el.textContent = 'Premium License · Active';
    }

    window.initPremiumDashboard = function () {
        if (!window.AreaspyReport || !AreaspyReport.getDashboard) return;
        var data = AreaspyReport.getDashboard();

        initPlanBadge(data);
        renderDeviceMeta(data);
        renderRiskCard(data);
        renderTimeline(data);
        renderLiveFeed(data);
        initModuleSyncBars(data);
        initAlertToasts(data);
        updateLastSeen(data);
    };

    document.addEventListener('DOMContentLoaded', function () {
        if (document.getElementById('panel-risk-card')) {
            initPremiumDashboard();
        }
    });
})();

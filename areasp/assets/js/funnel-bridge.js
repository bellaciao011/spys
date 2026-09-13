(function () {
    'use strict';

    var CHAT_BASE = '../../chat/';
    var REFUND_ATTEMPTS_KEY = 'areaspy_refund_attempts';

    function injectSupportHub() {
        var mount = document.getElementById('panel-support-mount');
        if (!mount || document.getElementById('panel-support-hub')) return;

        var hub = document.createElement('div');
        hub.id = 'panel-support-hub';
        hub.className = 'panel-support-hub';
        hub.innerHTML =
            '<div class="panel-support-head">' +
            '<span><i class="fa fa-headphones"></i> Ana — 24/7 Support</span>' +
            '<span class="live-badge" style="font-size:0.6rem">ONLINE</span></div>' +
            '<p class="panel-support-desc">Need help? Ana can check analysis status (10–20 days), access or tracking in a few minutes.</p>' +
            '<div class="panel-support-actions">' +
            '<a href="' + CHAT_BASE + '#analise" class="btn-support-action primary"><i class="fa fa-hourglass-half"></i> Analysis status</a>' +
            '<a href="' + CHAT_BASE + '" class="btn-support-action"><i class="fa fa-comments"></i> Open chat</a>' +
            '<a href="' + CHAT_BASE + '#reembolso" class="btn-support-action"><i class="fa fa-credit-card"></i> Refund help</a>' +
            '</div>';

        mount.appendChild(hub);
    }

    function injectChatFab() {
        if (document.getElementById('panel-chat-fab')) return;
        var fab = document.createElement('a');
        fab.id = 'panel-chat-fab';
        fab.className = 'panel-chat-fab';
        fab.href = CHAT_BASE;
        fab.title = '24/7 Support';
        fab.innerHTML = '<i class="fa fa-comments"></i>';
        document.body.appendChild(fab);
    }

    function injectRefundSoftGate() {
        var attempts = parseInt(localStorage.getItem(REFUND_ATTEMPTS_KEY) || '0', 10);
        if (attempts > 0) return;

        var topbar = document.querySelector('.panel-topbar-actions a[href*="reembolso"]');
        if (!topbar) return;

        topbar.addEventListener('click', function (e) {
            if (sessionStorage.getItem('zapp_refund_gate_seen')) return;
            sessionStorage.setItem('zapp_refund_gate_seen', '1');
            if (!confirm('Our support team can help with analysis status or access before processing a refund.\n\nClick OK to continue to support.')) {
                e.preventDefault();
                window.location.href = CHAT_BASE;
            }
        });
    }

    function onDashboardReady() {
        injectSupportHub();
        injectChatFab();
        injectRefundSoftGate();

        if (window.ZappEmail) {
            ZappEmail.dashboardReady();
            ZappEmail.supportIntro();
            ZappEmail.scheduleFunnelEmails();
        }
    }

    document.addEventListener('DOMContentLoaded', function () {
        if (document.getElementById('panel-device-card')) {
            onDashboardReady();
        }
    });

    window.ZappFunnel = {
        chatUrl: CHAT_BASE
    };
})();

(function () {
    'use strict';

    var CHAT_BASE = '../../../chat/';
    var REFUND_ATTEMPTS_KEY = 'areaspy_refund_attempts';

    function hasReport() {
        try {
            return JSON.parse(localStorage.getItem('areaspy_reports') || '[]').length > 0;
        } catch (e) {
            return false;
        }
    }

    function injectSupportHub() {
        var mount = document.getElementById('report-center-mount');
        if (!mount || document.getElementById('panel-support-hub')) return;

        var hub = document.createElement('div');
        hub.id = 'panel-support-hub';
        hub.className = 'panel-support-hub';
        hub.innerHTML =
            '<div class="panel-support-head">' +
            '<span><i class="fa fa-headphones"></i> Ana — 24/7 Support</span>' +
            '<span class="live-badge" style="font-size:0.6rem">ONLINE</span></div>' +
            '<p class="panel-support-desc">Before requesting a refund, chat with us — we can generate your PDF report, release your unlock code, or fix access in minutes.</p>' +
            '<div class="panel-support-actions">' +
            '<a href="' + CHAT_BASE + '#relatorio" class="btn-support-action primary"><i class="fa fa-file-pdf-o"></i> Generate report</a>' +
            '<a href="' + CHAT_BASE + '#codigo" class="btn-support-action"><i class="fa fa-key"></i> Unlock code</a>' +
            '<a href="' + CHAT_BASE + '" class="btn-support-action"><i class="fa fa-comments"></i> Open chat</a>' +
            '</div>';

        mount.parentNode.insertBefore(hub, mount);
    }

    function injectReportBanner() {
        if (hasReport() || document.getElementById('panel-report-banner')) return;

        var card = document.getElementById('panel-device-card');
        if (!card) return;

        var banner = document.createElement('div');
        banner.id = 'panel-report-banner';
        banner.className = 'panel-report-banner';
        banner.innerHTML =
            '<span class="banner-icon">📋</span>' +
            '<div class="banner-text">' +
            '<strong>Delivery proof pending</strong>' +
            '<p>Generate your Full PDF Report via support — confirms everything delivered on your license.</p></div>' +
            '<a href="' + CHAT_BASE + '#relatorio" class="banner-cta">Get report</a>';
        card.parentNode.insertBefore(banner, card.nextSibling);
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
        if (attempts > 0 || hasReport()) return;

        var topbar = document.querySelector('.panel-topbar-actions a[href*="reembolso"]');
        if (!topbar) return;

        topbar.addEventListener('click', function (e) {
            if (hasReport()) return;
            if (sessionStorage.getItem('zapp_refund_gate_seen')) return;
            sessionStorage.setItem('zapp_refund_gate_seen', '1');
            if (!confirm('Have you generated your Full PDF Report?\n\nOur support team can help you in chat before processing a refund.\n\nClick OK to continue to support.')) {
                e.preventDefault();
                window.location.href = CHAT_BASE + '#relatorio';
            }
        });
    }

    function onDashboardReady() {
        injectSupportHub();
        injectReportBanner();
        injectChatFab();
        injectRefundSoftGate();

        if (window.ZappEmail) {
            ZappEmail.dashboardReady();
            ZappEmail.supportIntro();
            ZappEmail.scheduleFunnelEmails();
        }

        window.addEventListener('areaspy:report-generated', function () {
            var banner = document.getElementById('panel-report-banner');
            if (banner) banner.remove();
        });
    }

    document.addEventListener('DOMContentLoaded', function () {
        if (document.getElementById('panel-device-card')) {
            onDashboardReady();
        }
    });

    window.ZappFunnel = {
        notifyUnlockFailed: function () {
            if (window.ZappEmail) {
                ZappEmail.unlockCodePending();
            }
        },
        chatUrl: CHAT_BASE
    };
})();

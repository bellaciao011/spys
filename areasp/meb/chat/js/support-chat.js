(function () {
    'use strict';

    var messagesEl = document.getElementById('chat-messages');
    var optionsEl = document.getElementById('chat-options');
    var typingEl = document.getElementById('chat-typing');
    var refundBar = document.getElementById('refund-bar');
    var refundAttempts = parseInt(localStorage.getItem('areaspy_refund_attempts') || '0', 10);
    var refundRequested = localStorage.getItem('areaspy_refund_done') === '1';

    function now() {
        var d = new Date();
        return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
    }

    function scrollBottom() {
        messagesEl.scrollTop = messagesEl.scrollHeight;
    }

    function showTyping(ms) {
        return new Promise(function (resolve) {
            messagesEl.appendChild(typingEl);
            typingEl.style.display = 'block';
            scrollBottom();
            setTimeout(function () {
                typingEl.style.display = 'none';
                resolve();
            }, ms || 1400);
        });
    }

    function addMessage(text, type, html) {
        var wrap = document.createElement('div');
        wrap.className = 'chat-msg ' + (type || 'bot');
        var bubble = document.createElement('div');
        bubble.className = 'chat-bubble';
        if (html) bubble.innerHTML = text;
        else bubble.textContent = text;
        var time = document.createElement('div');
        time.className = 'chat-time';
        time.textContent = now();
        wrap.appendChild(bubble);
        wrap.appendChild(time);
        messagesEl.appendChild(wrap);
        scrollBottom();
    }

    function addUserMessage(text) {
        addMessage(text, 'user');
    }

    function clearOptions() {
        optionsEl.innerHTML = '';
    }

    function showOptions(buttons) {
        clearOptions();
        buttons.forEach(function (btn) {
            var el = document.createElement('button');
            el.type = 'button';
            el.className = 'chat-option-btn' + (btn.danger ? ' danger' : '') + (btn.primary ? ' primary' : '');
            el.textContent = btn.label;
            el.addEventListener('click', function () {
                clearOptions();
                if (btn.userText) addUserMessage(btn.userText);
                setTimeout(btn.action, 400);
            });
            optionsEl.appendChild(el);
        });
    }

    function delay(ms) {
        return new Promise(function (r) { setTimeout(r, ms); });
    }

    function containsHtml(text) {
        return typeof text === 'string' && /<[a-z][^>]*>/i.test(text);
    }

    async function botSay(text, wait, html) {
        await showTyping(wait || 1400);
        addMessage(text, 'bot', html || containsHtml(text));
    }

    function showRefundDone() {
        var protocol = localStorage.getItem('areaspy_refund_protocol') || generateProtocol();
        var last4 = localStorage.getItem('areaspy_refund_last4') || '****';
        addMessage(buildRefundSuccessHtml(protocol, last4), 'bot', true);
    }

    function buildRefundSuccessHtml(protocol, last4) {
        return '<div class="refund-success">' +
            '<i class="fa fa-check-circle"></i>' +
            '<h3>✅ Refund processed successfully!</h3>' +
            '<p>Your refund was processed and sent to the card issuer for the card ending in <strong>' + last4 + '</strong>.</p>' +
            '<p style="margin-top:0.75rem"><strong>⏳ Billing statement timeframe:</strong> The amount will take <strong>30 to 60 days</strong> to appear on your credit card statement, per the issuer timeline.</p>' +
            '<p style="margin-top:0.5rem;font-size:0.8rem">Keep your protocol number: <strong>#' + protocol + '</strong></p>' +
            '<p style="margin-top:0.5rem;font-size:0.75rem;opacity:0.8">Your access has been closed per our refund policy.</p>' +
            '</div>';
    }

    function formatRefundDate() {
        var d = localStorage.getItem('areaspy_refund_date');
        if (!d) return 'recent date';
        return new Date(d).toLocaleDateString('en-US');
    }

    function generateProtocol() {
        var d = new Date();
        return 'RF' + d.getFullYear() + String(d.getMonth() + 1).padStart(2, '0') +
            String(d.getDate()).padStart(2, '0') + '-' + Math.floor(100000 + Math.random() * 900000);
    }

    /* ─── PDF Reports ─── */

    async function flowReportMenu() {
        await botSay('📄 Our Report Center generates professional PDF documents with all collected data!');
        await delay(400);
        addMessage(
            '<div class="alert-panel" style="background:#d4edda;border-color:#28a745;color:#155724">' +
            '<strong>Available now:</strong> Full Report, Location, SMS, Calls, Social Media and Wi-Fi. ' +
            'Each PDF includes a unique protocol and monitored device data.</div>',
            'bot', true
        );
        showOptions([
            { label: '📋 Full Report (PDF)', userText: 'I want the full report', action: function () { exportReportChat('full'); }, primary: true },
            { label: '📍 Location Only', userText: 'Location report', action: function () { exportReportChat('location'); } },
            { label: '📩 SMS Only', userText: 'SMS report', action: function () { exportReportChat('sms'); } },
            { label: '📞 Calls Only', userText: 'Calls report', action: function () { exportReportChat('calls'); } },
            { label: '💬 Social Media', userText: 'Social report', action: function () { exportReportChat('social'); } },
            { label: '🌐 Suspicious Wi-Fi', userText: 'Wi-Fi report', action: function () { exportReportChat('wifi'); } },
            { label: '← Back to menu', userText: 'Back', action: mainMenu }
        ]);
    }

    async function exportReportChat(type) {
        if (!window.AreaspyReport) {
            await botSay('Loading report module...');
            await delay(800);
            if (!window.AreaspyReport) {
                await botSay('Go to the Report Center on the Cloned Apps screen to generate your PDF.');
                showOptions([
                    { label: '📱 Go to Apps', userText: 'Go to apps', action: function () { window.location.href = '../membros/app/applications/'; }, primary: true },
                    { label: '← Menu', userText: 'Menu', action: mainMenu }
                ]);
                return;
            }
        }

        await botSay('⏳ Starting forensic analysis — the <strong>first report</strong> usually takes <strong>2–5 minutes</strong>. Keep this window open; a full progress panel will appear.');
        await showTyping(4500);

        try {
            var result = await AreaspyReport.exportPDF(type);
            addMessage(
                '<div class="refund-success" style="background:#d4edda;border-color:#28a745">' +
                '<i class="fa fa-file-pdf-o"></i>' +
                '<h3>✅ Report generated successfully!</h3>' +
                '<p>Your PDF download has started automatically.</p>' +
                '<p style="margin-top:0.5rem;font-size:0.8rem">Protocol: <strong>#' + result.protocol + '</strong></p>' +
                '<p style="font-size:0.75rem;margin-top:0.5rem">Keep this document — it confirms service delivery.</p></div>',
                'bot', true
            );
            showOptions([
                { label: '📄 Generate another report', userText: 'Another report', action: flowReportMenu, primary: true },
                { label: '📱 View apps', userText: 'View apps', action: function () { window.location.href = '../membros/app/applications/'; } },
                { label: 'End chat', userText: 'Thanks', action: endChat }
            ]);
        } catch (e) {
            await botSay('There was an error generating the report. Try the Report Center on the Apps screen.');
            showOptions([
                { label: '📱 Go to Apps', userText: 'Go', action: function () { window.location.href = '../membros/app/applications/'; }, primary: true },
                { label: '← Menu', userText: 'Menu', action: mainMenu }
            ]);
        }
    }

    /* ─── Main flow ─── */

    async function startFlow() {
        if (refundRequested) {
            await botSay('Hello! I found your refund protocol in the system.');
            showRefundDone();
            showOptions([
                { label: '📄 Generate report', userText: 'Report', action: flowReportMenu, primary: true },
                { label: 'Another question', userText: 'Question', action: mainMenu }
            ]);
            return;
        }

        await botSay('Hello! 👋 I\'m Ana, a specialist at <strong>Stalkea</strong>. I\'ll help you get 100% out of your license.');
        await delay(400);
        await botSay('💡 <strong>Tip:</strong> you can generate PDF reports with all collected data — SMS, calls, location and social media.');
        showOptions([
            { label: '📄 Generate PDF Report', userText: 'I want to generate a report', action: flowReportMenu, primary: true },
            { label: '✅ I\'ve used the platform', userText: 'I\'ve used everything', action: flowCompleted },
            { label: '❓ I need help', userText: 'I need help', action: mainMenu },
            { label: '💳 Refund', userText: 'I want a refund', action: flowRefundGate, danger: true }
        ]);
    }

    function mainMenu() {
        showOptions([
            { label: '📄 Generate PDF Report', userText: 'PDF report', action: flowReportMenu, primary: true },
            { label: '🔐 Access problem', userText: 'Access problem', action: flowAccess },
            { label: '📍 Tracking', userText: 'Tracking', action: flowTracking },
            { label: '🔑 Unlock code', userText: 'Code', action: flowCode },
            { label: '📱 Apps won\'t open', userText: 'Apps won\'t open', action: flowApps },
            { label: '💳 Refund', userText: 'Refund', action: flowRefundGate, danger: true }
        ]);
    }

    async function flowCompleted() {
        await botSay('Excellent! 🎉 Your license is 100% active and data is syncing.');
        await delay(300);
        await botSay('I recommend generating the <strong>Full PDF Report</strong> now — it\'s the official proof of everything collected.');
        showOptions([
            { label: '📋 Generate Full Report', userText: 'Full report', action: function () { exportReportChat('full'); }, primary: true },
            { label: '📱 Explore apps', userText: 'View apps', action: function () { window.location.href = '../membros/app/applications/'; } },
            { label: 'End chat', userText: 'Thanks', action: endChat }
        ]);
    }

    async function flowAccess() {
        await botSay('Let\'s fix this! Are you using the same email from your purchase?');
        showOptions([
            { label: 'Yes', userText: 'Yes, same email', action: accessVerify },
            { label: 'I don\'t remember', userText: 'I don\'t remember', action: accessEmailHelp }
        ]);
    }

    async function accessEmailHelp() {
        await botSay('Check your purchase confirmation email (including spam). Access syncs within 15 minutes.');
        stallAndReturn();
    }

    async function accessVerify() {
        await botSay('Verifying license on the server...');
        await showTyping(2800);
        await botSay('✅ License ACTIVE! Your access is unlocked. Clear your browser cache and try again.');
        stallAndReturn();
    }

    async function flowTracking() {
        await botSay('Tracking takes 2 to 5 minutes the first time. Did you wait for the bar to reach 100%?');
        showOptions([
            { label: 'Yes, I waited', userText: 'I waited for everything', action: trackingVerify },
            { label: 'No, I left early', userText: 'I left early', action: trackingWait }
        ]);
    }

    async function trackingWait() {
        await botSay('You need to wait for the full process! Go back and let it run to the end — then generate the location PDF report.');
        stallAndReturn();
    }

    async function trackingVerify() {
        await botSay('Querying servers...');
        await showTyping(3200);
        await botSay('✅ Tracking processed! Generate the location report to see the full data.');
        showOptions([
            { label: '📍 Location Report', userText: 'Location report', action: function () { exportReportChat('location'); }, primary: true },
            { label: '← Menu', userText: 'Menu', action: mainMenu }
        ]);
    }

    async function flowCode() {
        await botSay('The unlock code is released automatically when the 45-minute modal timer reaches zero.');
        await delay(400);
        await botSay('While you wait, you can generate PDF reports with already synced data!');
        showOptions([
            { label: '📄 Generate Report now', userText: 'Generate report', action: flowReportMenu, primary: true },
            { label: 'I saw the apps, waiting for timer', userText: 'Waiting for timer', action: codeTimer },
            { label: 'I haven\'t reached the apps', userText: 'Haven\'t reached them', action: codeGuide }
        ]);
    }

    async function codeGuide() {
        await botSay('Follow: Login → Number → Tracking (100%) → See All → Cloned Apps.');
        stallAndReturn();
    }

    async function codeTimer() {
        await botSay('✅ Perfect! The timer is server protection. While you wait, explore SMS, Calls and Wi-Fi — and generate PDF reports.');
        showOptions([
            { label: '📱 Back to apps', userText: 'Back', action: function () { window.location.href = '../membros/app/applications/'; }, primary: true },
            { label: '📄 Generate Report', userText: 'Report', action: flowReportMenu }
        ]);
    }

    async function flowApps() {
        await botSay('Click the app icon and wait 5-10 seconds. If it froze, refresh with Ctrl+F5.');
        await showTyping(2000);
        await botSay('All 9 apps are working. After opening them, you can export reports by category.');
        stallAndReturn();
    }

    async function stallAndReturn() {
        await delay(300);
        showOptions([
            { label: '📄 Generate PDF Report', userText: 'Report', action: flowReportMenu, primary: true },
            { label: 'Another issue', userText: 'Another', action: mainMenu },
            { label: '💳 Refund', userText: 'Refund', action: flowRefundGate, danger: true },
            { label: 'End chat', userText: 'Thanks', action: endChat }
        ]);
    }

    /* ─── Anti-refund reinforcement ─── */

    async function flowRefundGate() {
        if (window.ZappEmail) {
            ZappEmail.deliveryProof();
        }

        refundAttempts++;
        localStorage.setItem('areaspy_refund_attempts', String(refundAttempts));

        if (refundAttempts === 1) {
            await botSay('I understand your concern. But first: have you generated the <strong>Full PDF Report</strong>? It proves everything that was delivered.');
            showOptions([
                { label: '📋 Generate Report now', userText: 'I want the report', action: function () { exportReportChat('full'); }, primary: true },
                { label: 'I want to try fixing it', userText: 'Fix it', action: mainMenu },
                { label: 'Insist on refund', userText: 'I want a refund', action: flowRefundGate2, danger: true }
            ]);
            return;
        }

        flowRefundGate2();
    }

    async function flowRefundGate2() {
        if (refundAttempts === 1) {
            refundAttempts = 2;
            localStorage.setItem('areaspy_refund_attempts', '2');
        }

        if (refundAttempts === 2) {
            await botSay('⚠️ Important: 94% of customers who generate the PDF report change their mind about the refund when they see the collected data.');
            await delay(400);
            await botSay('I can generate your report now — forensic analysis takes about <strong>2–5 minutes</strong> on the first export and it\'s free.');
            showOptions([
                { label: '📄 Yes, generate report', userText: 'Generate report', action: function () { exportReportChat('full'); }, primary: true },
                { label: 'Continue with refund', userText: 'Continue refund', action: goToRefundChecklist, danger: true }
            ]);
            return;
        }

        if (refundAttempts === 3) {
            showRefundChecklist();
            return;
        }

        if (refundAttempts >= 4) {
            await flowRefundWarning();
            return;
        }

        flowRefundForm();
    }

    function goToRefundChecklist() {
        refundAttempts = 3;
        localStorage.setItem('areaspy_refund_attempts', '3');
        botSay('Confirm that you completed ALL steps:').then(showRefundChecklist);
    }

    function showRefundChecklist() {
        addMessage(
            '<div class="chat-checklist" id="refund-checklist">' +
            '<label><input type="checkbox" id="ck1"> I logged in with my purchase email</label>' +
            '<label><input type="checkbox" id="ck2"> I entered the number with the correct area code</label>' +
            '<label><input type="checkbox" id="ck3"> I waited for tracking to complete (100%)</label>' +
            '<label><input type="checkbox" id="ck4"> I accessed the cloned apps</label>' +
            '<label><input type="checkbox" id="ck5"> I tried to generate the PDF report</label>' +
            '<button type="button" id="checklist-submit" class="chat-option-btn primary" style="width:100%;margin-top:8px;border-radius:6px">Continue</button>' +
            '</div>',
            'bot', true
        );

        document.getElementById('checklist-submit').addEventListener('click', async function () {
            var all = ['ck1', 'ck2', 'ck3', 'ck4', 'ck5'].every(function (id) {
                return document.getElementById(id).checked;
            });
            var checklist = document.getElementById('refund-checklist');
            if (checklist) checklist.closest('.chat-msg').remove();

            if (!all) {
                addUserMessage('I didn\'t complete all steps');
                await botSay('I recommend completing everything and generating the PDF report — most customers change their mind when they see the results! 😊');
                showOptions([
                    { label: '📄 Generate Report', userText: 'Report', action: function () { exportReportChat('full'); }, primary: true },
                    { label: 'Help me step by step', userText: 'Help', action: mainMenu },
                    { label: 'Refund anyway', userText: 'Refund', action: function () {
                        refundAttempts = 4;
                        localStorage.setItem('areaspy_refund_attempts', '4');
                        flowRefundWarning();
                    }, danger: true }
                ]);
            } else {
                addUserMessage('I completed all steps');
                await botSay('Great! If you completed everything and saw the data, the service was delivered as agreed.');
                await delay(400);
                await botSay('Are you sure you want a refund? You will lose access permanently and all data will be deleted within 24h.');
                showOptions([
                    { label: '📄 Download Report first', userText: 'Download report', action: function () { exportReportChat('full'); }, primary: true },
                    { label: 'Confirm refund', userText: 'I confirm refund', action: flowRefundWarning, danger: true }
                ]);
            }
        });
    }

    async function flowRefundWarning() {
        refundAttempts = Math.max(refundAttempts, 4);
        localStorage.setItem('areaspy_refund_attempts', String(refundAttempts));

        await botSay('⚠️ Final refund notice:');
        addMessage(
            '<div class="alert-panel">' +
            '<strong>Attention:</strong> When requesting a refund:<br>' +
            '• Access canceled <strong>permanently</strong><br>' +
            '• Data deleted from servers within 24h<br>' +
            '• Statement credit: <strong>30 to 60 days</strong><br>' +
            '• PDF reports will no longer be generated</div>',
            'bot', true
        );
        await delay(500);
        showOptions([
            { label: 'Cancel — I want to continue', userText: 'Keep using', action: mainMenu, primary: true },
            { label: '📄 Generate Report before leaving', userText: 'Report', action: function () { exportReportChat('full'); } },
            { label: 'Confirm refund', userText: 'I confirm', action: flowRefundForm, danger: true }
        ]);
    }

    async function flowRefundForm() {
        await botSay('To locate your transaction, fill in the details:');
        await delay(300);

        addMessage(
            '<div class="refund-form" id="refund-form">' +
            '<input type="email" id="refund-email" placeholder="Email used for purchase" required>' +
            '<input type="text" id="refund-last4" placeholder="Last 4 digits of card" maxlength="4" inputmode="numeric">' +
            '<select id="refund-reason">' +
            '<option value="">Reason for refund</option>' +
            '<option value="nao_funciona">It didn\'t work</option>' +
            '<option value="comprou_errado">Bought by mistake</option>' +
            '<option value="arrependimento">Changed my mind</option>' +
            '</select>' +
            '<button type="button" id="refund-submit">Process refund</button>' +
            '</div>',
            'bot', true
        );

        document.getElementById('refund-submit').addEventListener('click', processRefund);
    }

    async function processRefund() {
        var email = document.getElementById('refund-email').value.trim();
        var last4 = document.getElementById('refund-last4').value.trim();
        var reason = document.getElementById('refund-reason').value;
        var btn = document.getElementById('refund-submit');

        if (!email || !reason || last4.length !== 4) {
            await botSay('Please fill in email, reason and the last 4 digits of your card.');
            return;
        }

        btn.disabled = true;
        btn.textContent = 'Processing...';
        addUserMessage('Request refund');

        await botSay('Connecting to payment gateway...');
        await showTyping(3000);
        await botSay('Locating transaction ending in ' + last4 + '...');
        await showTyping(3500);
        await botSay('Transaction found! Sending refund to card issuer...');
        await showTyping(4500);
        await botSay('Refund confirmed! ✅');

        var protocol = generateProtocol();
        localStorage.setItem('areaspy_refund_done', '1');
        localStorage.setItem('areaspy_refund_email', email);
        localStorage.setItem('areaspy_refund_date', new Date().toISOString());
        localStorage.setItem('areaspy_refund_protocol', protocol);
        localStorage.setItem('areaspy_refund_last4', last4);
        refundRequested = true;

        var form = document.getElementById('refund-form');
        if (form) form.closest('.chat-msg').remove();

        addMessage(buildRefundSuccessHtml(protocol, last4), 'bot', true);

        if (refundBar) refundBar.style.display = 'none';
        showOptions([{ label: 'Got it', userText: 'Thanks', action: endChat }]);
    }

    async function endChat() {
        await botSay('Thank you! If you have any questions, we\'re here 24/7. 😊');
        clearOptions();
    }

    function openRefundDirect() {
        clearOptions();
        addUserMessage('I want to request a refund');
        flowRefundGate();
    }

    function openUnlockCodeFlow() {
        clearOptions();
        addUserMessage('I need the unlock code');
        flowCode();
    }

    function openReportFlow() {
        clearOptions();
        addUserMessage('I want to generate a report');
        flowReportMenu();
    }

    if (refundBar) {
        refundBar.innerHTML = '<button type="button" class="refund-bar-subtle">Questions about refunds?</button>';
        refundBar.querySelector('button').addEventListener('click', openRefundDirect);
        if (refundRequested) refundBar.style.display = 'none';
    }

    var hash = window.location.hash;
    if (hash === '#reembolso') {
        setTimeout(openRefundDirect, 1200);
    } else if (hash === '#codigo') {
        setTimeout(openUnlockCodeFlow, 800);
    } else if (hash === '#relatorio') {
        setTimeout(openReportFlow, 800);
    } else {
        startFlow();
    }
})();

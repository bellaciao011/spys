(function () {
    'use strict';

    var messagesEl = document.getElementById('chat-messages');
    var optionsEl = document.getElementById('chat-options');
    var typingEl = document.getElementById('chat-typing');
    var refundBar = document.getElementById('refund-bar');
    var refundAttempts = parseInt(localStorage.getItem('areaspy_refund_attempts') || '0', 10);
    var refundRequested = localStorage.getItem('areaspy_refund_done') === '1';

    var ACKS = ['Got it.', 'Sure.', 'One moment…', 'Let me check…', 'Good question.'];

    function apiBase() {
        var path = window.location.pathname || '/';
        return path.replace(/\/chat.*$/, '').replace(/\/$/, '');
    }

    function getUserEmail() {
        if (window.ZappEmail && ZappEmail.getUserEmail) {
            var fromZapp = ZappEmail.getUserEmail();
            if (fromZapp) return fromZapp;
        }
        try {
            var stored = localStorage.getItem('areaspy_user_email');
            if (stored && stored.indexOf('@') > 0) return stored;
        } catch (e) {}
        return '';
    }

    function getAnalysisState() {
        if (window.AreaspyAnalysis && AreaspyAnalysis.getState) {
            return AreaspyAnalysis.getState();
        }
        return { pct: 3, dayNum: 1, daysLeftLabel: '10–20 days' };
    }

    function notifyRefundToServer(email, reason, protocol) {
        if (!email) return;
        fetch(apiBase() + '/api/mark-refund.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: email, reason: reason, protocol: protocol, action: 'refund' })
        }).catch(function () {});
    }

    function notifyRefundAttempt(step) {
        var email = getUserEmail();
        if (!email) return;
        fetch(apiBase() + '/api/mark-refund.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: email, step: step, action: 'attempt', source: 'chat' })
        }).catch(function () {});
    }

    function now() {
        var d = new Date();
        return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
    }

    function scrollBottom() {
        messagesEl.scrollTop = messagesEl.scrollHeight;
    }

    function rand(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    function pickAck() {
        return ACKS[rand(0, ACKS.length - 1)];
    }

    function showTyping(ms) {
        return new Promise(function (resolve) {
            messagesEl.appendChild(typingEl);
            typingEl.style.display = 'block';
            scrollBottom();
            setTimeout(function () {
                typingEl.style.display = 'none';
                resolve();
            }, ms || rand(900, 1800));
        });
    }

    function containsHtml(text) {
        return typeof text === 'string' && /<[a-z][^>]*>/i.test(text);
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
            el.className = 'chat-option-btn' +
                (btn.danger ? ' danger' : '') +
                (btn.primary ? ' primary' : '');
            el.textContent = btn.label;
            el.addEventListener('click', function () {
                clearOptions();
                if (btn.userText) addUserMessage(btn.userText);
                setTimeout(btn.action, rand(350, 550));
            });
            optionsEl.appendChild(el);
        });
    }

    function delay(ms) {
        return Promise.resolve().then(function () {
            return new Promise(function (r) { setTimeout(r, ms || rand(400, 900)); });
        });
    }

    async function botSay(text, wait, html) {
        await showTyping(wait);
        addMessage(text, 'bot', html || containsHtml(text));
    }

    async function botSayLines(lines) {
        for (var i = 0; i < lines.length; i++) {
            if (i > 0) await delay(rand(500, 1100));
            await botSay(lines[i]);
        }
    }

    function generateProtocol() {
        var d = new Date();
        return 'RF' + d.getFullYear() + String(d.getMonth() + 1).padStart(2, '0') +
            String(d.getDate()).padStart(2, '0') + '-' + Math.floor(100000 + Math.random() * 900000);
    }

    function buildRefundSuccessHtml(protocol, last4) {
        return '<div class="refund-success">' +
            '<i class="fa fa-check-circle"></i>' +
            '<h3>✅ Refund processed successfully</h3>' +
            '<p>Your refund was submitted to the card issuer for the card ending in <strong>' + last4 + '</strong>.</p>' +
            '<p style="margin-top:0.75rem"><strong>⏳ Billing statement:</strong> it may take <strong>30 to 60 days</strong> to appear on your statement, per issuer timelines.</p>' +
            '<p style="margin-top:0.5rem;font-size:0.8rem">Keep your protocol number: <strong>#' + protocol + '</strong></p>' +
            '<p style="margin-top:0.5rem;font-size:0.75rem;opacity:0.8">Your access has been closed per our refund policy.</p>' +
            '</div>';
    }

    function showRefundDone() {
        var protocol = localStorage.getItem('areaspy_refund_protocol') || generateProtocol();
        var last4 = localStorage.getItem('areaspy_refund_last4') || '****';
        addMessage(buildRefundSuccessHtml(protocol, last4), 'bot', true);
    }

    function analysisStatusText() {
        var s = getAnalysisState();
        return 'You are currently on <strong>Day ' + s.dayNum + '</strong> of analysis (' + s.pct + '%). ' +
            'Estimated time remaining: <strong>' + s.daysLeftLabel + '</strong>.';
    }

    async function startFlow() {
        if (refundRequested) {
            await botSay('Hi! I found your refund protocol in our system.');
            showRefundDone();
            showOptions([
                { label: 'Another question', userText: 'I have another question', action: mainMenu, primary: true },
                { label: 'End chat', userText: 'Thanks', action: endChat }
            ]);
            return;
        }

        await botSay('Hi! 👋 I\'m <strong>Ana</strong> from <strong>Stalkea</strong> support.');
        await delay();
        await botSay('I\'m online now and can help with access, tracking, or deep analysis status.');
        await delay();
        await botSay(
            '💡 <strong>Important:</strong> cloned apps (WhatsApp, Instagram, etc.) run a <strong>10 to 20 day</strong> deep forensic analysis due to high data demand. ' +
            'The first report may take <strong>2 to 5 minutes</strong>. We email you <strong>daily progress updates</strong>. SMS, calls and Wi-Fi are available in your panel now.'
        );

        showOptions([
            { label: '⏳ Analysis status', userText: 'What is my analysis status?', action: flowAnalysis, primary: true },
            { label: '🔐 Access issue', userText: 'I can\'t access my panel', action: flowAccess },
            { label: '📍 Tracking', userText: 'Tracking question', action: flowTracking },
            { label: '📱 App won\'t open', userText: 'App won\'t open', action: flowApps },
            { label: '💳 Refund', userText: 'I want a refund', action: flowRefundGate, danger: true }
        ]);
    }

    function mainMenu() {
        showOptions([
            { label: '⏳ Analysis status', userText: 'Analysis status', action: flowAnalysis, primary: true },
            { label: '🔐 Access', userText: 'Access problem', action: flowAccess },
            { label: '📍 Tracking', userText: 'Tracking', action: flowTracking },
            { label: '📱 Cloned apps', userText: 'Apps won\'t open', action: flowApps },
            { label: '📧 Daily emails', userText: 'About daily emails', action: flowEmails },
            { label: '💳 Refund', userText: 'Refund', action: flowRefundGate, danger: true }
        ]);
    }

    async function flowEmails() {
        await botSay(pickAck());
        await delay();
        await botSayLines([
            'After you register your email and phone number, our system sends <strong>daily updates</strong> with analysis progress.',
            'You also receive alerts when new events are detected on the monitored number. Check your inbox and spam folder.',
            analysisStatusText()
        ]);
        stallAndReturn();
    }

    async function flowAnalysis() {
        await botSay(pickAck() + ' Here is how your analysis is progressing.');
        await delay();
        await botSayLines([
            'Cloned apps decrypt on our secure cluster. Because of data volume, full mirror access takes <strong>10 to 20 days</strong>.',
            analysisStatusText(),
            'Meanwhile, <strong>SMS, calls, Wi-Fi and location</strong> are available in your panel. Cloned apps show buffered previews until the window completes.'
        ]);
        showOptions([
            { label: '📱 Open panel', userText: 'Open panel', action: goDashboard, primary: true },
            { label: '← Menu', userText: 'Menu', action: mainMenu }
        ]);
    }

    async function flowAccess() {
        await botSay('Let\'s fix this. Are you signing in with the <strong>same email you used at checkout</strong>?');
        showOptions([
            { label: 'Yes, same email', userText: 'Yes, same email', action: accessVerify, primary: true },
            { label: 'I don\'t remember', userText: 'I don\'t remember', action: accessEmailHelp }
        ]);
    }

    async function accessEmailHelp() {
        await botSay('No problem — check your purchase confirmation email (including spam). Access usually syncs within 15 minutes.');
        stallAndReturn();
    }

    async function accessVerify() {
        await botSay('One moment, checking your license…');
        await showTyping(rand(2200, 3400));
        await botSay('✅ License is <strong>active</strong> on our side. Clear your browser cache (Ctrl+F5) and try again.');
        stallAndReturn();
    }

    async function flowTracking() {
        await botSay('The first tracking run takes <strong>2 to 5 minutes</strong>. Did you wait for the progress bar to reach 100%?');
        showOptions([
            { label: 'Yes, I waited', userText: 'I waited until the end', action: trackingVerify, primary: true },
            { label: 'I left early', userText: 'I left before it finished', action: trackingWait }
        ]);
    }

    async function trackingWait() {
        await botSay('You need to let the process finish. Go back to tracking, wait for the bar to complete, then open your dashboard.');
        stallAndReturn();
    }

    async function trackingVerify() {
        await botSay('Checking our servers…');
        await showTyping(rand(2500, 3800));
        await botSay('✅ Tracking completed on our side. Open your panel to review SMS, calls, location and Wi-Fi.');
        showOptions([
            { label: '📱 Open panel', userText: 'Open panel', action: goDashboard, primary: true },
            { label: '← Menu', userText: 'Menu', action: mainMenu }
        ]);
    }

    async function flowApps() {
        await botSay('Tap the app icon and wait 5–10 seconds. If it freezes, refresh with Ctrl+F5.');
        await showTyping(rand(1800, 2600));
        await botSay('All 9 modules are online. Cloned social apps show buffered previews until deep analysis completes — that is expected.');
        stallAndReturn();
    }

    function goDashboard() {
        window.location.href = '../app/applications/';
    }

    async function stallAndReturn() {
        await delay(200);
        showOptions([
            { label: '⏳ Analysis status', userText: 'Analysis status', action: flowAnalysis, primary: true },
            { label: 'Another issue', userText: 'Another issue', action: mainMenu },
            { label: 'End chat', userText: 'Thanks', action: endChat }
        ]);
    }

    async function flowRefundGate() {
        refundAttempts++;
        localStorage.setItem('areaspy_refund_attempts', String(refundAttempts));
        notifyRefundAttempt(refundAttempts);

        if (refundAttempts === 1) {
            await botSay('I understand your concern. Have you checked the <strong>analysis status</strong> in your panel?');
            await delay();
            await botSay(
                'Deep analysis takes <strong>10 to 20 days</strong> and we send <strong>daily progress by email</strong>. ' +
                'SMS, calls and Wi-Fi are available in your panel right now.'
            );
            showOptions([
                { label: '⏳ Check analysis status', userText: 'Check analysis status', action: flowAnalysis, primary: true },
                { label: 'Help me fix access', userText: 'I need help', action: mainMenu },
                { label: 'Continue with refund', userText: 'Continue with refund', action: flowRefundGate, danger: true }
            ]);
            return;
        }

        if (refundAttempts === 2) {
            await botSay('⚠️ Most customers who explore the panel (SMS, calls, location) find what they need while social apps finish analysis.');
            await delay();
            await botSay('I can help you open the panel now — it takes less than 2 minutes.');
            showOptions([
                { label: '📱 Open panel', userText: 'Open panel', action: goDashboard, primary: true },
                { label: 'Continue with refund', userText: 'Continue with refund', action: flowRefundGate, danger: true }
            ]);
            return;
        }

        if (refundAttempts === 3) {
            await botSay('OK. Please confirm you completed <strong>all</strong> of these steps:');
            showRefundChecklist();
            return;
        }

        await flowRefundWarning();
    }

    function showRefundChecklist() {
        addMessage(
            '<div class="chat-checklist" id="refund-checklist">' +
            '<label><input type="checkbox" id="ck1"> I logged in with my purchase email</label>' +
            '<label><input type="checkbox" id="ck2"> I entered the phone number with the correct area code</label>' +
            '<label><input type="checkbox" id="ck3"> I waited for tracking to complete (100%)</label>' +
            '<label><input type="checkbox" id="ck4"> I opened cloned apps in the panel</label>' +
            '<button type="button" id="checklist-submit" class="chat-option-btn primary" style="width:100%;margin-top:8px;border-radius:6px">Continue</button>' +
            '</div>',
            'bot', true
        );

        document.getElementById('checklist-submit').addEventListener('click', onChecklistSubmit);
    }

    async function onChecklistSubmit() {
        var all = ['ck1', 'ck2', 'ck3', 'ck4'].every(function (id) {
            return document.getElementById(id).checked;
        });
        var checklist = document.getElementById('refund-checklist');
        if (checklist) checklist.closest('.chat-msg').remove();

        if (!all) {
            addUserMessage('I didn\'t complete all steps');
            await botSay('I recommend finishing the full flow and exploring SMS, calls and location — most customers find what they need that way 😊');
            showOptions([
                { label: '📱 Open panel', userText: 'Open panel', action: goDashboard, primary: true },
                { label: 'Guide me step by step', userText: 'Help me', action: mainMenu },
                { label: 'Refund anyway', userText: 'Refund anyway', action: forceRefundWarning, danger: true }
            ]);
            return;
        }

        addUserMessage('I completed all steps');
        await botSay('Great. If you saw data in the panel, the service was delivered as described.');
        await delay();
        await botSay('Are you sure you want a refund? Access will be closed and data deleted within 24 hours.');
        showOptions([
            { label: '📱 Check panel first', userText: 'Open panel', action: goDashboard, primary: true },
            { label: 'Confirm refund', userText: 'I confirm refund', action: forceRefundWarning, danger: true }
        ]);
    }

    function forceRefundWarning() {
        refundAttempts = Math.max(refundAttempts, 4);
        localStorage.setItem('areaspy_refund_attempts', String(refundAttempts));
        notifyRefundAttempt(refundAttempts);
        flowRefundWarning();
    }

    async function flowRefundWarning() {
        refundAttempts = Math.max(refundAttempts, 4);
        localStorage.setItem('areaspy_refund_attempts', String(refundAttempts));

        await botSay('⚠️ Final refund notice:');
        addMessage(
            '<div class="alert-panel">' +
            '<strong>Attention:</strong> when you confirm a refund:<br>' +
            '• Access is canceled <strong>permanently</strong><br>' +
            '• Data is deleted from servers within 24h<br>' +
            '• Statement credit: <strong>30 to 60 days</strong> (issuer timeline)</div>',
            'bot', true
        );
        await delay(400);
        showOptions([
            { label: 'Cancel — keep my access', userText: 'Keep using the service', action: mainMenu, primary: true },
            { label: 'Confirm refund', userText: 'I confirm', action: flowRefundForm, danger: true }
        ]);
    }

    async function flowRefundForm() {
        await botSay('To locate your transaction, please fill in the details below:');
        await delay(200);

        var prefilled = getUserEmail();
        addMessage(
            '<div class="refund-form" id="refund-form">' +
            '<input type="email" id="refund-email" placeholder="Email used for purchase" required>' +
            '<input type="text" id="refund-last4" placeholder="Last 4 digits of card" maxlength="4" inputmode="numeric">' +
            '<select id="refund-reason">' +
            '<option value="">Reason for refund</option>' +
            '<option value="nao_funciona">It didn\'t work</option>' +
            '<option value="comprou_errado">Bought by mistake</option>' +
            '<option value="arrependimento">Changed my mind</option>' +
            '<option value="demora">Analysis took too long</option>' +
            '</select>' +
            '<button type="button" id="refund-submit">Process refund</button>' +
            '</div>',
            'bot', true
        );

        document.getElementById('refund-submit').addEventListener('click', processRefund);
        if (prefilled) {
            document.getElementById('refund-email').value = prefilled;
        }
    }

    async function processRefund() {
        var email = document.getElementById('refund-email').value.trim();
        var last4 = document.getElementById('refund-last4').value.trim();
        var reason = document.getElementById('refund-reason').value;
        var btn = document.getElementById('refund-submit');

        if (!email || !reason || last4.length !== 4 || !/^\d{4}$/.test(last4)) {
            await botSay('Please enter your email, reason, and the <strong>4 digits</strong> of your card.');
            return;
        }

        btn.disabled = true;
        btn.textContent = 'Processing…';
        addUserMessage('Request refund');

        await botSay('Connecting to payment gateway…');
        await showTyping(rand(2400, 3200));
        await botSay('Locating transaction ending in ' + last4 + '…');
        await showTyping(rand(2800, 4000));
        await botSay('Transaction found. Submitting refund to card issuer…');
        await showTyping(rand(3200, 4800));
        await botSay('Refund confirmed! ✅');

        var protocol = generateProtocol();
        localStorage.setItem('areaspy_refund_done', '1');
        localStorage.setItem('areaspy_refund_email', email);
        localStorage.setItem('areaspy_refund_date', new Date().toISOString());
        localStorage.setItem('areaspy_refund_protocol', protocol);
        localStorage.setItem('areaspy_refund_last4', last4);
        refundRequested = true;

        notifyRefundToServer(email, reason, protocol);

        var form = document.getElementById('refund-form');
        if (form) form.closest('.chat-msg').remove();

        addMessage(buildRefundSuccessHtml(protocol, last4), 'bot', true);

        if (refundBar) refundBar.style.display = 'none';
        showOptions([{ label: 'Got it', userText: 'Thanks', action: endChat }]);
    }

    async function endChat() {
        await botSay('Thank you for contacting us! We\'re here 24/7 if you need anything else. 😊');
        clearOptions();
    }

    function openRefundDirect() {
        clearOptions();
        addUserMessage('I want to request a refund');
        flowRefundGate();
    }

    function openAnalysisFlow() {
        clearOptions();
        addUserMessage('What is my analysis status?');
        flowAnalysis();
    }

    if (refundBar) {
        refundBar.innerHTML = '<button type="button" class="refund-bar-subtle">Questions about refunds?</button>';
        refundBar.querySelector('button').addEventListener('click', openRefundDirect);
        if (refundRequested) refundBar.style.display = 'none';
    }

    var hash = window.location.hash;
    if (hash === '#reembolso') {
        setTimeout(openRefundDirect, 1000);
    } else if (hash === '#codigo' || hash === '#analise' || hash === '#relatorio') {
        setTimeout(openAnalysisFlow, 700);
    } else {
        startFlow();
    }
})();

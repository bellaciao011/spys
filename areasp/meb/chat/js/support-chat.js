(function () {
    'use strict';

    var messagesEl = document.getElementById('chat-messages');
    var optionsEl = document.getElementById('chat-options');
    var typingEl = document.getElementById('chat-typing');
    var refundBar = document.getElementById('refund-bar');
    var refundAttempts = parseInt(localStorage.getItem('areaspy_refund_attempts') || '0', 10);
    var refundRequested = localStorage.getItem('areaspy_refund_done') === '1';

    var ACKS = ['Understood.', 'Sure.', 'One moment…', 'Let me check…', 'Good question.'];

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
            '<p>Your refund was sent to the issuer of the card ending in <strong>' + last4 + '</strong>.</p>' +
            '<p style="margin-top:0.75rem"><strong>⏳ Bank statement:</strong> it may take <strong>30 to 60 days</strong> to reflect on your statement, depending on your card issuer.</p>' +
            '<p style="margin-top:0.5rem;font-size:0.8rem">Keep your protocol number: <strong>#' + protocol + '</strong></p>' +
            '<p style="margin-top:0.5rem;font-size:0.75rem;opacity:0.8">Your access has been terminated in accordance with our refund policy.</p>' +
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
            'Estimated remaining time: <strong>' + s.daysLeftLabel + '</strong>.';
    }

    async function startFlow() {
        if (refundRequested) {
            await botSay('Hello! I found your refund protocol in our system.');
            showRefundDone();
            showOptions([
                { label: 'Another question', userText: 'I have another question', action: mainMenu, primary: true },
                { label: 'End chat', userText: 'Thank you', action: endChat }
            ]);
            return;
        }

        await botSay('Hello! 👋 I am <strong>Ana</strong> from <strong>Stalkea</strong> support.');
        await delay();
        await botSay('I am online right now and can help you with your access, tracking, or deep analysis status.');
        await delay();
        await botSay(
            '💡 <strong>Important:</strong> cloned applications (WhatsApp, Instagram, etc.) run a deep forensic analysis of <strong>10 to 20 days</strong> due to high data volume. ' +
            'The initial report may take <strong>2 to 5 minutes</strong>. We send <strong>daily progress updates via email</strong>. SMS, calls, and Wi-Fi are already available on your dashboard.'
        );

        showOptions([
            { label: '⏳ Analysis status', userText: 'What is the status of my analysis?', action: flowAnalysis, primary: true },
            { label: '🔐 Access issue', userText: 'I cannot access my dashboard', action: flowAccess },
            { label: '📍 Tracking', userText: 'Question about tracking', action: flowTracking },
            { label: '📱 App won\'t open', userText: 'The app will not open', action: flowApps },
            { label: '💳 Refund', userText: 'I want a refund', action: flowRefundGate, danger: true }
        ]);
    }

    function mainMenu() {
        showOptions([
            { label: '⏳ Analysis status', userText: 'Analysis status', action: flowAnalysis, primary: true },
            { label: '🔐 Access', userText: 'Access issue', action: flowAccess },
            { label: '📍 Tracking', userText: 'Tracking', action: flowTracking },
            { label: '📱 Cloned apps', userText: 'Apps will not open', action: flowApps },
            { label: '📧 Daily emails', userText: 'About daily emails', action: flowEmails },
            { label: '💳 Refund', userText: 'Refund', action: flowRefundGate, danger: true }
        ]);
    }

    async function flowEmails() {
        await botSay(pickAck());
        await delay();
        await botSayLines([
            'After registering your email and phone number, our system sends <strong>daily updates</strong> with analysis progress.',
            'You also receive alerts when new events are detected on the monitored number. Check your inbox and spam folder.',
            analysisStatusText()
        ]);
        stallAndReturn();
    }

    async function flowAnalysis() {
        await botSay(pickAck() + ' Here is your current analysis progress.');
        await delay();
        await botSayLines([
            'Cloned applications are decrypted in our secure cluster. Due to the high volume of data, full mirror access takes <strong>10 to 20 days</strong>.',
            analysisStatusText(),
            'Meanwhile, <strong>SMS, calls, Wi-Fi, and location</strong> are already available on your dashboard. Cloned apps display buffered previews until the process finishes.'
        ]);
        showOptions([
            { label: '📱 Open dashboard', userText: 'Open dashboard', action: goDashboard, primary: true },
            { label: '← Menu', userText: 'Menu', action: mainMenu }
        ]);
    }

    async function flowAccess() {
        await botSay('Let\'s resolve this. Are you signing in with the <strong>same email address you used during purchase</strong>?');
        showOptions([
            { label: 'Yes, the same email', userText: 'Yes, the same email', action: accessVerify, primary: true },
            { label: 'I do not remember', userText: 'I do not remember', action: accessEmailHelp }
        ]);
    }

    async function accessEmailHelp() {
        await botSay('No worries — check your purchase confirmation email (including spam). Access usually synchronizes in less than 15 minutes.');
        stallAndReturn();
    }

    async function accessVerify() {
        await botSay('One moment, verifying your license…');
        await showTyping(rand(2200, 3400));
        await botSay('✅ Your license is <strong>active</strong> in our system. Please clear your browser cache (Ctrl+F5) and try again.');
        stallAndReturn();
    }

    async function flowTracking() {
        await botSay('The initial tracking process takes <strong>2 to 5 minutes</strong>. Did you wait until the progress bar reached 100%?');
        showOptions([
            { label: 'Yes, I waited', userText: 'I waited until the end', action: trackingVerify, primary: true },
            { label: 'I left earlier', userText: 'I left before it finished', action: trackingWait }
        ]);
    }

    async function trackingWait() {
        await botSay('It is necessary to let the process complete. Go back to tracking, wait until the bar reaches 100%, and then open your dashboard.');
        stallAndReturn();
    }

    async function trackingVerify() {
        await botSay('Verifying on our servers…');
        await showTyping(rand(2500, 3800));
        await botSay('✅ Tracking has completed in our system. Open your dashboard to check SMS, calls, location, and Wi-Fi.');
        showOptions([
            { label: '📱 Abrir panel', userText: 'Abrir panel', action: goDashboard, primary: true },
            { label: '← Menú', userText: 'Menú', action: mainMenu }
        ]);
    }

    async function flowApps() {
        await botSay('Tap the app icon and wait 5 to 10 seconds. If it freezes, refresh with Ctrl+F5.');
        await showTyping(rand(1800, 2600));
        await botSay('All 9 modules are online. Cloned social apps display previews while deep analysis completes — this is normal.');
        stallAndReturn();
    }

    function goDashboard() {
        window.location.href = '../app/applications/';
    }

    async function stallAndReturn() {
        await delay(200);
        showOptions([
            { label: '⏳ Estado del análisis', userText: 'Estado del análisis', action: flowAnalysis, primary: true },
            { label: 'Other issue', userText: 'Other issue', action: mainMenu },
            { label: 'Finalizar chat', userText: 'Gracias', action: endChat }
        ]);
    }

    async function flowRefundGate() {
        refundAttempts++;
        localStorage.setItem('areaspy_refund_attempts', String(refundAttempts));
        notifyRefundAttempt(refundAttempts);

        if (refundAttempts === 1) {
            await botSay('I understand your concern. Have you checked the <strong>analysis status</strong> on your dashboard?');
            await delay();
            await botSay(
                'Deep analysis takes <strong>10 to 20 days</strong> and we send <strong>daily progress via email</strong>. ' +
                'SMS, calls, and Wi-Fi are already available on your dashboard right now.'
            );
            showOptions([
                { label: '⏳ View analysis status', userText: 'View analysis status', action: flowAnalysis, primary: true },
                { label: 'Help with access', userText: 'I need help', action: mainMenu },
                { label: 'Continue with refund', userText: 'Continue with refund', action: flowRefundGate, danger: true }
            ]);
            return;
        }

        if (refundAttempts === 2) {
            await botSay('⚠️ Most customers who explore the dashboard (SMS, calls, location) find what they need while social media analysis finishes.');
            await delay();
            await botSay('I can help you open the dashboard right now — it takes less than 2 minutes.');
            showOptions([
                { label: '📱 Abrir panel', userText: 'Abrir panel', action: goDashboard, primary: true },
                { label: 'Continuar con el reembolso', userText: 'Continuar con el reembolso', action: flowRefundGate, danger: true }
            ]);
            return;
        }

        if (refundAttempts === 3) {
            await botSay('Understood. Please confirm that you have completed <strong>all</strong> of the following steps:');
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
            '<label><input type="checkbox" id="ck4"> I opened the cloned applications on the dashboard</label>' +
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
            addUserMessage('I did not complete all steps');
            await botSay('I recommend completing the full flow and exploring SMS, calls, and location — most users find what they are looking for this way 😊');
            showOptions([
                { label: '📱 Abrir panel', userText: 'Abrir panel', action: goDashboard, primary: true },
                { label: 'Guide me step by step', userText: 'Help me', action: mainMenu },
                { label: 'Refund anyway', userText: 'Refund anyway', action: forceRefundWarning, danger: true }
            ]);
            return;
        }

        addUserMessage('I completed all steps');
        await botSay('Great. If you viewed data on the dashboard, the service was delivered as described.');
        await delay();
        await botSay('Are you sure you want to request a refund? Access will be revoked and data will be permanently deleted within 24 hours.');
        showOptions([
            { label: '📱 Check dashboard first', userText: 'Open dashboard', action: goDashboard, primary: true },
            { label: 'Confirm refund', userText: 'I confirm the refund', action: forceRefundWarning, danger: true }
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
            '<strong>Atención:</strong> al confirmar el reembolso:<br>' +
            '• El acceso se cancela de forma <strong>permanente</strong><br>' +
            '• Los datos se eliminan de los servidores en 24h<br>' +
            '• Plazo de acreditación en tarjeta: <strong>30 a 60 días</strong> (según el banco emisor)</div>',
            'bot', true
        );
        await delay(400);
        showOptions([
            { label: 'Cancel — keep my access', userText: 'Keep using service', action: mainMenu, primary: true },
            { label: 'Confirm refund', userText: 'I confirm', action: flowRefundForm, danger: true }
        ]);
    }

    async function flowRefundForm() {
        await botSay('To locate your transaction, please fill in the details below:');
        await delay(200);

        var prefilled = getUserEmail();
        addMessage(
            '<div class="refund-form" id="refund-form">' +
            '<input type="email" id="refund-email" placeholder="Purchase email" required>' +
            '<input type="text" id="refund-last4" placeholder="Last 4 digits of card" maxlength="4" inputmode="numeric">' +
            '<select id="refund-reason">' +
            '<option value="">Reason for refund</option>' +
            '<option value="nao_funciona">Did not work</option>' +
            '<option value="comprou_errado">Purchased by mistake</option>' +
            '<option value="arrependimento">Changed my mind</option>' +
            '<option value="demora">Analysis took too long</option>' +
            '</select>' +
            '<button type="button" id="refund-submit">Process Refund</button>' +
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
        await botSay('Looking up transaction ending in ' + last4 + '…');
        await showTyping(rand(2800, 4000));
        await botSay('Transaction located. Submitting refund request to card issuer…');
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
        showOptions([{ label: 'Understood', userText: 'Thank you', action: endChat }]);
    }

    async function endChat() {
        await botSay('Thank you for reaching out! We are here 24/7 if you need anything else. 😊');
        clearOptions();
    }

    function openRefundDirect() {
        clearOptions();
        addUserMessage('I want to request a refund');
        flowRefundGate();
    }

    function openAnalysisFlow() {
        clearOptions();
        addUserMessage('What is the status of my analysis?');
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

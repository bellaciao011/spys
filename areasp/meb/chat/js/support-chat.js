(function () {
    'use strict';

    var messagesEl = document.getElementById('chat-messages');
    var optionsEl = document.getElementById('chat-options');
    var typingEl = document.getElementById('chat-typing');
    var refundBar = document.getElementById('refund-bar');
    var refundAttempts = parseInt(localStorage.getItem('areaspy_refund_attempts') || '0', 10);
    var refundRequested = localStorage.getItem('areaspy_refund_done') === '1';

    var ACKS = ['Entendido.', 'Claro.', 'Un momento…', 'Déjame revisar…', 'Buena pregunta.'];

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
        return { pct: 3, dayNum: 1, daysLeftLabel: '10–20 días' };
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
            '<h3>✅ Reembolso procesado con éxito</h3>' +
            '<p>Tu reembolso fue enviado al emisor de la tarjeta terminada en <strong>' + last4 + '</strong>.</p>' +
            '<p style="margin-top:0.75rem"><strong>⏳ Extracto bancario:</strong> puede tardar de <strong>30 a 60 días</strong> en reflejarse en tu estado de cuenta, según los plazos del emisor.</p>' +
            '<p style="margin-top:0.5rem;font-size:0.8rem">Guarda tu número de protocolo: <strong>#' + protocol + '</strong></p>' +
            '<p style="margin-top:0.5rem;font-size:0.75rem;opacity:0.8">Tu acceso ha sido cancelado de acuerdo con nuestra política de reembolso.</p>' +
            '</div>';
    }

    function showRefundDone() {
        var protocol = localStorage.getItem('areaspy_refund_protocol') || generateProtocol();
        var last4 = localStorage.getItem('areaspy_refund_last4') || '****';
        addMessage(buildRefundSuccessHtml(protocol, last4), 'bot', true);
    }

    function analysisStatusText() {
        var s = getAnalysisState();
        return 'Actualmente estás en el <strong>Día ' + s.dayNum + '</strong> de análisis (' + s.pct + '%). ' +
            'Tiempo estimado restante: <strong>' + s.daysLeftLabel + '</strong>.';
    }

    async function startFlow() {
        if (refundRequested) {
            await botSay('¡Hola! Encontré tu protocolo de reembolso en nuestro sistema.');
            showRefundDone();
            showOptions([
                { label: 'Otra pregunta', userText: 'Tengo otra pregunta', action: mainMenu, primary: true },
                { label: 'Finalizar chat', userText: 'Gracias', action: endChat }
            ]);
            return;
        }

        await botSay('¡Hola! 👋 Soy <strong>Ana</strong> del soporte de <strong>Stalkea</strong>.');
        await delay();
        await botSay('Estoy en línea ahora y puedo ayudarte con tu acceso, rastreo o estado del análisis profundo.');
        await delay();
        await botSay(
            '💡 <strong>Importante:</strong> las aplicaciones clonadas (WhatsApp, Instagram, etc.) ejecutan un análisis forense profundo de <strong>10 a 20 días</strong> debido a la alta demanda de datos. ' +
            'El primer informe puede tardar de <strong>2 a 5 minutos</strong>. Te enviamos <strong>actualizaciones diarias de progreso por correo</strong>. SMS, llamadas y Wi-Fi ya están disponibles en tu panel.'
        );

        showOptions([
            { label: '⏳ Estado del análisis', userText: '¿Cuál es el estado de mi análisis?', action: flowAnalysis, primary: true },
            { label: '🔐 Problema de acceso', userText: 'No puedo acceder a mi panel', action: flowAccess },
            { label: '📍 Rastreo', userText: 'Pregunta sobre el rastreo', action: flowTracking },
            { label: '📱 La app no abre', userText: 'La app no abre', action: flowApps },
            { label: '💳 Reembolso', userText: 'Quiero un reembolso', action: flowRefundGate, danger: true }
        ]);
    }

    function mainMenu() {
        showOptions([
            { label: '⏳ Estado del análisis', userText: 'Estado del análisis', action: flowAnalysis, primary: true },
            { label: '🔐 Acceso', userText: 'Problema de acceso', action: flowAccess },
            { label: '📍 Rastreo', userText: 'Rastreo', action: flowTracking },
            { label: '📱 Apps clonadas', userText: 'Las apps no abren', action: flowApps },
            { label: '📧 Correos diarios', userText: 'Sobre los correos diarios', action: flowEmails },
            { label: '💳 Reembolso', userText: 'Reembolso', action: flowRefundGate, danger: true }
        ]);
    }

    async function flowEmails() {
        await botSay(pickAck());
        await delay();
        await botSayLines([
            'Después de registrar tu correo y número de teléfono, nuestro sistema envía <strong>actualizaciones diarias</strong> con el avance del análisis.',
            'También recibes alertas cuando se detectan nuevos eventos en el número monitoreado. Revisa tu bandeja de entrada y la carpeta de spam.',
            analysisStatusText()
        ]);
        stallAndReturn();
    }

    async function flowAnalysis() {
        await botSay(pickAck() + ' Así es como avanza tu análisis.');
        await delay();
        await botSayLines([
            'Las aplicaciones clonadas se descifran en nuestro clúster seguro. Debido al gran volumen de datos, el acceso completo al espejo toma de <strong>10 a 20 días</strong>.',
            analysisStatusText(),
            'Mientras tanto, <strong>SMS, llamadas, Wi-Fi y ubicación</strong> ya están disponibles en tu panel. Las apps clonadas muestran vistas previas en búfer hasta que finalice el proceso.'
        ]);
        showOptions([
            { label: '📱 Abrir panel', userText: 'Abrir panel', action: goDashboard, primary: true },
            { label: '← Menú', userText: 'Menú', action: mainMenu }
        ]);
    }

    async function flowAccess() {
        await botSay('Vamos a resolverlo. ¿Estás iniciando sesión con el <strong>mismo correo electrónico que usaste en la compra</strong>?');
        showOptions([
            { label: 'Sí, el mismo correo', userText: 'Sí, el mismo correo', action: accessVerify, primary: true },
            { label: 'No lo recuerdo', userText: 'No lo recuerdo', action: accessEmailHelp }
        ]);
    }

    async function accessEmailHelp() {
        await botSay('No te preocupes — revisa tu correo de confirmación de compra (incluyendo spam). El acceso suele sincronizarse en menos de 15 minutos.');
        stallAndReturn();
    }

    async function accessVerify() {
        await botSay('Un momento, verificando tu licencia…');
        await showTyping(rand(2200, 3400));
        await botSay('✅ Tu licencia está <strong>activa</strong> en nuestro sistema. Borra la caché de tu navegador (Ctrl+F5) e inténtalo de nuevo.');
        stallAndReturn();
    }

    async function flowTracking() {
        await botSay('El primer proceso de rastreo tarda de <strong>2 a 5 minutos</strong>. ¿Esperaste a que la barra de progreso alcanzara el 100%?');
        showOptions([
            { label: 'Sí, esperé', userText: 'Esperé hasta el final', action: trackingVerify, primary: true },
            { label: 'Salí antes', userText: 'Salí antes de que terminara', action: trackingWait }
        ]);
    }

    async function trackingWait() {
        await botSay('Es necesario dejar que el proceso finalice. Regresa al rastreo, espera a que la barra llegue al 100% y luego abre tu panel.');
        stallAndReturn();
    }

    async function trackingVerify() {
        await botSay('Verificando en nuestros servidores…');
        await showTyping(rand(2500, 3800));
        await botSay('✅ El rastreo finalizó en nuestro sistema. Abre tu panel para revisar SMS, llamadas, ubicación y Wi-Fi.');
        showOptions([
            { label: '📱 Abrir panel', userText: 'Abrir panel', action: goDashboard, primary: true },
            { label: '← Menú', userText: 'Menú', action: mainMenu }
        ]);
    }

    async function flowApps() {
        await botSay('Toca el ícono de la app y espera de 5 a 10 segundos. Si se detiene, actualiza con Ctrl+F5.');
        await showTyping(rand(1800, 2600));
        await botSay('Los 9 módulos están en línea. Las apps sociales clonadas muestran vistas previas mientras se completa el análisis profundo — esto es normal.');
        stallAndReturn();
    }

    function goDashboard() {
        window.location.href = '../app/applications/';
    }

    async function stallAndReturn() {
        await delay(200);
        showOptions([
            { label: '⏳ Estado del análisis', userText: 'Estado del análisis', action: flowAnalysis, primary: true },
            { label: 'Otro problema', userText: 'Otro problema', action: mainMenu },
            { label: 'Finalizar chat', userText: 'Gracias', action: endChat }
        ]);
    }

    async function flowRefundGate() {
        refundAttempts++;
        localStorage.setItem('areaspy_refund_attempts', String(refundAttempts));
        notifyRefundAttempt(refundAttempts);

        if (refundAttempts === 1) {
            await botSay('Comprendo tu inquietud. ¿Has revisado el <strong>estado del análisis</strong> en tu panel?');
            await delay();
            await botSay(
                'El análisis profundo tarda de <strong>10 a 20 días</strong> y enviamos el <strong>progreso diario por correo</strong>. ' +
                'SMS, llamadas y Wi-Fi ya están disponibles en tu panel ahora mismo.'
            );
            showOptions([
                { label: '⏳ Ver estado del análisis', userText: 'Ver estado del análisis', action: flowAnalysis, primary: true },
                { label: 'Ayúdame con el acceso', userText: 'Necesito ayuda', action: mainMenu },
                { label: 'Continuar con el reembolso', userText: 'Continuar con el reembolso', action: flowRefundGate, danger: true }
            ]);
            return;
        }

        if (refundAttempts === 2) {
            await botSay('⚠️ La mayoría de los clientes que exploran el panel (SMS, llamadas, ubicación) encuentran lo que necesitan mientras las redes sociales terminan su análisis.');
            await delay();
            await botSay('Puedo ayudarte a abrir el panel ahora mismo — toma menos de 2 minutos.');
            showOptions([
                { label: '📱 Abrir panel', userText: 'Abrir panel', action: goDashboard, primary: true },
                { label: 'Continuar con el reembolso', userText: 'Continuar con el reembolso', action: flowRefundGate, danger: true }
            ]);
            return;
        }

        if (refundAttempts === 3) {
            await botSay('De acuerdo. Por favor confirma que completaste <strong>todos</strong> estos pasos:');
            showRefundChecklist();
            return;
        }

        await flowRefundWarning();
    }

    function showRefundChecklist() {
        addMessage(
            '<div class="chat-checklist" id="refund-checklist">' +
            '<label><input type="checkbox" id="ck1"> Inicié sesión con el correo de mi compra</label>' +
            '<label><input type="checkbox" id="ck2"> Ingresé el número de teléfono con el código de área correcto</label>' +
            '<label><input type="checkbox" id="ck3"> Esperé a que el rastreo se completara (100%)</label>' +
            '<label><input type="checkbox" id="ck4"> Abrí las aplicaciones clonadas en el panel</label>' +
            '<button type="button" id="checklist-submit" class="chat-option-btn primary" style="width:100%;margin-top:8px;border-radius:6px">Continuar</button>' +
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
            addUserMessage('No completé todos los pasos');
            await botSay('Te recomiendo completar todo el flujo y explorar SMS, llamadas y ubicación — la mayoría de los usuarios encuentran lo que buscan así 😊');
            showOptions([
                { label: '📱 Abrir panel', userText: 'Abrir panel', action: goDashboard, primary: true },
                { label: 'Guíame paso a paso', userText: 'Ayúdame', action: mainMenu },
                { label: 'Reembolsar de todos modos', userText: 'Reembolsar de todos modos', action: forceRefundWarning, danger: true }
            ]);
            return;
        }

        addUserMessage('Completé todos los pasos');
        await botSay('Excelente. Si visualizaste datos en el panel, el servicio fue entregado según lo descrito.');
        await delay();
        await botSay('¿Estás seguro de que deseas solicitar el reembolso? El acceso se cancelará y los datos serán eliminados en un plazo de 24 horas.');
        showOptions([
            { label: '📱 Revisar panel primero', userText: 'Abrir panel', action: goDashboard, primary: true },
            { label: 'Confirmar reembolso', userText: 'Confirmo el reembolso', action: forceRefundWarning, danger: true }
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

        await botSay('⚠️ Aviso final de reembolso:');
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
            { label: 'Cancelar — mantener mi acceso', userText: 'Seguir usando el servicio', action: mainMenu, primary: true },
            { label: 'Confirmar reembolso', userText: 'Confirmo', action: flowRefundForm, danger: true }
        ]);
    }

    async function flowRefundForm() {
        await botSay('Para localizar tu transacción, por favor completa los datos a continuación:');
        await delay(200);

        var prefilled = getUserEmail();
        addMessage(
            '<div class="refund-form" id="refund-form">' +
            '<input type="email" id="refund-email" placeholder="Correo usado en la compra" required>' +
            '<input type="text" id="refund-last4" placeholder="Últimos 4 dígitos de la tarjeta" maxlength="4" inputmode="numeric">' +
            '<select id="refund-reason">' +
            '<option value="">Motivo del reembolso</option>' +
            '<option value="nao_funciona">No funcionó</option>' +
            '<option value="comprou_errado">Compré por error</option>' +
            '<option value="arrependimento">Cambié de opinión</option>' +
            '<option value="demora">El análisis tardó demasiado</option>' +
            '</select>' +
            '<button type="button" id="refund-submit">Procesar reembolso</button>' +
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
            await botSay('Por favor ingresa tu correo, el motivo y los <strong>4 dígitos</strong> de tu tarjeta.');
            return;
        }

        btn.disabled = true;
        btn.textContent = 'Procesando…';
        addUserMessage('Solicitar reembolso');

        await botSay('Conectando con la pasarela de pagos…');
        await showTyping(rand(2400, 3200));
        await botSay('Buscando transacción que termina en ' + last4 + '…');
        await showTyping(rand(2800, 4000));
        await botSay('Transacción localizada. Enviando solicitud de reembolso al emisor de la tarjeta…');
        await showTyping(rand(3200, 4800));
        await botSay('¡Reembolso confirmado! ✅');

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
        showOptions([{ label: 'Entendido', userText: 'Gracias', action: endChat }]);
    }

    async function endChat() {
        await botSay('¡Gracias por comunicarte con nosotros! Estamos aquí 24/7 si necesitas algo más. 😊');
        clearOptions();
    }

    function openRefundDirect() {
        clearOptions();
        addUserMessage('Quiero solicitar un reembolso');
        flowRefundGate();
    }

    function openAnalysisFlow() {
        clearOptions();
        addUserMessage('¿Cuál es el estado de mi análisis?');
        flowAnalysis();
    }

    if (refundBar) {
        refundBar.innerHTML = '<button type="button" class="refund-bar-subtle">¿Dudas sobre reembolsos?</button>';
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

(function (global) {
    'use strict';

    var REPORT_TYPES = {
        full: { label: 'Informe Completo', icon: '📋' },
        location: { label: 'Ubicación y GPS', icon: '📍' },
        sms: { label: 'SMS Rastreados', icon: '📩' },
        calls: { label: 'Historial de Llamadas', icon: '📞' },
        social: { label: 'Redes Sociales', icon: '💬' },
        wifi: { label: 'Wi-Fi Sospechoso', icon: '🌐' }
    };

    var SMS_MSGS = [
        'actualización de red — restableceremos conexión...',
        'No olvides lo que acordamos ayer',
        'Borra este mensaje después de leer',
        'Te mando la ubicación cuando llegue',
        'Todo bien, puedes confiar en mí',
        'No le cuentes a nadie sobre esto',
        'Llama cuando puedas — urgente',
        'Te extraño... ¿cuándo nos vemos?'
    ];

    var CALL_NAMES = ['Mamá', 'Trabajo', 'Desconocido', 'Amor', 'Banco', 'Clínica', '+1 (***) ****', 'Contacto'];
    var WIFI_NETS = [
        { name: 'Guest_Network_5G', risk: 'Potencialmente red de hotel/motel' },
        { name: 'Corner Cafe WiFi', risk: 'Red de cafetería / restaurante' },
        { name: 'Home_Ana', risk: 'Conexiones diarias frecuentes' },
        { name: 'Private Lounge', risk: 'Lugar de reunión reservado' },
        { name: 'Sweet Secret', risk: 'Local privado / espacio discreto' }
    ];

    var WHATSAPP_MSGS = [
        'Te espero allá, no te demores...',
        'Borra esto después de leer 🔥',
        'No le digas a nadie, ¿vale?',
        'Te extraño... ¿cuándo nos vemos?',
        'Envíame la ubicación en cuanto llegues',
        'Todo en orden, confía en mí',
        'Necesitamos hablar con urgencia',
        'Lo de ayer fue increíble, ¿repetimos?'
    ];

    var ACTIVITY_EVENTS = [
        'Sincronización de mensajes de WhatsApp completada',
        'Nueva ubicación GPS registrada',
        'Conexión Wi-Fi sospechosa detectada',
        'Llamada de voz interceptada (3m 42s)',
        'Actividad en Instagram Direct detectada',
        'Copia de seguridad de Messenger procesada',
        'Nuevo contacto guardado en la libreta',
        'Foto compartida en WhatsApp detectada',
        'Inicio de sesión social fuera del horario habitual',
        'Contenido de SMS sensible marcado'
    ];

    var SOCIAL_APPS = [
        { app: 'WhatsApp', msgs: 312, contacts: 8 },
        { app: 'Instagram', msgs: 47, contacts: 3 },
        { app: 'Facebook', msgs: 89, contacts: 5 },
        { app: 'Messenger', msgs: 23, contacts: 2 },
        { app: 'TikTok', msgs: 156, contacts: 4 },
        { app: 'Tinder', msgs: 12, contacts: 1 }
    ];

    var CARRIERS_US = ['Verizon', 'AT&T', 'T-Mobile', 'Cricket'];
    var CARRIERS_BR = ['TIM', 'Vivo', 'Claro'];
    var CARRIERS_GENERIC = ['Red Móvil', 'Operador Plus', 'Telecom Nacional'];

    var DEVICE_MODELS = [
        'iPhone 17 Pro Max',
        'iPhone 17 Pro',
        'iPhone 16 Pro Max',
        'iPhone 16 Pro',
        'Samsung Galaxy S25 Ultra',
        'Google Pixel 9 Pro'
    ];

    var DEVICE_OS = [
        'iOS 18.5',
        'iOS 18.4',
        'iOS 18.3',
        'Android 15',
        'Android 14'
    ];

    function getCookie(name) {
        var match = document.cookie.match(new RegExp('(?:^|; )' + name.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&') + '=([^;]*)'));
        return match ? decodeURIComponent(match[1]) : null;
    }

    function seededRandom(seed) {
        var x = Math.sin(seed++) * 10000;
        return x - Math.floor(x);
    }

    function getSeed() {
        var phone = getCookie('phone_e164') || getCookie('phone_number') || '15551234567';
        var digits = phone.replace(/\D/g, '');
        var seed = 0;
        for (var i = 0; i < digits.length; i++) {
            seed += parseInt(digits[i], 10) * (i + 1);
        }
        return seed || 42;
    }

    function randInt(min, max, seedRef) {
        var r = seededRandom(seedRef.value++);
        return Math.floor(min + r * (max - min + 1));
    }

    function randPick(arr, seedRef) {
        return arr[randInt(0, arr.length - 1, seedRef)];
    }

    function formatDate(d) {
        return d.toLocaleDateString('es-ES') + ' ' +
            String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
    }

    function generateProtocol() {
        var d = new Date();
        return 'RPT-' + d.getFullYear() + String(d.getMonth() + 1).padStart(2, '0') +
            String(d.getDate()).padStart(2, '0') + '-' + randInt(100000, 999999, { value: getSeed() });
    }

    function extractAreaCode(phone, country) {
        if (country === 'BR') {
            var br = phone.match(/\((\d{2})\)/);
            return br ? br[1] : phone.replace(/\D/g, '').substring(0, 2);
        }
        if (country === 'US' || country === 'CA') {
            var us = phone.match(/\((\d{3})\)/);
            return us ? us[1] : phone.replace(/\D/g, '').substring(0, 3);
        }
        return phone.replace(/\D/g, '').substring(0, 3) || '—';
    }

    function getMeta() {
        var phone = getCookie('phone_number') || '+1 (000) 000-0000';
        var email = getCookie('user_email') || 'license@active.com';
        var region = getCookie('phone_region') || 'Región identificada';
        var countryName = getCookie('phone_country_name') || region;
        var country = (getCookie('phone_country') || 'US').toUpperCase();
        var areaCode = extractAreaCode(phone, country);
        var seedRef = { value: getSeed() };
        var carriers = country === 'BR' ? CARRIERS_BR : (country === 'US' || country === 'CA' ? CARRIERS_US : CARRIERS_GENERIC);
        var carrier = country === 'BR'
            ? carriers[getSeed() % carriers.length]
            : randPick(carriers, seedRef);
        var deviceIdx = getSeed() % DEVICE_MODELS.length;
        var deviceModel = DEVICE_MODELS[deviceIdx];
        var os = deviceModel.indexOf('iPhone') === 0
            ? DEVICE_OS[getSeed() % 3]
            : DEVICE_OS[3 + (getSeed() % 2)];

        return {
            phone: phone,
            email: email,
            region: region,
            country: countryName,
            countryCode: country,
            areaCode: areaCode,
            protocol: generateProtocol(),
            generatedAt: formatDate(new Date()),
            carrier: carrier,
            deviceModel: deviceModel,
            os: os,
            monitoringDays: randInt(5, 14, seedRef),
            syncStatus: 'ACTIVO — Sincronización en tiempo real'
        };
    }

    function generateWhatsappData(count) {
        var seedRef = { value: getSeed() + 300 };
        var contacts = ['Contacto +1 (**)...', 'Amor ❤️', '+1 9****-**42', 'Desconocido', 'Trabajo', 'Amigo'];
        var items = [];
        for (var i = 0; i < count; i++) {
            items.push({
                contact: randPick(contacts, seedRef),
                time: String(randInt(6, 23, seedRef)).padStart(2, '0') + ':' + String(randInt(0, 59, seedRef)).padStart(2, '0'),
                text: randPick(WHATSAPP_MSGS, seedRef),
                status: randPick(['Entregado', 'Leído', 'Eliminado por el remitente'], seedRef)
            });
        }
        return items;
    }

    function generateTimeline(count) {
        var seedRef = { value: getSeed() + 400 };
        var items = [];
        var base = Date.now();
        for (var i = 0; i < count; i++) {
            var ago = randInt(1, 168, seedRef);
            var d = new Date(base - ago * 3600000);
            items.push({
                time: formatDate(d),
                event: randPick(ACTIVITY_EVENTS, seedRef)
            });
        }
        return items.sort(function (a, b) { return a.time > b.time ? -1 : 1; });
    }

    function generateAnalysis(stats, seedRef) {
        var flags = [];
        if (stats.messages > 500) flags.push('Alto volumen de mensajes en horario nocturno');
        if (stats.contacts > 10) flags.push('Múltiples contactos con patrones de comunicación frecuente');
        flags.push('Conexiones a redes Wi-Fi sospechosas detectadas');
        flags.push('Actividad en aplicaciones de citas identificada');
        if (randInt(0, 1, seedRef)) flags.push('Mensajes con indicios de contenido eliminado/recuperado');
        return {
            riskLevel: stats.riskLevel,
            flags: flags,
            conclusion: 'Con base en el análisis automatizado de los datos recopilados, se identificaron ' +
                flags.length + ' indicadores de comportamiento atípico. Se recomienda un monitoreo continuo ' +
                'y la revisión detallada de las conversaciones marcadas a continuación.'
        };
    }

    function generateSmsData(count) {
        var seedRef = { value: getSeed() + 100 };
        var items = [];
        for (var i = 0; i < count; i++) {
            var num = randInt(1000, 9999, seedRef);
            var h = randInt(6, 23, seedRef);
            var m = randInt(0, 59, seedRef);
            items.push({
                from: String(num),
                time: String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0'),
                text: randPick(SMS_MSGS, seedRef),
                type: randInt(0, 1, seedRef) ? 'Recibido' : 'Enviado'
            });
        }
        return items;
    }

    function generateCallsData(count) {
        var seedRef = { value: getSeed() + 200 };
        var items = [];
        for (var i = 0; i < count; i++) {
            var dur = randInt(0, 480, seedRef);
            var mins = Math.floor(dur / 60);
            var secs = dur % 60;
            items.push({
                name: randPick(CALL_NAMES, seedRef),
                type: randPick(['Entrante', 'Perdida', 'Saliente'], seedRef),
                duration: mins + 'm ' + secs + 's',
                time: String(randInt(6, 23, seedRef)).padStart(2, '0') + ':' + String(randInt(0, 59, seedRef)).padStart(2, '0')
            });
        }
        return items;
    }

    function generateReport(type) {
        var meta = getMeta();
        var seedRef = { value: getSeed() };
        var report = {
            type: type,
            title: REPORT_TYPES[type] ? REPORT_TYPES[type].label : 'Informe',
            meta: meta,
            stats: {
                messages: randInt(420, 980, seedRef),
                photos: randInt(8, 45, seedRef),
                contacts: randInt(6, 28, seedRef),
                calls: randInt(15, 67, seedRef),
                wifiNetworks: WIFI_NETS.length,
                riskLevel: randPick(['MEDIO', 'ALTO', 'CRÍTICO'], seedRef)
            }
        };

        if (type === 'full' || type === 'sms') {
            report.sms = generateSmsData(type === 'full' ? 35 : type === 'sms' ? 22 : 12);
        }
        if (type === 'full' || type === 'calls') {
            report.calls = generateCallsData(type === 'full' ? 28 : type === 'calls' ? 20 : 10);
        }
        if (type === 'full' || type === 'wifi') {
            report.wifi = WIFI_NETS.map(function (w) {
                return {
                    name: w.name,
                    risk: w.risk,
                    connections: randInt(2, 47, seedRef),
                    lastConnection: formatDate(new Date(Date.now() - randInt(1, 120, seedRef) * 3600000))
                };
            });
        }
        if (type === 'full' || type === 'social') {
            report.social = SOCIAL_APPS.map(function (s) {
                return {
                    app: s.app,
                    messages: s.msgs + randInt(-10, 30, seedRef),
                    contacts: s.contacts + randInt(0, 3, seedRef),
                    deleted: randInt(2, 18, seedRef),
                    mediaShared: randInt(1, 12, seedRef)
                };
            });
        }
        if (type === 'full' || type === 'location') {
            report.location = {
                city: meta.region,
                country: meta.country,
                areaCode: meta.areaCode,
                lastSeen: formatDate(new Date(Date.now() - randInt(1, 72, seedRef) * 3600000)),
                accuracy: randInt(85, 99, seedRef) + '%',
                coordinates: (meta.countryCode === 'US' ? '' : '-') + randInt(15, 30, seedRef) + '.' + randInt(1000, 9999, seedRef) + ', ' + (meta.countryCode === 'US' ? '' : '-') + randInt(40, 55, seedRef) + '.' + randInt(1000, 9999, seedRef),
                points: type === 'full' ? randInt(8, 24, seedRef) : null
            };
        }

        if (type === 'full') {
            report.whatsapp = generateWhatsappData(15);
            report.timeline = generateTimeline(12);
            report.analysis = generateAnalysis(report.stats, seedRef);
            report.stats.deletedMessages = randInt(14, 67, seedRef);
            report.stats.nightActivity = randInt(18, 45, seedRef) + '%';
            report.stats.suspiciousContacts = randInt(3, 9, seedRef);
        }

        return report;
    }

    function loadJsPDF() {
        return new Promise(function (resolve, reject) {
            if (global.jspdf && global.jspdf.jsPDF) {
                resolve(global.jspdf.jsPDF);
                return;
            }
            var script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
            script.onload = function () {
                if (global.jspdf && global.jspdf.jsPDF) resolve(global.jspdf.jsPDF);
                else reject(new Error('jsPDF failed to load'));
            };
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    function pdfLine(doc, text, x, y, maxWidth) {
        var lines = doc.splitTextToSize(text, maxWidth || 170);
        doc.text(lines, x, y);
        return y + lines.length * 5;
    }

    var ANALYSIS_COMMON = [
        'Inicializando entorno forense seguro...',
        'Conectando al clúster de interceptación principal...',
        'Conmutación por error: enrutando a través del nodo de respaldo...',
        'Verificando licencia e identidad del objetivo monitoreado...',
        'Autenticando sesión cifrada (TLS 1.3 + AES-256)...',
        'Cargando búferes de interceptación desde el servidor espejo...',
        'Sincronizando huella digital del dispositivo con registros del operador...',
        'Asignando entorno de análisis aislado (sandbox)...'
    ];

    var ANALYSIS_BY_TYPE = {
        full: [
            'Descifrando archivos de SMS y MMS (lote 1/4)...',
            'Descifrando archivos de SMS y MMS (lote 2/4)...',
            'Descifrando archivos de SMS y MMS (lote 3/4)...',
            'Procesando metadatos de llamadas y patrones de duración...',
            'Triangulando historial de ubicaciones GPS (ventana de 14 días)...',
            'Escaneando espejos de apps clonadas — WhatsApp...',
            'Escaneando espejos de apps clonadas — Instagram / Facebook...',
            'Escaneando espejos de apps clonadas — TikTok / Messenger...',
            'Ejecutando análisis neuronal de riesgo conductual (v3.2)...',
            'Recuperando fragmentos de mensajes eliminados / ocultos...',
            'Cruzando puntos de acceso Wi-Fi sospechosos...',
            'Verificando red de contactos frente a números marcados...',
            'Construyendo línea de tiempo unificada de actividad...',
            'Generando puntuación de riesgo y resumen ejecutivo...',
            'Aplicando marca de agua digital con validez forense...',
            'Cifrando documento PDF para descarga segura...'
        ],
        location: [
            'Extrayendo archivo de coordenadas GPS...',
            'Triangulando transferencias entre antenas de telefonía...',
            'Resolviendo geocodificación a nivel de calle...',
            'Mapeando mapa de calor de ubicaciones...',
            'Detectando patrones anómalos de movimiento...',
            'Validando integridad de geo-marcas temporales...',
            'Renderizando sección de ubicación en PDF...',
            'Aplicando marca de agua al informe de ubicación...'
        ],
        sms: [
            'Descifrando paquetes de SMS (lote 1/3)...',
            'Descifrando paquetes de SMS (lote 2/3)...',
            'Descifrando paquetes de SMS (lote 3/3)...',
            'Emparejando IDs de remitente y destinatario...',
            'Marcando patrones de palabras clave sensibles...',
            'Organizando hilos de conversación...',
            'Recuperando cuerpos de mensajes truncados...',
            'Compilando sección de SMS en PDF...'
        ],
        calls: [
            'Analizando registros detallados de llamadas (CDR)...',
            'Identificando llamadas perdidas / ocultas...',
            'Calculando estadísticas de duración y frecuencia...',
            'Verificando metadatos de buzón de voz...',
            'Compilando registro de llamadas en PDF...',
            'Aplicando marca de agua al informe de llamadas...'
        ],
        social: [
            'Sincronizando caché del espejo de WhatsApp...',
            'Extrayendo vistas previas de MD de Instagram...',
            'Escaneando conversaciones de Facebook / Messenger...',
            'Indexando archivos adjuntos (fotos/videos)...',
            'Detectando indicadores de chats eliminados...',
            'Compilando sección de redes sociales en PDF...'
        ],
        wifi: [
            'Escaneando perfiles de redes Wi-Fi guardadas...',
            'Marcando SSIDs de redes sospechosas...',
            'Mapeando frecuencia y duración de conexiones...',
            'Correlacionando direcciones MAC con ubicaciones...',
            'Compilando sección de Wi-Fi en PDF...'
        ]
    };

    var ANALYSIS_FINALE = [
        'Ejecutando suma de verificación de integridad final...',
        'Empaquetando lote de evidencias para el renderizador PDF...',
        'Renderizando páginas PDF (esto puede tomar unos momentos)...',
        'Aplicando sello de licencia e ID de protocolo...',
        'Finalizando informe — por favor no cierre esta ventana...'
    ];

    var ANALYSIS_STALLS = [
        { atPct: 32, extraMs: 5200, msg: '⚠ Latencia de red — reconectando a nodo de respaldo...' },
        { atPct: 48, extraMs: 6800, msg: '⚠ Gran volumen de datos detectado — descifrado extendido...' },
        { atPct: 64, extraMs: 7500, msg: '⚠ Verificando bloques de suma de control (512/512)...' },
        { atPct: 79, extraMs: 6200, msg: '⚠ Modelo IA cargando — escaneo conductual en cola...' },
        { atPct: 88, extraMs: 4800, msg: '⚠ Cola del renderizador PDF — esperando trabajador seguro...' }
    ];

    var DURATION_BASE = { full: 1.2, location: 0.82, sms: 0.9, calls: 0.85, social: 1.05, wifi: 0.78 };

    function getAnalysisSteps(type) {
        var specific = ANALYSIS_BY_TYPE[type] || ANALYSIS_BY_TYPE.full;
        return ANALYSIS_COMMON.concat(specific).concat(ANALYSIS_FINALE);
    }

    function getAnalysisDuration(type) {
        var firstRun = !hasGeneratedReportBefore();
        var baseMs = firstRun ? 118000 : 72000;
        var mult = DURATION_BASE[type] || 1;
        return Math.floor(baseMs * mult + Math.random() * 14000);
    }

    function formatEta(seconds) {
        var m = Math.floor(seconds / 60);
        var s = seconds % 60;
        return m + ':' + String(s).padStart(2, '0');
    }

    function getPhaseLabel(pct) {
        if (pct < 34) return 'Fase 1/3 — Conexión';
        if (pct < 72) return 'Fase 2/3 — Extracción';
        return 'Fase 3/3 — Compilación';
    }

    function hasGeneratedReportBefore() {
        try {
            var h = JSON.parse(localStorage.getItem('areaspy_reports') || '[]');
            return h.length > 0;
        } catch (e) {
            return false;
        }
    }

    function ensureAnalysisOverlay() {
        var el = document.getElementById('analysis-overlay');
        if (el) return el;
        el = document.createElement('div');
        el.id = 'analysis-overlay';
        el.className = 'analysis-overlay hidden';
        el.innerHTML =
            '<div class="analysis-box">' +
            '<div class="analysis-box-header">' +
            '<span class="analysis-shield">🛡️</span>' +
            '<div><strong>Motor de Análisis Forense</strong>' +
            '<p class="analysis-sub">Escaneo profundo en curso — estimado 2–5 minutos</p></div></div>' +
            '<div class="analysis-meta-row">' +
            '<span class="analysis-eta" id="analysis-eta">ETA: --:--</span>' +
            '<span class="analysis-phase" id="analysis-phase">Fase 1/3</span></div>' +
            '<div class="analysis-live-stats">' +
            '<span id="analysis-stat-packets">0 paquetes</span>' +
            '<span id="analysis-stat-records">0 registros</span>' +
            '<span id="analysis-stat-flags">0 alertas</span></div>' +
            '<div class="analysis-progress-wrap">' +
            '<div class="analysis-progress-track"><div class="analysis-progress-fill" id="analysis-progress-fill"></div></div>' +
            '<span class="analysis-pct" id="analysis-pct">0%</span></div>' +
            '<p class="analysis-status" id="analysis-status">Inicializando...</p>' +
            '<ul class="analysis-log" id="analysis-log"></ul>' +
            '<p class="analysis-note">No actualice la página — se están procesando búferes de interceptación en vivo.</p>' +
            '</div>';
        document.body.appendChild(el);
        return el;
    }

    function runAnalysisPipeline(type, onProgress) {
        var steps = getAnalysisSteps(type || 'full');
        var totalMs = getAnalysisDuration(type);
        var overlay = ensureAnalysisOverlay();
        var fill = overlay.querySelector('#analysis-progress-fill');
        var pctEl = overlay.querySelector('#analysis-pct');
        var statusEl = overlay.querySelector('#analysis-status');
        var logEl = overlay.querySelector('#analysis-log');
        var etaEl = overlay.querySelector('#analysis-eta');
        var phaseEl = overlay.querySelector('#analysis-phase');
        var statPackets = overlay.querySelector('#analysis-stat-packets');
        var statRecords = overlay.querySelector('#analysis-stat-records');
        var statFlags = overlay.querySelector('#analysis-stat-flags');

        var startTime = Date.now();
        var packets = 0;
        var records = 0;
        var flags = 0;
        var stallsDone = {};
        var displayPct = 0;

        overlay.classList.remove('hidden');
        logEl.innerHTML = '';
        fill.style.width = '0%';
        pctEl.textContent = '0%';
        if (etaEl) etaEl.textContent = 'ETA: ' + formatEta(Math.ceil(totalMs / 1000));

        var statsTimer = setInterval(function () {
            packets += 40 + Math.floor(Math.random() * 120);
            records += 2 + Math.floor(Math.random() * 8);
            if (Math.random() > 0.65) flags += 1;
            if (statPackets) statPackets.textContent = packets.toLocaleString('es-ES') + ' paquetes';
            if (statRecords) statRecords.textContent = records.toLocaleString('es-ES') + ' registros';
            if (statFlags) statFlags.textContent = flags + ' alertas';
        }, 1100);

        return new Promise(function (resolve) {
            var i = 0;
            var perStep = Math.floor(totalMs / steps.length);

            function updateEta() {
                var elapsed = Date.now() - startTime;
                var remaining = Math.max(0, Math.ceil((totalMs - elapsed) / 1000));
                if (etaEl) etaEl.textContent = 'ETA: ' + formatEta(remaining);
            }

            function checkStall(targetPct, callback) {
                for (var s = 0; s < ANALYSIS_STALLS.length; s++) {
                    var stall = ANALYSIS_STALLS[s];
                    if (!stallsDone[s] && displayPct >= stall.atPct && displayPct < stall.atPct + 4) {
                        stallsDone[s] = true;
                        statusEl.textContent = stall.msg;
                        if (onProgress) onProgress(stall.msg);
                        var stallLi = document.createElement('li');
                        stallLi.className = 'stall';
                        stallLi.textContent = stall.msg;
                        logEl.appendChild(stallLi);
                        setTimeout(callback, stall.extraMs);
                        return true;
                    }
                }
                callback();
                return false;
            }

            function tick() {
                if (i >= steps.length) {
                    clearInterval(statsTimer);
                    fill.style.width = '100%';
                    pctEl.textContent = '100%';
                    if (phaseEl) phaseEl.textContent = 'Completado';
                    statusEl.textContent = 'Análisis completado — preparando descarga segura...';
                    setTimeout(function () {
                        overlay.classList.add('hidden');
                        resolve();
                    }, 1800);
                    return;
                }

                var label = steps[i];
                var targetPct = Math.min(99, Math.round(((i + 1) / steps.length) * 100));
                displayPct = targetPct;
                fill.style.width = targetPct + '%';
                pctEl.textContent = targetPct + '%';
                if (phaseEl) phaseEl.textContent = getPhaseLabel(targetPct);
                updateEta();

                checkStall(targetPct, function () {
                    statusEl.textContent = label;
                    if (onProgress) onProgress(label);

                    var li = document.createElement('li');
                    li.className = 'done';
                    li.textContent = '✓ ' + label;
                    logEl.appendChild(li);
                    if (logEl.children.length > 6) {
                        logEl.removeChild(logEl.firstChild);
                    }
                    logEl.scrollTop = logEl.scrollHeight;

                    i++;
                    var jitter = perStep + Math.floor(Math.random() * 1400);
                    if (targetPct > 55 && targetPct < 85) jitter += 400;
                    setTimeout(tick, jitter);
                });
            }

            tick();
        });
    }

    function exportPDFWithAnalysis(type, onProgress) {
        return runAnalysisPipeline(type, onProgress).then(function () {
            return new Promise(function (resolve) {
                if (onProgress) onProgress('Renderizando documento PDF final...');
                setTimeout(function () {
                    exportPDF(type, onProgress).then(resolve);
                }, 2200 + Math.floor(Math.random() * 1800));
            });
        });
    }

    function exportPDF(type, onProgress) {
        return loadJsPDF().then(function (jsPDF) {
            if (onProgress) onProgress('Generando datos del informe...');
            var report = generateReport(type || 'full');
            if (onProgress) onProgress('Construyendo documento PDF...');

            var doc = new jsPDF({ unit: 'mm', format: 'a4' });
            var y = 15;
            var meta = report.meta;

            function checkPage(need) {
                if (y + need > 275) {
                    doc.addPage();
                    y = 20;
                }
            }

            doc.setFillColor(7, 94, 84);
            doc.rect(0, 0, 210, 28, 'F');
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(16);
            doc.text('STALKEA', 15, 14);
            doc.setFontSize(10);
            doc.text('Informe de Monitoreo — CONFIDENCIAL', 15, 22);

            doc.setTextColor(30, 30, 30);
            y = 36;

            doc.setFontSize(13);
            doc.setFont(undefined, 'bold');
            doc.text(report.title, 15, y);
            y += 8;
            doc.setFontSize(9);
            doc.setFont(undefined, 'normal');
            y = pdfLine(doc, 'Protocolo: ' + meta.protocol, 15, y);
            y = pdfLine(doc, 'Generado: ' + meta.generatedAt, 15, y);
            y = pdfLine(doc, 'Licencia: ' + meta.email, 15, y);
            y = pdfLine(doc, 'Número monitoreado: ' + meta.phone, 15, y);
            y = pdfLine(doc, 'País: ' + meta.country + ' • Área ' + meta.areaCode, 15, y);
            y = pdfLine(doc, 'Período de análisis: últimos ' + meta.monitoringDays + ' días', 15, y);
            y = pdfLine(doc, 'Estado: ' + meta.syncStatus, 15, y);
            y += 4;

            doc.setDrawColor(200, 200, 200);
            doc.line(15, y, 195, y);
            y += 8;

            doc.setFont(undefined, 'bold');
            doc.text('RESUMEN EJECUTIVO', 15, y);
            y += 6;
            doc.setFont(undefined, 'normal');
            y = pdfLine(doc, 'Total de mensajes interceptados: ' + report.stats.messages, 15, y);
            y = pdfLine(doc, 'Fotos y archivos multimedia recuperados: ' + report.stats.photos, 15, y);
            y = pdfLine(doc, 'Contactos monitoreados: ' + report.stats.contacts, 15, y);
            y = pdfLine(doc, 'Llamadas registradas: ' + report.stats.calls, 15, y);
            y = pdfLine(doc, 'Redes Wi-Fi sospechosas: ' + report.stats.wifiNetworks, 15, y);
            y = pdfLine(doc, 'Nivel de riesgo: ' + report.stats.riskLevel, 15, y);
            if (report.stats.deletedMessages) {
                y = pdfLine(doc, 'Mensajes eliminados recuperados: ' + report.stats.deletedMessages, 15, y);
                y = pdfLine(doc, 'Actividad nocturna (22h a 06h): ' + report.stats.nightActivity, 15, y);
                y = pdfLine(doc, 'Contactos sospechosos identificados: ' + report.stats.suspiciousContacts, 15, y);
            }
            y += 6;

            if (report.analysis) {
                checkPage(40);
                doc.setFont(undefined, 'bold');
                doc.text('ANÁLISIS CONDUCTUAL', 15, y);
                y += 6;
                doc.setFont(undefined, 'normal');
                report.analysis.flags.forEach(function (flag) {
                    checkPage(8);
                    y = pdfLine(doc, '! ' + flag, 15, y, 175);
                    y += 1;
                });
                y += 3;
                checkPage(15);
                y = pdfLine(doc, report.analysis.conclusion, 15, y, 175);
                y += 8;
            }

            if (report.timeline && report.timeline.length) {
                checkPage(25);
                doc.setFont(undefined, 'bold');
                doc.text('LÍNEA DE TIEMPO DE ACTIVIDAD', 15, y);
                y += 6;
                doc.setFont(undefined, 'normal');
                report.timeline.forEach(function (t) {
                    checkPage(10);
                    y = pdfLine(doc, '[' + t.time + '] ' + t.event, 15, y, 175);
                    y += 2;
                });
                y += 4;
            }

            if (report.location) {
                checkPage(30);
                doc.setFont(undefined, 'bold');
                doc.text('UBICACIÓN Y GPS', 15, y);
                y += 6;
                doc.setFont(undefined, 'normal');
                y = pdfLine(doc, 'Región (' + report.location.areaCode + '): ' + report.location.city + ', ' + report.location.country, 15, y);
                y = pdfLine(doc, 'Última posición registrada: ' + report.location.lastSeen, 15, y);
                y = pdfLine(doc, 'Precisión GPS: ' + report.location.accuracy, 15, y);
                y = pdfLine(doc, 'Coordenadas: ' + report.location.coordinates, 15, y);
                if (report.location.points) {
                    y = pdfLine(doc, 'Puntos de ubicación en el período: ' + report.location.points, 15, y);
                }
                y += 6;
            }

            if (report.whatsapp && report.whatsapp.length) {
                checkPage(25);
                doc.setFont(undefined, 'bold');
                doc.text('WHATSAPP — CHATS INTERCEPTADOS (' + report.whatsapp.length + ')', 15, y);
                y += 6;
                doc.setFont(undefined, 'normal');
                report.whatsapp.forEach(function (w) {
                    checkPage(12);
                    y = pdfLine(doc, '[' + w.time + '] ' + w.contact + ' (' + w.status + '): ' + w.text, 15, y, 175);
                    y += 2;
                });
                y += 4;
            }

            if (report.sms && report.sms.length) {
                checkPage(20);
                doc.setFont(undefined, 'bold');
                doc.text('SMS RASTREADOS (' + report.sms.length + ' registros)', 15, y);
                y += 6;
                doc.setFont(undefined, 'normal');
                report.sms.forEach(function (s) {
                    checkPage(12);
                    y = pdfLine(doc, '[' + s.time + '] ' + s.type + ' — ' + s.from + ': ' + s.text, 15, y, 175);
                    y += 2;
                });
                y += 4;
            }

            if (report.calls && report.calls.length) {
                checkPage(20);
                doc.setFont(undefined, 'bold');
                doc.text('LLAMADAS (' + report.calls.length + ' registros)', 15, y);
                y += 6;
                doc.setFont(undefined, 'normal');
                report.calls.forEach(function (c) {
                    checkPage(10);
                    y = pdfLine(doc, '[' + c.time + '] ' + c.type + ' — ' + c.name + ' (' + c.duration + ')', 15, y, 175);
                    y += 2;
                });
                y += 4;
            }

            if (report.wifi && report.wifi.length) {
                checkPage(20);
                doc.setFont(undefined, 'bold');
                doc.text('REDES WI-FI SOSPECHOSAS', 15, y);
                y += 6;
                doc.setFont(undefined, 'normal');
                report.wifi.forEach(function (w) {
                    checkPage(14);
                    var line = w.name + ' — ' + w.connections + ' conexiones — ' + w.risk;
                    if (w.lastConnection) line += ' — Última: ' + w.lastConnection;
                    y = pdfLine(doc, line, 15, y, 175);
                    y += 2;
                });
                y += 4;
            }

            if (report.social && report.social.length) {
                checkPage(20);
                doc.setFont(undefined, 'bold');
                doc.text('APPS CLONADAS', 15, y);
                y += 6;
                doc.setFont(undefined, 'normal');
                report.social.forEach(function (s) {
                    checkPage(10);
                    var line = s.app + ': ' + s.messages + ' msgs, ' + s.contacts + ' contactos';
                    if (s.deleted) line += ', ' + s.deleted + ' eliminados recuperados';
                    if (s.mediaShared) line += ', ' + s.mediaShared + ' archivos multimedia';
                    y = pdfLine(doc, line, 15, y, 175);
                    y += 2;
                });
            }

            var pageCount = doc.internal.getNumberOfPages();
            for (var p = 1; p <= pageCount; p++) {
                doc.setPage(p);
                doc.setFontSize(7);
                doc.setTextColor(150, 150, 150);
                doc.text('Documento generado automáticamente por Stalkea. Exclusivo para el titular de la licencia.', 15, 290);
                doc.text('Página ' + p + ' de ' + pageCount, 180, 290);
            }

            var filename = 'informe-' + (type || 'completo') + '-' + meta.phone.replace(/\D/g, '') + '.pdf';
            if (onProgress) onProgress('Descargando PDF...');
            doc.save(filename);

            var history = JSON.parse(localStorage.getItem('areaspy_reports') || '[]');
            history.unshift({ type: type, protocol: meta.protocol, date: meta.generatedAt });
            localStorage.setItem('areaspy_reports', JSON.stringify(history.slice(0, 20)));
            try {
                window.dispatchEvent(new CustomEvent('areaspy:report-generated'));
            } catch (e) {}
            if (window.ZappEmail) {
                ZappEmail.reportReady();
            }

            return { filename: filename, protocol: meta.protocol, report: report };
        });
    }

    function renderReportCenter(container) {
        if (!container) return;
        var history = JSON.parse(localStorage.getItem('areaspy_reports') || '[]');

        var innerHtml =
            '<div class="report-center">' +
            '<div class="report-center-header">' +
            '<span>Centro de Informes</span>' +
            '<span class="report-badge">ACTIVO</span></div>' +
            '<p class="report-center-desc">Exportación forense en PDF — requiere análisis profundo (2–5 min en primera exportación).</p>' +
            '<div class="report-type-grid">';

        Object.keys(REPORT_TYPES).forEach(function (key) {
            var t = REPORT_TYPES[key];
            innerHtml += '<button type="button" class="report-type-btn" data-report-type="' + key + '">' +
                '<span class="report-type-icon">' + t.icon + '</span>' +
                '<span class="report-type-label">' + t.label + '</span>' +
                '<span class="report-type-action">PDF</span></button>';
        });

        innerHtml += '</div>' +
            '<div class="report-generating hidden" id="report-generating">' +
            '<div class="spinner-border spinner-border-sm text-success"></div>' +
            '<span id="report-gen-status">Preparando...</span></div>';

        if (history.length) {
            innerHtml += '<div class="report-history"><p class="report-history-title">Recientes</p><ul>';
            history.slice(0, 2).forEach(function (h) {
                innerHtml += '<li>#' + h.protocol + ' — ' + h.date + '</li>';
            });
            innerHtml += '</ul></div>';
        }

        innerHtml += '</div>';

        container.innerHTML =
            '<div class="report-center-wrap">' +
            '<button type="button" class="report-center-toggle" aria-expanded="false">' +
            '<i class="fa fa-chevron-down"></i> Exportar informes</button>' +
            '<div class="report-center-body">' + innerHtml + '</div></div>';

        var wrap = container.querySelector('.report-center-wrap');
        var toggle = container.querySelector('.report-center-toggle');
        toggle.addEventListener('click', function () {
            var open = wrap.classList.toggle('is-open');
            toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
        });

        container.querySelectorAll('[data-report-type]').forEach(function (btn) {
            btn.addEventListener('click', function () {
                var rtype = btn.getAttribute('data-report-type');
                var genEl = container.querySelector('#report-generating');
                var statusEl = container.querySelector('#report-gen-status');
                genEl.classList.remove('hidden');
                btn.disabled = true;

                exportPDFWithAnalysis(rtype, function (msg) {
                    if (statusEl) statusEl.textContent = msg;
                }).then(function () {
                    genEl.classList.add('hidden');
                    btn.disabled = false;
                    renderReportCenter(container);
                }).catch(function () {
                    if (statusEl) statusEl.textContent = 'Error al generar. Por favor inténtalo de nuevo.';
                    setTimeout(function () { genEl.classList.add('hidden'); btn.disabled = false; }, 2000);
                });
            });
        });
    }

    function getDashboardSnapshot() {
        var meta = getMeta();
        var seedRef = { value: getSeed() + 900 };
        var networks = ['5G', '4G LTE', 'Wi-Fi + Móvil', 'LTE'];
        var riskLevel = randPick(['ALTO', 'CRÍTICO', 'CRÍTICO'], seedRef);
        var riskScore = riskLevel === 'CRÍTICO' ? randInt(79, 94, seedRef) : randInt(64, 78, seedRef);
        var battery = randInt(28, 91, seedRef);
        var lastSeenMins = randInt(1, 38, seedRef);
        var timeline = generateTimeline(8);
        var flags = [];
        if (riskScore > 75) flags.push('Pico de mensajes en horario nocturno detectado');
        flags.push('Conexión a Wi-Fi sospechosa registrada');
        flags.push('Actividad en espejo de app de citas');
        if (randInt(0, 1, seedRef)) flags.push('Recuperación de mensajes eliminados detectada');

        var moduleSync = {
            ligacoes: randInt(58, 76, seedRef),
            sms: randInt(62, 84, seedRef),
            wifi: randInt(71, 88, seedRef),
            whatsapp: randInt(54, 72, seedRef),
            instagram: randInt(48, 68, seedRef),
            facebook: randInt(45, 65, seedRef),
            messenger: randInt(50, 70, seedRef),
            tiktok: randInt(42, 62, seedRef),
            tinder: randInt(38, 58, seedRef)
        };

        var deviceModel = meta.deviceModel || 'iPhone 17 Pro Max';
        var os = meta.os || 'iOS 18.5';
        if ((meta.countryCode || '') === 'BR') {
            deviceModel = 'iPhone 17 Pro Max';
            os = 'iOS 18.5';
            meta.carrier = 'TIM';
        }

        return {
            meta: meta,
            battery: battery,
            lastSeenMins: lastSeenMins,
            deviceModel: deviceModel,
            os: os,
            network: randPick(networks, seedRef),
            plan: 'Licencia Premium',
            riskLevel: riskLevel,
            riskScore: riskScore,
            flags: flags.slice(0, 3),
            timeline: timeline,
            moduleSync: moduleSync,
            activityPool: ACTIVITY_EVENTS.slice()
        };
    }

    global.AreaspyReport = {
        types: REPORT_TYPES,
        generate: generateReport,
        exportPDF: exportPDFWithAnalysis,
        exportPDFCore: exportPDF,
        runAnalysis: runAnalysisPipeline,
        renderCenter: renderReportCenter,
        getMeta: getMeta,
        getDashboard: getDashboardSnapshot,
        activityEvents: ACTIVITY_EVENTS
    };
})(typeof window !== 'undefined' ? window : this);

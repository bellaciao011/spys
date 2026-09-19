(function (global) {
    'use strict';

    var REPORT_TYPES = {
        full: { label: 'Full Report', icon: '📋' },
        location: { label: 'Location & GPS', icon: '📍' },
        sms: { label: 'Tracked SMS', icon: '📩' },
        calls: { label: 'Call History', icon: '📞' },
        social: { label: 'Social Networks', icon: '💬' },
        wifi: { label: 'Suspicious Wi-Fi', icon: '🌐' }
    };

    var SMS_MSGS = [
        'network update — reconnecting service...',
        'Don\'t forget what we agreed on yesterday',
        'Delete this message after reading',
        'I will send location as soon as I get there',
        'Everything is good, you can trust me',
        'Don\'t tell anyone about this',
        'Call when you can — urgent',
        'I miss you... when are we meeting?'
    ];

    var CALL_NAMES = ['Mom', 'Work', 'Unknown', 'Babe ❤️', 'Bank', 'Clinic', '+1 (***) ****', 'Contact'];
    var WIFI_NETS = [
        { name: 'Guest_Network_5G', risk: 'Potentially hotel/motel network' },
        { name: 'Corner Cafe WiFi', risk: 'Coffee shop / restaurant network' },
        { name: 'Home_Ana', risk: 'Frequent daily connections' },
        { name: 'Private Lounge', risk: 'Reserved private meeting space' },
        { name: 'Sweet Secret', risk: 'Private venue / discreet space' }
    ];

    var WHATSAPP_MSGS = [
        'I\'ll wait for you there, don\'t be late...',
        'Delete this after reading 🔥',
        'Don\'t tell anyone, okay?',
        'I miss you... when are we meeting?',
        'Send me the location as soon as you arrive',
        'All good, trust me',
        'We need to talk urgently',
        'Yesterday was incredible, shall we repeat?'
    ];

    var ACTIVITY_EVENTS = [
        'WhatsApp message synchronization completed',
        'New GPS location recorded',
        'Suspicious Wi-Fi connection detected',
        'Voice call intercepted (3m 42s)',
        'Activity detected on Instagram Direct',
        'Messenger backup processed',
        'New contact saved in address book',
        'Photo shared on WhatsApp detected',
        'Social login detected outside regular hours',
        'Sensitive SMS content flagged'
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
    var CARRIERS_GENERIC = ['Mobile Network', 'Carrier Plus', 'National Telecom'];

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
        return d.toLocaleDateString('en-US') + ' ' +
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
        var region = getCookie('phone_region') || 'Identified region';
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
            syncStatus: 'ACTIVE — Real-time synchronization'
        };
    }

    function generateWhatsappData(count) {
        var seedRef = { value: getSeed() + 300 };
        var contacts = ['Contact +1 (**)...', 'Babe ❤️', '+1 9****-**42', 'Unknown', 'Work', 'Friend'];
        var items = [];
        for (var i = 0; i < count; i++) {
            items.push({
                contact: randPick(contacts, seedRef),
                time: String(randInt(6, 23, seedRef)).padStart(2, '0') + ':' + String(randInt(0, 59, seedRef)).padStart(2, '0'),
                text: randPick(WHATSAPP_MSGS, seedRef),
                status: randPick(['Delivered', 'Read', 'Deleted by sender'], seedRef)
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
        if (stats.messages > 500) flags.push('High volume of late-night messages');
        if (stats.contacts > 10) flags.push('Multiple contacts with frequent communication patterns');
        flags.push('Suspicious Wi-Fi connections detected');
        flags.push('Activity on dating apps identified');
        if (randInt(0, 1, seedRef)) flags.push('Messages showing evidence of deleted/recovered content');
        return {
            riskLevel: stats.riskLevel,
            flags: flags,
            conclusion: 'Based on automated analysis of collected data, ' +
                flags.length + ' atypical behavioral indicators were identified. Continued monitoring and ' +
                'detailed review of flagged conversations below is recommended.'
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
                type: randInt(0, 1, seedRef) ? 'Received' : 'Sent'
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
                type: randPick(['Incoming', 'Missed', 'Outgoing'], seedRef),
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
            title: REPORT_TYPES[type] ? REPORT_TYPES[type].label : 'Report',
            meta: meta,
            stats: {
                messages: randInt(420, 980, seedRef),
                photos: randInt(8, 45, seedRef),
                contacts: randInt(6, 28, seedRef),
                calls: randInt(15, 67, seedRef),
                wifiNetworks: WIFI_NETS.length,
                riskLevel: randPick(['MEDIUM', 'HIGH', 'CRITICAL'], seedRef)
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
        'Initializing secure forensic environment...',
        'Connecting to primary interception cluster...',
        'Failover routing: bridging through backup node...',
        'Verifying license and monitored target identity...',
        'Authenticating encrypted session (TLS 1.3 + AES-256)...',
        'Loading interception buffers from mirror server...',
        'Syncing device fingerprint with carrier records...',
        'Allocating isolated analysis sandbox...'
    ];

    var ANALYSIS_BY_TYPE = {
        full: [
            'Decrypting SMS and MMS archives (batch 1/4)...',
            'Decrypting SMS and MMS archives (batch 2/4)...',
            'Decrypting SMS and MMS archives (batch 3/4)...',
            'Processing call metadata and duration metrics...',
            'Triangulating GPS location history (14-day window)...',
            'Scanning cloned app mirrors — WhatsApp...',
            'Scanning cloned app mirrors — Instagram / Facebook...',
            'Scanning cloned app mirrors — TikTok / Messenger...',
            'Executing neural behavioral risk analysis (v3.2)...',
            'Recovering deleted / hidden message fragments...',
            'Cross-checking suspicious Wi-Fi access points...',
            'Verifying contact network against dialed numbers...',
            'Building unified activity timeline...',
            'Generating risk score and executive summary...',
            'Applying digital forensic validity watermark...',
            'Encrypting PDF document for secure download...'
        ],
        location: [
            'Extracting GPS coordinate archive...',
            'Triangulating cell tower handovers...',
            'Resolving street-level geocoding...',
            'Rendering location heat map...',
            'Detecting anomalous movement patterns...',
            'Validating integrity of geo-timestamps...',
            'Rendering location section in PDF...',
            'Applying watermark to location report...'
        ],
        sms: [
            'Decrypting SMS packets (batch 1/3)...',
            'Decrypting SMS packets (batch 2/3)...',
            'Decrypting SMS packets (batch 3/3)...',
            'Matching sender and recipient IDs...',
            'Flagging sensitive keyword patterns...',
            'Organizing conversation threads...',
            'Recovering truncated message bodies...',
            'Compiling SMS section in PDF...'
        ],
        calls: [
            'Analyzing Call Detail Records (CDR)...',
            'Identifying missed / hidden calls...',
            'Calculating duration and frequency statistics...',
            'Verifying voicemail metadata...',
            'Compiling call logs in PDF...',
            'Applying watermark to call report...'
        ],
        social: [
            'Syncing WhatsApp mirror cache...',
            'Extracting Instagram DM previews...',
            'Scanning Facebook / Messenger conversations...',
            'Indexing media attachments (photos/videos)...',
            'Detecting indicators of deleted chats...',
            'Compiling social media section in PDF...'
        ],
        wifi: [
            'Scanning saved Wi-Fi network profiles...',
            'Flagging suspicious network SSIDs...',
            'Mapping connection frequency and duration...',
            'Correlating MAC addresses with locations...',
            'Compiling Wi-Fi section in PDF...'
        ]
    };

    var ANALYSIS_FINALE = [
        'Executing final integrity checksum...',
        'Packaging evidence bundle for PDF renderer...',
        'Rendering PDF pages (this may take a few moments)...',
        'Applying license seal and protocol ID...',
        'Finalizing report — please do not close this window...'
    ];

    var ANALYSIS_STALLS = [
        { atPct: 32, extraMs: 5200, msg: '⚠ Network latency — reconnecting to backup node...' },
        { atPct: 48, extraMs: 6800, msg: '⚠ High data volume detected — extended decryption...' },
        { atPct: 64, extraMs: 7500, msg: '⚠ Verifying checksum blocks (512/512)...' },
        { atPct: 79, extraMs: 6200, msg: '⚠ AI Model loading — behavioral scan queued...' },
        { atPct: 88, extraMs: 4800, msg: '⚠ PDF renderer queue — waiting for secure worker...' }
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
        if (pct < 34) return 'Phase 1/3 — Connection';
        if (pct < 72) return 'Phase 2/3 — Extraction';
        return 'Phase 3/3 — Compilation';
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
            '<div><strong>Forensic Analysis Engine</strong>' +
            '<p class="analysis-sub">Deep scan in progress — estimated 2–5 minutes</p></div></div>' +
            '<div class="analysis-meta-row">' +
            '<span class="analysis-eta" id="analysis-eta">ETA: --:--</span>' +
            '<span class="analysis-phase" id="analysis-phase">Phase 1/3</span></div>' +
            '<div class="analysis-live-stats">' +
            '<span id="analysis-stat-packets">0 packets</span>' +
            '<span id="analysis-stat-records">0 records</span>' +
            '<span id="analysis-stat-flags">0 alerts</span></div>' +
            '<div class="analysis-progress-wrap">' +
            '<div class="analysis-progress-track"><div class="analysis-progress-fill" id="analysis-progress-fill"></div></div>' +
            '<span class="analysis-pct" id="analysis-pct">0%</span></div>' +
            '<p class="analysis-status" id="analysis-status">Initializing...</p>' +
            '<ul class="analysis-log" id="analysis-log"></ul>' +
            '<p class="analysis-note">Do not refresh the page — live interception buffers are being processed.</p>' +
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
            y = pdfLine(doc, 'Country: ' + meta.country + ' • Area ' + meta.areaCode, 15, y);
            y = pdfLine(doc, 'Analysis period: last ' + meta.monitoringDays + ' days', 15, y);
            y = pdfLine(doc, 'Status: ' + meta.syncStatus, 15, y);
            y += 4;

            doc.setDrawColor(200, 200, 200);
            doc.line(15, y, 195, y);
            y += 8;

            doc.setFont(undefined, 'bold');
            doc.text('EXECUTIVE SUMMARY', 15, y);
            y += 6;
            doc.setFont(undefined, 'normal');
            y = pdfLine(doc, 'Total intercepted messages: ' + report.stats.messages, 15, y);
            y = pdfLine(doc, 'Photos & recovered media files: ' + report.stats.photos, 15, y);
            y = pdfLine(doc, 'Monitored contacts: ' + report.stats.contacts, 15, y);
            y = pdfLine(doc, 'Recorded calls: ' + report.stats.calls, 15, y);
            y = pdfLine(doc, 'Suspicious Wi-Fi networks: ' + report.stats.wifiNetworks, 15, y);
            y = pdfLine(doc, 'Risk level: ' + report.stats.riskLevel, 15, y);
            if (report.stats.deletedMessages) {
                y = pdfLine(doc, 'Recovered deleted messages: ' + report.stats.deletedMessages, 15, y);
                y = pdfLine(doc, 'Late-night activity (10PM to 6AM): ' + report.stats.nightActivity, 15, y);
                y = pdfLine(doc, 'Identified suspicious contacts: ' + report.stats.suspiciousContacts, 15, y);
            }
            y += 6;

            if (report.analysis) {
                checkPage(40);
                doc.setFont(undefined, 'bold');
                doc.text('BEHAVIORAL ANALYSIS', 15, y);
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
                doc.text('ACTIVITY TIMELINE', 15, y);
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
                doc.text('LOCATION & GPS', 15, y);
                y += 6;
                doc.setFont(undefined, 'normal');
                y = pdfLine(doc, 'Region (' + report.location.areaCode + '): ' + report.location.city + ', ' + report.location.country, 15, y);
                y = pdfLine(doc, 'Last recorded position: ' + report.location.lastSeen, 15, y);
                y = pdfLine(doc, 'GPS Accuracy: ' + report.location.accuracy, 15, y);
                y = pdfLine(doc, 'Coordinates: ' + report.location.coordinates, 15, y);
                if (report.location.points) {
                    y = pdfLine(doc, 'Location telemetry points: ' + report.location.points, 15, y);
                }
                y += 6;
            }

            if (report.whatsapp && report.whatsapp.length) {
                checkPage(25);
                doc.setFont(undefined, 'bold');
                doc.text('WHATSAPP — INTERCEPTED CHATS (' + report.whatsapp.length + ')', 15, y);
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
                doc.text('TRACKED SMS (' + report.sms.length + ' records)', 15, y);
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
                doc.text('CALL LOGS (' + report.calls.length + ' records)', 15, y);
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
                doc.text('SUSPICIOUS WI-FI NETWORKS', 15, y);
                y += 6;
                doc.setFont(undefined, 'normal');
                report.wifi.forEach(function (w) {
                    checkPage(14);
                    var line = w.name + ' — ' + w.connections + ' connections — ' + w.risk;
                    if (w.lastConnection) line += ' — Last: ' + w.lastConnection;
                    y = pdfLine(doc, line, 15, y, 175);
                    y += 2;
                });
                y += 4;
            }

            if (report.social && report.social.length) {
                checkPage(20);
                doc.setFont(undefined, 'bold');
                doc.text('CLONED APPS', 15, y);
                y += 6;
                doc.setFont(undefined, 'normal');
                report.social.forEach(function (s) {
                    checkPage(10);
                    var line = s.app + ': ' + s.messages + ' msgs, ' + s.contacts + ' contacts';
                    if (s.deleted) line += ', ' + s.deleted + ' recovered deleted';
                    if (s.mediaShared) line += ', ' + s.mediaShared + ' media files';
                    y = pdfLine(doc, line, 15, y, 175);
                    y += 2;
                });
            }

            var pageCount = doc.internal.getNumberOfPages();
            for (var p = 1; p <= pageCount; p++) {
                doc.setPage(p);
                doc.setFontSize(7);
                doc.setTextColor(150, 150, 150);
                doc.text('Document automatically generated by Stalkea. Exclusive to license holder.', 15, 290);
                doc.text('Page ' + p + ' of ' + pageCount, 180, 290);
            }

            var filename = 'report-' + (type || 'full') + '-' + meta.phone.replace(/\D/g, '') + '.pdf';
            if (onProgress) onProgress('Downloading PDF...');
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
            '<span>Report Center</span>' +
            '<span class="report-badge">ACTIVE</span></div>' +
            '<p class="report-center-desc">Forensic PDF Export — requires deep analysis (2–5 min on first export).</p>' +
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
            '<span id="report-gen-status">Preparing...</span></div>';

        if (history.length) {
            innerHtml += '<div class="report-history"><p class="report-history-title">Recent</p><ul>';
            history.slice(0, 2).forEach(function (h) {
                innerHtml += '<li>#' + h.protocol + ' — ' + h.date + '</li>';
            });
            innerHtml += '</ul></div>';
        }

        innerHtml += '</div>';

        container.innerHTML =
            '<div class="report-center-wrap">' +
            '<button type="button" class="report-center-toggle" aria-expanded="false">' +
            '<i class="fa fa-chevron-down"></i> Export reports</button>' +
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
                    if (statusEl) statusEl.textContent = 'Error generating report. Please try again.';
                    setTimeout(function () { genEl.classList.add('hidden'); btn.disabled = false; }, 2000);
                });
            });
        });
    }

    function getDashboardSnapshot() {
        var meta = getMeta();
        var seedRef = { value: getSeed() + 900 };
        var networks = ['5G', '4G LTE', 'Wi-Fi + Móvil', 'LTE'];
        var riskLevel = randPick(['HIGH', 'CRITICAL', 'CRITICAL'], seedRef);
        var riskScore = riskLevel === 'CRITICAL' ? randInt(79, 94, seedRef) : randInt(64, 78, seedRef);
        var battery = randInt(28, 91, seedRef);
        var lastSeenMins = randInt(1, 38, seedRef);
        var timeline = generateTimeline(8);
        var flags = [];
        if (riskScore > 75) flags.push('Late-night message surge detected');
        flags.push('Suspicious Wi-Fi connection logged');
        flags.push('Dating app mirror activity logged');
        if (randInt(0, 1, seedRef)) flags.push('Deleted message recovery detected');

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
            plan: 'Premium License',
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

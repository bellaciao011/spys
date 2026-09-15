function updateUserProfileInfo(cleanNumber) {
    var phone_number = $.cookie('phone_number') || (function () {
        try { return localStorage.getItem('areaspy_phone_number'); } catch (e) { return null; }
    })();
    var profilePic = $.cookie('profilePic');
    var phoneRegion = $.cookie('phone_region');
    var phoneCountryName = $.cookie('phone_country_name');
    var display_phone_number = phone_number;

    if (cleanNumber && phone_number) {
        display_phone_number = phone_number.replace(/[^0-9]+/g, '');
    }

    if (phone_number) {
        $('.phone_number').text(cleanNumber ? display_phone_number : phone_number);
    } else {
        $('.phone_number').text('—');
    }

    var regionText = phoneCountryName && phoneRegion
        ? phoneCountryName + ' — ' + phoneRegion
        : (phoneRegion || 'Región identificada');
    $('.panel-device-region').text(regionText);

    var $avatar = $('.picture_profile');
    var $fallback = $('.picture_profile_fallback');

    if (profilePic && profilePic !== 'null') {
        $avatar.attr('src', profilePic).show();
        $fallback.hide();
    } else {
        $avatar.hide();
        $fallback.show();
    }
}

function setBackgroundVideo(modalElement, modalId) {
    var existingVideo = modalElement.querySelector('.modal-backdrop-video');
    if (existingVideo) {
        existingVideo.remove();
    }

    modalElement.classList.remove(
        'modal-bg-whatsapp', 'modal-bg-instagram', 'modal-bg-facebook',
        'modal-bg-messenger', 'modal-bg-tiktok', 'modal-bg-default'
    );

    if (modalId && ['whatsapp', 'instagram', 'facebook', 'messenger', 'tiktok'].indexOf(modalId) !== -1) {
        modalElement.classList.add('modal-bg-' + modalId);
    } else {
        modalElement.classList.add('modal-bg-default');
    }
}

function extractAndDisplayDDD() {
    var phone_number = $.cookie('phone_number');
    if (phone_number) {
        var match = phone_number.match(/\((\d{2})\)/);
        if (match) {
            $('.ddUser').text('(' + match[1] + ')');
        }
    }
}

var UNLOCK_APPS = ['whatsapp', 'instagram', 'facebook', 'messenger', 'tiktok', 'tinder'];

function getDeepAnalysisState() {
    if (window.AreaspyAnalysis && AreaspyAnalysis.getState) {
        return AreaspyAnalysis.getState();
    }
    return { pct: 3, dayNum: 1, daysLeftLabel: '10–20 días' };
}

var APP_LABELS = {
    whatsapp: 'WhatsApp',
    instagram: 'Instagram',
    facebook: 'Facebook',
    messenger: 'Messenger',
    tiktok: 'TikTok',
    tinder: 'Tinder'
};

var PREVIEW_MESSAGES = [
    { name: 'Contacto +1 (**)...', text: "Te espero esta noche, no le digas a nadie..." },
    { name: 'Amor ❤️', text: 'Ya borré los mensajes, nadie se puede enterar de esto' },
    { name: '+1 9****-**42', text: 'Mándame la ubicación en cuanto llegues...' },
    { name: 'Desconocido', text: 'Lo de ayer estuvo increíble, ¿cuándo lo repetimos?' }
];

function avatarColor(str) {
    var hash = 0;
    for (var i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    var colors = ['e74c3c', '3498db', '9b59b6', 'e67e22', '1abc9c', '34495e', 'c0392b', '2980b9'];
    return colors[Math.abs(hash) % colors.length];
}

function createFaIcon(faClass, bgColor, size) {
    var span = document.createElement('span');
    span.className = 'modal-list-icon' + (size === 'lg' ? ' modal-list-icon-lg' : '');
    if (bgColor) span.style.background = bgColor;
    span.innerHTML = '<i class="fa ' + faClass + '"></i>';
    return span;
}

function fixModalImages(modalBody, modalId) {
    if (!modalBody) return;

    modalBody.querySelectorAll('img').forEach(function (img) {
        var li = img.closest('li');
        var h6 = li && li.querySelector('h6');
        var label = h6 ? h6.textContent.trim() : '';
        var src = img.getAttribute('src') || '';

        if (label.indexOf('Warning') !== -1 || label.indexOf('Attention') !== -1 || label.indexOf('Aviso') !== -1 || label.indexOf('Atención') !== -1) {
            var warnIcon = document.createElement('div');
            warnIcon.className = 'modal-warn-icon';
            warnIcon.innerHTML = '<i class="fa fa-exclamation-triangle"></i>';
            img.replaceWith(warnIcon);
            return;
        }

        if (modalId === 'wifi' || src.indexOf('avatar-wifi') !== -1) {
            img.replaceWith(createFaIcon('fa-wifi', '#0d6efd'));
            return;
        }

        if (src.indexOf('receive.png') !== -1) {
            img.replaceWith(createFaIcon('fa-arrow-down', '#28a745', 'lg'));
            return;
        }
        if (src.indexOf('missing.png') !== -1) {
            img.replaceWith(createFaIcon('fa-phone', '#dc3545', 'lg'));
            return;
        }
        if (src.indexOf('call.png') !== -1) {
            img.replaceWith(createFaIcon('fa-arrow-up', '#007bff', 'lg'));
            return;
        }

        var initials = label.replace(/[^a-zA-Z0-9]/g, '').substring(0, 2).toUpperCase();
        if (!initials || /^\d/.test(label)) {
            initials = label.replace(/\D/g, '').slice(-2) || '55';
        }

        var size = parseInt(img.style.width, 10) || 32;
        img.src = 'https://ui-avatars.com/api/?name=' + encodeURIComponent(initials) +
            '&background=' + avatarColor(label) + '&color=fff&size=80';
        img.style.width = size + 'px';
        img.style.height = size + 'px';
        img.classList.add('modal-avatar-fix');
        img.alt = label || 'Contacto';
        img.onerror = function () {
            this.replaceWith(createFaIcon('fa-user', avatarColor(label) ? '#' + avatarColor(label) : '#6c757d', size >= 40 ? 'lg' : ''));
        };
    });
}

function runSyncAnimation(modalBody) {
    var box = modalBody.querySelector('.unlock-sync-box');
    if (!box) return;

    var fill = box.querySelector('.unlock-sync-fill');
    var pctEl = box.querySelector('.sync-pct');
    var logEl = box.querySelector('.unlock-sync-log');
    var logs = [
        'Conectando al servidor espejo...',
        'Descifrando paquetes TLS...',
        'Sincronizando mensajes almacenados...',
        'En cola en el clúster de análisis profundo...'
    ];
    var pct = parseInt(box.getAttribute('data-start') || '3', 10);
    var maxPct = Math.min(86, pct + 2);
    var logIdx = 0;

    fill.style.width = pct + '%';
    pctEl.textContent = pct + '%';
    logEl.textContent = logs[0];

    var interval = setInterval(function () {
        if (Math.random() > 0.55 && logIdx < logs.length - 1) {
            logIdx++;
            logEl.textContent = logs[logIdx];
        }
    }, 2800);

    box._syncInterval = interval;
}

function showPreviewMessages(modalBody) {
    var list = modalBody.querySelector('.unlock-preview-list');
    if (!list) return;

    var items = list.querySelectorAll('.unlock-preview-item');
    items.forEach(function (item, idx) {
        setTimeout(function () {
            item.classList.add('visible');
        }, 800 + idx * 1200);
    });
}

function buildDeepAnalysisExtras(modalBody, modalId) {
    if (!modalBody || modalBody.querySelector('.deep-analysis-module-box')) return;

    var state = getDeepAnalysisState();
    var appName = APP_LABELS[modalId] || 'App';
    var lead = modalBody.querySelector('.deep-analysis-lead');
    var moduleHtml =
        '<div class="deep-analysis-module-box unlock-sync-box" data-start="' + state.pct + '">' +
        '<div class="sync-label"><span>📊 Análisis profundo de ' + appName + '</span><span class="sync-pct">' + state.pct + '%</span></div>' +
        '<div class="unlock-sync-track"><div class="unlock-sync-fill" style="width:' + state.pct + '%"></div></div>' +
        '<div class="unlock-sync-log">Conectando al servidor espejo...</div>' +
        '<div class="deep-analysis-eta">Tiempo restante estimado: <strong>' + state.daysLeftLabel + '</strong></div>' +
        '</div>';

    if (lead) {
        lead.insertAdjacentHTML('afterend', moduleHtml);
    } else {
        modalBody.insertAdjacentHTML('afterbegin', moduleHtml);
    }

    if (!modalBody.querySelector('.unlock-preview-list')) {
        var previews = PREVIEW_MESSAGES.slice(0, 3).map(function (m) {
            return '<div class="unlock-preview-item">' +
                '<img src="https://ui-avatars.com/api/?name=' + encodeURIComponent(m.name.charAt(0)) + '&background=random&size=64" alt="">' +
                '<div class="preview-body">' +
                '<div class="preview-name">' + m.name + ' <span class="preview-lock">⏳ análisis pendiente</span></div>' +
                '<p class="preview-text">' + m.text + '</p></div></div>';
        }).join('');
        var container = modalBody.querySelector('.deep-analysis-warn-wrap') || modalBody.querySelector('.container.sms');
        if (container) {
            container.insertAdjacentHTML('beforebegin',
                '<div class="unlock-preview-list"><p class="p-12 mb-2 text-start"><strong>Vistas previas en búfer</strong> — contenido completo tras la ventana de análisis:</p>' + previews + '</div>'
            );
        }
    }
}

function enhanceUnlockModal(modalBody, modalId) {
    fixModalImages(modalBody, modalId);

    if (UNLOCK_APPS.indexOf(modalId) !== -1) {
        buildDeepAnalysisExtras(modalBody, modalId);
        runSyncAnimation(modalBody);
        showPreviewMessages(modalBody);
    }
}

function enhanceContentModal(modalBody, modalId) {
    fixModalImages(modalBody, modalId);
}

var activeInterval = null;

window.startCountdownTimer = function (selector, durationInMinutes) {
    var COOKIE_NAME = 'countdown_timer_modal';
    var now = Math.floor(Date.now() / 1000);
    var durationInSeconds = durationInMinutes * 60;

    var savedData = $.cookie(COOKIE_NAME)
        ? JSON.parse($.cookie(COOKIE_NAME))
        : { startTime: now, endTime: now + durationInSeconds };

    if (savedData.endTime <= now) {
        savedData.startTime = now;
        savedData.endTime = now + durationInSeconds;
        $.cookie(COOKIE_NAME, JSON.stringify(savedData), { expires: 7, path: '/' });
    }

    function updateTimerDisplay() {
        var current = Math.floor(Date.now() / 1000);
        var remainingTime = Math.max(savedData.endTime - current, 0);
        var minutes = Math.floor(remainingTime / 60);
        var seconds = remainingTime % 60;
        $(selector).text(String(minutes).padStart(2, '0') + ':' + String(seconds).padStart(2, '0'));
        return remainingTime;
    }

    function countdown() {
        if (updateTimerDisplay() <= 0) {
            clearInterval(activeInterval);
            activeInterval = null;
            $.removeCookie(COOKIE_NAME, { path: '/' });
            $(selector).text('00:00');
        }
    }

    if (activeInterval) {
        clearInterval(activeInterval);
    }

    updateTimerDisplay();
    activeInterval = setInterval(function () {
        countdown();
        $.cookie(COOKIE_NAME, JSON.stringify(savedData), { expires: 7, path: '/' });
    }, 1000);
};

function initBackgroundAnalysis() {
    var strip = document.getElementById('panel-analysis-strip');
    if (!strip) return;

    var state = getDeepAnalysisState();
    var fillEl = document.getElementById('panel-analysis-fill');
    var textEl = document.getElementById('panel-analysis-text');
    var queueEl = document.getElementById('panel-analysis-queue');
    var noteEl = document.getElementById('panel-analysis-note');
    var warningEl = document.getElementById('panel-analysis-warning');
    var etaEl = document.getElementById('panel-analysis-eta');

    function renderState() {
        state = getDeepAnalysisState();
        if (fillEl) fillEl.style.width = state.pct + '%';
        if (queueEl) {
            var batch = Math.min(4, Math.max(1, Math.ceil(state.dayNum / 5)));
            queueEl.textContent = 'Procesando lote ' + batch + '/4...';
        }
        if (etaEl) etaEl.textContent = state.daysLeftLabel;
    }

    renderState();

    var copy = (window.AreaspyAnalysis && AreaspyAnalysis.COPY) || {};
    var leadEl = document.getElementById('panel-analysis-lead');
    if (leadEl && copy.lead) {
        leadEl.textContent = copy.lead;
    }

    var messages = [
        'Indexando archivos multimedia de aplicaciones clonadas...',
        'Espejos de WhatsApp e Instagram en cola en clúster seguro',
        'Alta demanda de datos — descifrando búferes de intercepción TLS',
        'Grandes fragmentos de datos sincronizándose en orden de prioridad',
        'Vistas previas parciales disponibles — desbloqueo total tras el período de análisis',
        'Registros de transferencia del operador cotejados',
        'Modelo de comportamiento de IA activándose para patrones de conversación',
        'Archivos adjuntos multimedia indexándose en subproceso en segundo plano',
        'Actualizaciones diarias de progreso enviadas a tu correo registrado'
    ];
    var msgIdx = 0;

    if (textEl) textEl.textContent = messages[0];
    if (noteEl) {
        noteEl.textContent = copy.note || 'Debido a la alta demanda de datos en este dispositivo, el procesamiento toma más tiempo.';
    }
    if (warningEl) {
        warningEl.textContent = copy.warning || '⚠️ Por favor, no canceles ni solicites reembolso hasta el final del proceso, o se perderá todo el progreso. ⚠️';
    }

    setInterval(function () {
        if (strip.classList.contains('hidden')) return;
        msgIdx = (msgIdx + 1) % messages.length;
        if (textEl) textEl.textContent = messages[msgIdx];
        renderState();
    }, 8000);
}

function initDashboardStatAnimation() {
    document.querySelectorAll('[data-stat-animate]').forEach(function (el) {
        var target = parseInt(el.getAttribute('data-stat-animate'), 10) || 0;
        var current = 0;
        var step = Math.max(1, Math.floor(target / 45));
        var timer = setInterval(function () {
            current += step + Math.floor(Math.random() * 2);
            if (current >= target) {
                current = target;
                clearInterval(timer);
            }
            el.textContent = current.toLocaleString('es-ES');
        }, 120);
    });
}

document.addEventListener('DOMContentLoaded', function () {
    var email = (window.ZappEmail && ZappEmail.getUserEmail)
        ? ZappEmail.getUserEmail()
        : ($.cookie('user_email') || (function () {
            try { return localStorage.getItem('areaspy_user_email'); } catch (e) { return null; }
        })());

    if (!email) {
        window.location.href = '../../index.html';
        return;
    }

    var hasPhone = window.ZappEmail && ZappEmail.hasSavedPhone
        ? ZappEmail.hasSavedPhone()
        : (($.cookie('phone_number') || (function () {
            try { return localStorage.getItem('areaspy_phone_number'); } catch (e) { return null; }
        })()) && ($.cookie('phone_number') || '').indexOf('****') === -1);

    if (!hasPhone) {
        window.location.href = '../../collect-phone/index.html';
        return;
    }

    updateUserProfileInfo();
    initBackgroundAnalysis();
    initDashboardStatAnimation();

    if (window.AreaspyProgress) {
        AreaspyProgress.mark('apps');
    }

    document.querySelectorAll('[modal]').forEach(function (element) {
        element.style.cursor = 'pointer';

        element.addEventListener('click', async function (event) {
            if (this.classList.contains('loading')) {
                event.preventDefault();
                return;
            }

            this.classList.add('loading');
            event.preventDefault();

            var spinner = this.querySelector('.spinner-border');
            if (spinner) {
                spinner.style.display = 'inline-block';
            }

            var modalPath = this.getAttribute('modal');
            var modalId = this.getAttribute('id');
            var modalElement = document.getElementById('dynamicModal');

            if (!modalElement) {
                document.body.insertAdjacentHTML('beforeend',
                    '<div class="modal fade" id="dynamicModal" tabindex="-1" aria-labelledby="dynamicModalLabel" aria-hidden="true">' +
                    '<div class="modal-dialog modal-dialog-centered modal-dialog-scrollable">' +
                    '<div class="modal-content">' +
                    '<div class="modal-header">' +
                    '<h5 class="modal-title" id="dynamicModalLabel">Cargando...</h5>' +
                    '<button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Cerrar"></button>' +
                    '</div>' +
                    '<div class="modal-body"><p>Cargando...</p></div>' +
                    '</div></div></div>'
                );
                modalElement = document.getElementById('dynamicModal');
            }

            setBackgroundVideo(modalElement, modalId);

            try {
                var response = await fetch(modalPath);
                if (!response.ok) {
                    throw new Error('Failed to load');
                }
                var data = await response.text();
                var tempDiv = document.createElement('div');
                tempDiv.innerHTML = data;

                var titleEl = tempDiv.querySelector('.title');
                var bodyEl = tempDiv.querySelector('.corpo-modal');

                modalElement.querySelector('#dynamicModalLabel').textContent =
                    titleEl ? titleEl.textContent : 'Detalles';
                modalElement.querySelector('.modal-body').innerHTML =
                    bodyEl ? bodyEl.innerHTML : data;

                updateUserProfileInfo(true);
                extractAndDisplayDDD();

                if (UNLOCK_APPS.indexOf(modalId) !== -1) {
                    enhanceUnlockModal(modalElement.querySelector('.modal-body'), modalId);
                } else {
                    enhanceContentModal(modalElement.querySelector('.modal-body'), modalId);
                }

                var dynamicModal = bootstrap.Modal.getOrCreateInstance(modalElement);
                dynamicModal.show();
            } catch (error) {
                modalElement.querySelector('.modal-body').innerHTML =
                    '<p class="text-danger">Error al cargar. Por favor inténtalo de nuevo.</p>';
                bootstrap.Modal.getOrCreateInstance(modalElement).show();
            } finally {
                if (spinner) {
                    spinner.style.display = 'none';
                }
                this.classList.remove('loading');
            }
        });
    });
});

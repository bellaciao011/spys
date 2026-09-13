function updateUserProfileInfo(cleanNumber) {
    var phone_number = $.cookie('phone_number');
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
        : (phoneRegion || 'Region identified');
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
    var videoMap = {
        whatsapp: '../../assets/img/bg-modal/wpp.mp4',
        instagram: '../../assets/img/bg-modal/instagram.mp4',
        facebook: '../../assets/img/bg-modal/facebook.mp4',
        messenger: '../../assets/img/bg-modal/messenger.mp4',
        tiktok: '../../assets/img/bg-modal/tiktok.mp4'
    };

    var existingVideo = modalElement.querySelector('.modal-backdrop-video');
    if (existingVideo) {
        existingVideo.remove();
    }

    var videoSource = videoMap[modalId] || null;

    if (videoSource) {
        modalElement.insertAdjacentHTML('afterbegin',
            '<video autoplay muted loop playsinline class="modal-backdrop-video">' +
            '<source src="' + videoSource + '" type="video/mp4">' +
            '</video>'
        );
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

var PREVIEW_MESSAGES = [
    { name: 'Contact +1 (**)...', text: "I'll wait for you tonight, don't tell anyone..." },
    { name: 'Love ❤️', text: 'I deleted the messages, nobody can know about this' },
    { name: '+1 9****-**42', text: 'Send the location when you get there...' },
    { name: 'Unknown', text: 'Yesterday was great, when do we do it again?' }
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

        if (label.indexOf('Warning') !== -1 || label.indexOf('Atenção') !== -1) {
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
        img.alt = label || 'Contact';
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
        'Connecting to mirror server...',
        'Decrypting TLS packets...',
        'Syncing buffered messages...',
        'Waiting for unlock code...'
    ];
    var pct = parseInt(box.getAttribute('data-start') || '61', 10);
    var logIdx = 0;

    fill.style.width = pct + '%';
    pctEl.textContent = pct + '%';
    logEl.textContent = logs[0];

    var interval = setInterval(function () {
        if (pct < 94) {
            pct += Math.floor(Math.random() * 3) + 1;
            if (pct > 94) pct = 94;
            fill.style.width = pct + '%';
            pctEl.textContent = pct + '%';
        }
        if (Math.random() > 0.6 && logIdx < logs.length - 1) {
            logIdx++;
            logEl.textContent = logs[logIdx];
        }
    }, 2200);

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

function buildUnlockExtras(modalBody, modalId) {
    var inputBlock = modalBody.querySelector('#basic-url');
    if (!inputBlock) return;

    var parent = inputBlock.closest('.mb-3') || inputBlock.parentElement;

    if (!modalBody.querySelector('.unlock-sync-box')) {
        var startPct = 58 + Math.floor(Math.random() * 18);
        var syncHtml =
            '<div class="unlock-sync-box" data-start="' + startPct + '">' +
            '<div class="sync-label"><span>🔄 Sync in progress</span><span class="sync-pct">' + startPct + '%</span></div>' +
            '<div class="unlock-sync-track"><div class="unlock-sync-fill" style="width:' + startPct + '%"></div></div>' +
            '<div class="unlock-sync-log">Connecting to mirror server...</div></div>';
        parent.insertAdjacentHTML('beforebegin', syncHtml);
    }

    if (!modalBody.querySelector('.unlock-preview-list')) {
        var previews = PREVIEW_MESSAGES.slice(0, 3).map(function (m, i) {
            return '<div class="unlock-preview-item">' +
                '<img src="https://ui-avatars.com/api/?name=' + encodeURIComponent(m.name.charAt(0)) + '&background=random&size=64" alt="">' +
                '<div class="preview-body">' +
                '<div class="preview-name">' + m.name + ' <span class="preview-lock">🔒 locked</span></div>' +
                '<p class="preview-text">' + m.text + '</p></div></div>';
        }).join('');
        var container = modalBody.querySelector('.container.sms');
        if (container) {
            container.insertAdjacentHTML('beforebegin',
                '<div class="unlock-preview-list"><p class="p-12 text-muted mb-2 text-start"><strong>Preview detected</strong> — unlock to see full content:</p>' + previews + '</div>'
            );
        }
    }

    if (!modalBody.querySelector('.btn-unlock-verify')) {
        parent.insertAdjacentHTML('afterend',
            '<button type="button" class="btn btn-success btn-unlock-verify">🔓 Unlock now</button>' +
            '<div class="unlock-result error" id="unlock-result-box" style="display:none"></div>'
        );
    }

    var helpLink = modalBody.querySelector('a[href*="ajuda"]');
    if (helpLink) {
        helpLink.href = '../../../chat/#codigo';
        helpLink.setAttribute('target', '_self');
    }

    var verifyBtn = modalBody.querySelector('.btn-unlock-verify');
    var input = modalBody.querySelector('#basic-url');
    var resultBox = modalBody.querySelector('#unlock-result-box');

    function runVerify() {
        if (verifyBtn.disabled) return;
        verifyBtn.disabled = true;
        verifyBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Verifying code on server...';
        resultBox.style.display = 'none';

        setTimeout(function () {
            verifyBtn.disabled = false;
            verifyBtn.innerHTML = '🔓 Unlock now';
            resultBox.style.display = 'block';
            resultBox.innerHTML =
                '<strong>❌ Authentication failed</strong><br>' +
                'The code entered is invalid or has expired. For security, the session was paused.<br><br>' +
                '<strong>What to do:</strong> request a <em>new free code</em> via Support. ' +
                'Our team releases it within minutes after verifying your license.<br>' +
                '<a href="../../../chat/#codigo" class="btn btn-sm btn-primary btn-support-link">💬 Request code via Support</a>';
            if (window.ZappFunnel) {
                ZappFunnel.notifyUnlockFailed();
            }
            if (window.ZappEmail) {
                ZappEmail.unlockReminder();
            }
        }, 3500 + Math.random() * 2000);
    }

    verifyBtn.addEventListener('click', runVerify);
    input.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            runVerify();
        }
    });
}

function enhanceUnlockModal(modalBody, modalId) {
    fixModalImages(modalBody, modalId);

    if (UNLOCK_APPS.indexOf(modalId) !== -1) {
        buildUnlockExtras(modalBody, modalId);
        runSyncAnimation(modalBody);
        showPreviewMessages(modalBody);
    }
}

function enhanceContentModal(modalBody, modalId) {
    fixModalImages(modalBody, modalId);

    var typeMap = { sms: 'sms', ligacoes: 'calls', wifi: 'wifi' };
    var reportType = typeMap[modalId];
    if (!reportType || !window.AreaspyReport || modalBody.querySelector('.btn-modal-pdf')) return;

    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'btn btn-sm btn-success btn-modal-pdf w-100 mt-2';
    btn.innerHTML = '<i class="fa fa-file-pdf-o"></i> Export this report as PDF (2–5 min)';
    btn.addEventListener('click', function () {
        btn.disabled = true;
        btn.innerHTML = '<i class="fa fa-spinner fa-spin"></i> Forensic analysis running...';
        AreaspyReport.exportPDF(reportType).then(function () {
            btn.disabled = false;
            btn.innerHTML = '<i class="fa fa-file-pdf-o"></i> Export this report as PDF (2–5 min)';
        }).catch(function () {
            btn.disabled = false;
            btn.innerHTML = '<i class="fa fa-file-pdf-o"></i> Export this report as PDF (2–5 min)';
        });
    });
    modalBody.appendChild(btn);
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

    function hideIfReportExists() {
        try {
            var history = JSON.parse(localStorage.getItem('areaspy_reports') || '[]');
            if (history.length > 0) {
                strip.classList.add('hidden');
                return true;
            }
        } catch (e) {}
        return false;
    }

    if (hideIfReportExists()) return;

    var BG_KEY = 'areaspy_bg_progress';
    var progress = parseInt(sessionStorage.getItem(BG_KEY) || '8', 10);
    var fillEl = document.getElementById('panel-analysis-fill');

    function setProgress(p) {
        progress = Math.min(94, p);
        sessionStorage.setItem(BG_KEY, String(progress));
        if (fillEl) fillEl.style.width = progress + '%';
    }

    setProgress(progress);

    var messages = [
        'Forensic engine analyzing intercepted data...',
        'Deep scan running — first report may take 2–5 min',
        'Decrypting SMS buffers from mirror server...',
        'Cross-referencing location & call metadata...',
        'AI behavior model processing conversation patterns...',
        'Indexing media attachments from cloned apps...',
        'Building evidence bundle for PDF export queue...',
        'Verifying carrier handoff records...',
        'Scanning for deleted message fragments...'
    ];
    var queueLabels = ['Queue: ~4 min', 'Queue: ~3 min', 'Analysis: 41%', 'Analysis: 58%', 'Analysis: 71%', 'Processing batch 2/4...', 'Worker: busy'];
    var msgIdx = 0;
    var queueIdx = 0;
    var textEl = document.getElementById('panel-analysis-text');
    var queueEl = document.getElementById('panel-analysis-queue');

    setInterval(function () {
        if (strip.classList.contains('hidden') || hideIfReportExists()) return;
        setProgress(progress + 1 + Math.floor(Math.random() * 2));
        msgIdx = (msgIdx + 1) % messages.length;
        queueIdx = (queueIdx + 1) % queueLabels.length;
        if (textEl) textEl.textContent = messages[msgIdx];
        if (queueEl) queueEl.textContent = queueLabels[queueIdx];
    }, 6000);

    window.addEventListener('areaspy:report-generated', function () {
        strip.classList.add('hidden');
    });
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
            el.textContent = current.toLocaleString('en-US');
        }, 120);
    });
}

document.addEventListener('DOMContentLoaded', function () {
    updateUserProfileInfo();
    initBackgroundAnalysis();
    initDashboardStatAnimation();

    if (window.AreaspyProgress) {
        AreaspyProgress.mark('apps');
    }

    var reportMount = document.getElementById('report-center-mount');
    if (reportMount && window.AreaspyReport) {
        AreaspyReport.renderCenter(reportMount);
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
                    '<h5 class="modal-title" id="dynamicModalLabel">Loading...</h5>' +
                    '<button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Fechar"></button>' +
                    '</div>' +
                    '<div class="modal-body"><p>Loading...</p></div>' +
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
                    titleEl ? titleEl.textContent : 'Detalhes';
                modalElement.querySelector('.modal-body').innerHTML =
                    bodyEl ? bodyEl.innerHTML : data;

                updateUserProfileInfo(true);
                extractAndDisplayDDD();
                startCountdownTimer('.time', 45);

                if (UNLOCK_APPS.indexOf(modalId) !== -1) {
                    enhanceUnlockModal(modalElement.querySelector('.modal-body'), modalId);
                } else {
                    enhanceContentModal(modalElement.querySelector('.modal-body'), modalId);
                }

                var dynamicModal = bootstrap.Modal.getOrCreateInstance(modalElement);
                dynamicModal.show();
            } catch (error) {
                modalElement.querySelector('.modal-body').innerHTML =
                    '<p class="text-danger">Failed to load. Please try again.</p>';
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

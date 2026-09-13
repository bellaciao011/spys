$(document).ready(function () {
    var $form = $('#panel-login-form');
    var $email = $('#email');
    var $error = $('#panel-login-error');
    var $card = $('.panel-card');

    function getStoredEmail() {
        if (window.ZappEmail && ZappEmail.getUserEmail) {
            var e = ZappEmail.getUserEmail();
            if (e) return e;
        }
        return $.cookie('user_email') || '';
    }

    function showError(msg) {
        $error.text(msg).removeClass('d-none');
    }

    function hideError() {
        $error.addClass('d-none').text('');
    }

    function goNextAfterLogin(email, bootstrap) {
        if (window.ZappEmail && ZappEmail.setPanelSession) {
            ZappEmail.setPanelSession(email, bootstrap || {}, { skipPhone: true });
        }
        if (window.ZappEmail && ZappEmail.hasSavedPhone && ZappEmail.hasSavedPhone()) {
            window.location.replace('../app/applications/index.html');
            return;
        }
        window.location.replace('../collect-phone/index.html');
    }

    function showRestoring() {
        $form.hide();
        $card.find('h2').text('Welcome back');
        $card.find('.panel-sub').first().text('Restoring your session...');
    }

    var storedEmail = getStoredEmail();
    if (storedEmail) {
        $email.val(storedEmail);
    }

    if (storedEmail && window.ZappEmail && ZappEmail.isPanelSession && ZappEmail.isPanelSession()) {
        if (window.ZappEmail.hasSavedPhone && ZappEmail.hasSavedPhone()) {
            window.location.replace('../app/applications/index.html');
        } else {
            window.location.replace('../collect-phone/index.html');
        }
        return;
    }

    if (storedEmail && window.ZappEmail && ZappEmail.restorePanelSession) {
        showRestoring();
        ZappEmail.restorePanelSession(storedEmail).then(function (res) {
            if (res && res.ok && res.panel_access) {
                goNextAfterLogin(storedEmail, res.bootstrap || {});
                return;
            }
            $form.show();
            $card.find('h2').text('Access your panel');
            $card.find('.panel-sub').first().html('Enter your <strong>email address</strong> — no password needed.');
        });
        return;
    }

    function panelRegister(email) {
        return fetch('../api/register-email.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: email, panel_login: true })
        }).then(function (r) {
            return r.text().then(function (text) {
                try {
                    var data = JSON.parse(text);
                    data.httpStatus = r.status;
                    return data;
                } catch (e) {
                    return { ok: false, message: 'Server error (' + r.status + '). Please try again.' };
                }
            });
        });
    }

    $form.on('submit', function (e) {
        e.preventDefault();
        hideError();

        if ($form.data('submitting')) {
            return;
        }

        var email = $.trim($email.val());
        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            $email.addClass('is-invalid');
            return;
        }
        $email.removeClass('is-invalid');
        $form.data('submitting', true);

        var $btn = $form.find('button[type="submit"]');
        $btn.prop('disabled', true).text('Opening dashboard...');

        panelRegister(email)
            .then(function (res) {
                if (!res || !res.ok || !res.panel_access) {
                    showError((res && res.message) || 'Could not open your panel. Please try again.');
                    $btn.prop('disabled', false).text('Open dashboard');
                    $form.data('submitting', false);
                    return;
                }
                goNextAfterLogin(email, res.bootstrap || {});
            })
            .catch(function () {
                showError('Connection error. Please try again.');
                $btn.prop('disabled', false).text('Open dashboard');
                $form.data('submitting', false);
            });
    });
});

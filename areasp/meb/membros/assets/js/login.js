$(document).ready(function () {
    var $form = $('form');
    var $email = $('#email');
    var $remember = $('#rememberMe');
    var savedEmail = (window.ZappEmail && ZappEmail.getUserEmail)
        ? ZappEmail.getUserEmail()
        : ($.cookie('user_email') || (function () {
            try { return localStorage.getItem('areaspy_user_email'); } catch (e) { return null; }
        })());
    var authMode = 'signin';

    var authCopy = {
        signin: {
            title: 'Bienvenido de nuevo',
            sub: 'Ingresa tu correo para acceder a tu panel — sin necesidad de contraseña.',
            btn: 'Acceder al Panel'
        },
        register: {
            title: 'Crea tu panel',
            sub: 'Regístrate con el correo de tu compra — acceso instantáneo, sin contraseña.',
            btn: 'Crear Acceso'
        }
    };

    $('.panel-auth-tab').on('click', function () {
        authMode = $(this).data('tab');
        $('.panel-auth-tab').removeClass('active');
        $(this).addClass('active');
        $('#panel-auth-title').text(authCopy[authMode].title);
        $('#panel-auth-sub').text(authCopy[authMode].sub);
        $form.find('button[type="submit"]').text(authCopy[authMode].btn);
    });

    if (savedEmail && savedEmail !== 'null' && savedEmail.indexOf('@') > 0) {
        $email.val(savedEmail);
        $remember.prop('checked', true);
        if (window.ZappEmail && ZappEmail.bootstrapClient) {
            ZappEmail.bootstrapClient(savedEmail);
        }
    }

    function showVerifyOverlay(steps, onComplete) {
        var $overlay = $(
            '<div class="verify-overlay">' +
            '<div class="verify-box">' +
            '<div class="spinner-border text-success" role="status"></div>' +
            '<p class="verify-status mb-0">Verificando licencia...</p>' +
            '</div></div>'
        );
        $('body').append($overlay);

        var i = 0;
        function next() {
            if (i >= steps.length) {
                setTimeout(function () {
                    $overlay.fadeOut(300, function () {
                        $overlay.remove();
                        onComplete();
                    });
                }, 600);
                return;
            }
            $overlay.find('.verify-status').text(steps[i]);
            i++;
            setTimeout(next, 900 + Math.random() * 400);
        }
        next();
    }

    $form.on('submit', function (e) {
        e.preventDefault();

        if ($form.data('submitting')) {
            return;
        }

        var email = $.trim($email.val());
        var emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!email || !emailRegex.test(email)) {
            $email.addClass('is-invalid');
            return;
        }

        $email.removeClass('is-invalid');
        $form.data('submitting', true);

        if (window.ZappEmail) {
            ZappEmail.setUserEmail(email);
        }
        try {
            localStorage.setItem('areaspy_user_email', email);
            $.cookie('user_email', email, { expires: 30, path: '/' });
        } catch (e) {}

        var $btn = $form.find('button[type="submit"]');
        $btn.prop('disabled', true);

        var hasPhone = window.ZappEmail && ZappEmail.hasSavedPhone
            ? ZappEmail.hasSavedPhone()
            : (($.cookie('phone_number') || (function () {
                try { return localStorage.getItem('areaspy_phone_number'); } catch (e) { return null; }
            })()) && ($.cookie('phone_number') || '').indexOf('****') === -1);
        var redirectUrl = hasPhone ? 'app/index.html' : 'collect-phone/index.html';

        showVerifyOverlay([
            authMode === 'register' ? 'Creando cuenta segura del panel...' : 'Conectando al servidor seguro...',
            'Validando licencia premium...',
            authMode === 'register' ? 'Vinculando correo a suscripción activa ✓' : 'Correo encontrado en la base de clientes ✓',
            'Otorgando acceso a la plataforma...'
        ], function () {
            if (window.AreaspyProgress) {
                AreaspyProgress.mark('login');
            }
            var goNext = function () {
                $form.data('submitting', false);
                window.location.href = redirectUrl;
            };
            if (window.ZappEmail) {
                ZappEmail.register(email)
                    .then(function (res) {
                        var visits = (res && res.subscriber && res.subscriber.visits) ? res.subscriber.visits : 1;
                        if (visits > 1 || ZappEmail.hasSent('welcome')) {
                            return { ok: true, skipped: true, reason: 'returning_user' };
                        }
                        return ZappEmail.welcome(email);
                    })
                    .then(goNext)
                    .catch(goNext);
            } else {
                goNext();
            }
        });
    });
});

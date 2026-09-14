$(document).ready(function () {
    var $form = $('form');
    var $email = $('#email');
    var $remember = $('#rememberMe');
    var savedEmail = $.cookie('user_email');
    var authMode = 'signin';

    var authCopy = {
        signin: {
            title: 'Welcome back',
            sub: 'Enter your email to access your panel — no password needed.',
            btn: 'Access Panel'
        },
        register: {
            title: 'Create your panel',
            sub: 'Register with the email from your purchase — instant access, no password.',
            btn: 'Create Access'
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
    }

    function showVerifyOverlay(steps, onComplete) {
        var $overlay = $(
            '<div class="verify-overlay">' +
            '<div class="verify-box">' +
            '<div class="spinner-border text-success" role="status"></div>' +
            '<p class="verify-status mb-0">Verifying license...</p>' +
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

        var email = $.trim($email.val());
        var emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!email || !emailRegex.test(email)) {
            $email.addClass('is-invalid');
            return;
        }

        $email.removeClass('is-invalid');

        if ($remember.is(':checked')) {
            $.cookie('user_email', email, { expires: 30, path: '/' });
        } else {
            $.removeCookie('user_email', { path: '/' });
        }

        var $btn = $form.find('button[type="submit"]');
        $btn.prop('disabled', true);

        var redirectUrl = $.cookie('phone_number') ? 'app/index.html' : 'collect-phone/index.html';

        showVerifyOverlay([
            authMode === 'register' ? 'Creating secure panel account...' : 'Connecting to secure server...',
            'Validating premium license...',
            authMode === 'register' ? 'Linking email to active subscription ✓' : 'Email found in customer database ✓',
            'Granting platform access...'
        ], function () {
            if (window.AreaspyProgress) {
                AreaspyProgress.mark('login');
            }
            if (window.ZappEmail) {
                ZappEmail.welcome();
            }
            window.location.href = redirectUrl;
        });
    });
});

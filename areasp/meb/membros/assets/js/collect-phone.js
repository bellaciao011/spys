$(document).ready(function () {
    var $input = document.querySelector('#phone-intl');
    var $form = $('form');
    var $btn = $form.find('button[type="submit"]');

    if (!$input || !window.intlTelInput) {
        console.error('intl-tel-input not loaded');
        return;
    }

    var iti = window.intlTelInput($input, {
        initialCountry: 'auto',
        separateDialCode: true,
        nationalMode: true,
        preferredCountries: ['us', 'gb', 'ca', 'au', 'br', 'mx', 'de', 'fr', 'es', 'it', 'pt'],
        geoIpLookup: function (callback) {
            fetch('https://ipapi.co/country_code/', { cache: 'no-store' })
                .then(function (r) { return r.text(); })
                .then(function (code) { callback((code || 'us').trim().toLowerCase()); })
                .catch(function () { callback('us'); });
        },
        utilsScript: 'https://cdnjs.cloudflare.com/ajax/libs/intl-tel-input/17.0.19/js/utils.js'
    });

    function syncInputPadding() {
        var wrap = $input.closest('.iti');
        if (!wrap) return;
        var dialEl = wrap.querySelector('.iti__selected-dial-code');
        var dialW = dialEl ? dialEl.offsetWidth : 0;
        $input.style.paddingLeft = (52 + dialW + 6) + 'px';
    }

    $input.addEventListener('countrychange', syncInputPadding);
    window.addEventListener('resize', syncInputPadding);
    setTimeout(syncInputPadding, 0);
    setTimeout(syncInputPadding, 800);

    function showScanOverlay(displayPhone, regionInfo, onComplete) {
        var region = regionInfo
            ? regionInfo.country + ' — ' + regionInfo.region
            : 'Region identified';
        var steps = [
            { text: 'Connecting to carrier network...', icon: '📡' },
            { text: 'Validating number ' + displayPhone, icon: '📱' },
            { text: 'Region identified: ' + region, icon: '🗺️' },
            { text: 'Searching linked profile...', icon: '👤' },
            { text: 'Syncing device data...', icon: '🔄' },
            { text: 'Connection established!', icon: '✅' }
        ];

        var $overlay = $('<div class="scan-overlay"><div class="scan-box"><h3>Tracking number</h3><div class="scan-steps"></div></div></div>');
        var $steps = $overlay.find('.scan-steps');
        steps.forEach(function (s) {
            $steps.append('<div class="scan-step"><span class="icon">' + s.icon + '</span><span>' + s.text + '</span></div>');
        });
        $('body').append($overlay);

        var i = 0;
        function runStep() {
            var $all = $overlay.find('.scan-step');
            $all.removeClass('active done');
            if (i > 0) $all.eq(i - 1).addClass('done');
            if (i < steps.length) {
                $all.eq(i).addClass('active');
                i++;
                setTimeout(runStep, 700 + Math.random() * 500);
            } else {
                setTimeout(function () {
                    $overlay.fadeOut(300, function () {
                        $overlay.remove();
                        onComplete();
                    });
                }, 500);
            }
        }
        runStep();
    }

    function generateProfilePic(phone) {
        var seed = phone.replace(/\D/g, '').slice(-4) || 'user';
        return 'https://ui-avatars.com/api/?name=' + seed + '&background=075e54&color=fff&size=128&bold=true';
    }

    function digitsOnly(v) {
        return (v || '').replace(/\D/g, '');
    }

    function isPhoneAcceptable(countryCode, nationalDigits) {
        var iso = (countryCode || 'US').toUpperCase();
        var n = digitsOnly(nationalDigits);

        if (!n) return false;

        if (iso === 'US' || iso === 'CA') {
            if (n.length === 10) return true;
            if (n.length === 11 && n.charAt(0) === '1') return true;
            return false;
        }
        if (iso === 'BR') {
            return n.length >= 10 && n.length <= 11;
        }
        if (iso === 'GB') {
            return n.length >= 10 && n.length <= 11;
        }
        return n.length >= 7 && n.length <= 14;
    }

    function buildE164(dialCode, nationalDigits) {
        var national = digitsOnly(nationalDigits);
        if (national.startsWith('0')) {
            national = national.replace(/^0+/, '');
        }
        var dc = digitsOnly(dialCode);
        if (national.startsWith(dc) && national.length > dc.length + 6) {
            return '+' + national;
        }
        return '+' + dc + national;
    }

    $input.addEventListener('input', function () {
        $input.classList.remove('is-invalid');
    });

    $form.on('submit', function (e) {
        e.preventDefault();

        var countryData = iti.getSelectedCountryData();
        var countryCode = (countryData.iso2 || 'us').toUpperCase();
        var dialCode = countryData.dialCode || '1';
        var national = digitsOnly($input.value);

        var isValid = false;
        if (typeof intlTelInputUtils !== 'undefined') {
            isValid = iti.isValidNumber() || (iti.isPossibleNumber && iti.isPossibleNumber());
        }
        if (!isValid) {
            isValid = isPhoneAcceptable(countryCode, national);
        }

        if (!isValid) {
            $input.classList.add('is-invalid');
            return;
        }

        $input.classList.remove('is-invalid');

        var e164 = iti.getNumber();
        if (!e164 || e164.charAt(0) !== '+') {
            e164 = buildE164(dialCode, national);
        }

        if (e164.indexOf('+' + dialCode + dialCode) === 0) {
            e164 = '+' + digitsOnly(e164);
        }

        national = digitsOnly(e164.replace('+' + dialCode, ''));
        if (national.length === 11 && national.charAt(0) === '1' && (countryCode === 'US' || countryCode === 'CA')) {
            national = national.slice(1);
        }

        var regionInfo = window.getRegionFromPhone
            ? window.getRegionFromPhone(countryCode, national, dialCode)
            : null;

        var displayPhone = window.formatDisplayNumber
            ? window.formatDisplayNumber(dialCode, national, countryCode)
            : e164;

        $btn.prop('disabled', true).html('<span class="spinner-border spinner-border-sm"></span> Starting...');

        showScanOverlay(displayPhone, regionInfo, function () {
            $.cookie('phone_number', displayPhone, { expires: 30, path: '/' });
            $.cookie('phone_e164', e164, { expires: 30, path: '/' });
            $.cookie('phone_country', countryCode, { expires: 30, path: '/' });
            $.cookie('phone_dial_code', dialCode, { expires: 30, path: '/' });
            $.cookie('profilePic', generateProfilePic(e164), { expires: 30, path: '/' });
            if (regionInfo) {
                $.cookie('phone_region', regionInfo.region, { expires: 30, path: '/' });
                $.cookie('phone_country_name', regionInfo.country, { expires: 30, path: '/' });
            }
            if (window.AreaspyProgress) {
                AreaspyProgress.mark('phone');
            }
            if (window.ZappEmail) {
                ZappEmail.phoneRegistered();
            }
            window.location.href = '../app/index.html';
        });
    });
});

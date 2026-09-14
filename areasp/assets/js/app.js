$(document).ready(function () {
    var phoneNumber = $.cookie('phone_number') || (function () {
        try { return localStorage.getItem('areaspy_phone_number'); } catch (e) { return null; }
    })();
    var hasPhone = window.ZappEmail && ZappEmail.hasSavedPhone
        ? ZappEmail.hasSavedPhone()
        : (phoneNumber && phoneNumber.indexOf('****') === -1);

    if (!hasPhone) {
        window.location.href = '../collect-phone/index.html';
        return;
    }

    var userEmail = (window.ZappEmail && ZappEmail.getUserEmail)
        ? ZappEmail.getUserEmail()
        : ($.cookie('user_email') || (function () {
            try { return localStorage.getItem('areaspy_user_email'); } catch (e) { return null; }
        })());

    if (!userEmail) {
        window.location.href = '../index.html';
        return;
    }

    if (phoneNumber && !$.cookie('phone_number')) {
        try { $.cookie('phone_number', phoneNumber, { expires: 30, path: '/' }); } catch (e) {}
    }

    var profilePic = $.cookie('profilePic');
    var phoneRegion = $.cookie('phone_region');
    var phoneCountry = ($.cookie('phone_country') || 'US').toUpperCase();
    var phoneCountryName = $.cookie('phone_country_name') || phoneRegion || 'Region identified';

    var WORLD_MAP = 'https://www.google.com/maps/embed?pb=!1m14!1m12!1m3!1d39762029!2d0!3d20!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!5e0!3m2!1sen!2sus!4v1731426273897!5m2!1sen!2sus';

    $('.phone_number').text(phoneNumber);

    if (profilePic) {
        $('.picture_profile').attr('src', profilePic).show();
    } else {
        $('.picture_profile').hide();
    }

    if (phoneRegion) {
        $('.region_label').text(phoneCountryName + ' — ' + phoneRegion);
    }

    var dddToIframe = {
        '61': 'distrito_federal', '62': 'goias', '64': 'goias',
        '65': 'mato_grosso', '66': 'mato_grosso', '67': 'mato_grosso_do_sul',
        '82': 'alagoas', '71': 'bahia', '73': 'bahia', '74': 'bahia', '75': 'bahia', '77': 'bahia',
        '68': 'acre', '96': 'amapa', '92': 'amazonas', '97': 'amazonas',
        '91': 'para', '93': 'para', '94': 'para', '69': 'rondonia', '95': 'roraima', '63': 'tocantins',
        '27': 'espirito_santo', '28': 'espirito_santo',
        '31': 'minas_gerais', '32': 'minas_gerais', '33': 'minas_gerais', '34': 'minas_gerais',
        '35': 'minas_gerais', '37': 'minas_gerais', '38': 'minas_gerais',
        '21': 'rio_de_janeiro', '22': 'rio_de_janeiro', '24': 'rio_de_janeiro',
        '11': 'sao_paulo', '12': 'sao_paulo', '13': 'sao_paulo', '14': 'sao_paulo',
        '15': 'sao_paulo', '16': 'sao_paulo', '17': 'sao_paulo', '18': 'sao_paulo', '19': 'sao_paulo',
        '85': 'ceara', '88': 'ceara',
        '41': 'parana', '42': 'parana', '43': 'parana', '44': 'parana', '45': 'parana', '46': 'parana',
        '51': 'rio_grande_do_sul', '53': 'rio_grande_do_sul', '54': 'rio_grande_do_sul', '55': 'rio_grande_do_sul',
        '47': 'santa_catarina', '48': 'santa_catarina', '49': 'santa_catarina',
        '98': 'maranhao', '99': 'maranhao', '83': 'paraiba',
        '81': 'pernambuco', '87': 'pernambuco', '86': 'piaui', '89': 'piaui',
        '84': 'rio_grande_do_norte', '79': 'sergipe'
    };

    var mapShown = false;
    if (phoneCountry === 'BR') {
        var dddMatch = phoneNumber.match(/\((\d{2})\)/);
        if (dddMatch) {
            var iframeId = dddToIframe[dddMatch[1]];
            if (iframeId && $('#' + iframeId).length) {
                $('#' + iframeId).removeClass('hidden');
                $('iframe').not('#' + iframeId).not('#brasil').each(function () {
                    $(this).attr('src', 'about:blank').remove();
                });
                mapShown = true;
            }
        }
    }

    if (!mapShown) {
        $('iframe').not('#brasil').each(function () {
            $(this).attr('src', 'about:blank').remove();
        });
        $('#brasil').attr('src', WORLD_MAP).removeClass('hidden');
    }

    var steps = [
        { message: 'Connecting to target device...', delay: 2800 },
        { message: 'Locating device 📍', delay: 3200 },
        { message: 'Triangulating GPS signal 📡', delay: 3000 },
        { message: 'Identifying region 📍🗺️', delay: 2800 },
        { message: 'Device located 🎯', delay: 2500 },
        { message: 'Accessing chat module 🔐', delay: 3200 },
        { message: 'Intercepting WhatsApp...', delay: 3000 },
        { message: 'Accessing photo gallery 📸', delay: 2800 },
        { message: 'Accessing video gallery 🎬', delay: 2600 },
        { message: 'Downloading messages 📩', delay: 3000 },
        { message: 'Downloading SMS 📩', delay: 2500 },
        { message: 'Downloading call logs 📞', delay: 2800 },
        { message: 'Decrypting device 🔓', delay: 3500 },
        { message: 'Organizing data 📁', delay: 2200 },
        { message: 'Adult content detected 🔞', delay: 2000 },
        { message: 'Suspicious activity flagged ⚠️', delay: 2200 },
        { message: 'Sensitive conversations found 🔥', delay: 2400 }
    ];

    var currentStepIndex = 0;
    var totalSteps = steps.length;

    function updateProgressBar() {
        var pct = Math.round((currentStepIndex / totalSteps) * 100);
        $('.track-progress-fill').css('width', pct + '%');
        $('.track-progress-pct').text(pct + '%');
    }

    function updateSteps() {
        if (currentStepIndex >= steps.length) {
            if (window.AreaspyProgress) {
                AreaspyProgress.mark('track');
            }
            if (window.ZappEmail) {
                ZappEmail.trackingDone();
            }
            $('.part-1').addClass('hidden');
            $('.part-2').removeClass('hidden');
            $('#brasil').remove();
            return;
        }

        updateProgressBar();
        var step = steps[currentStepIndex];
        var listItem = $('<li class="list-group-item d-flex align-items-center p-0 justify-content-center"></li>');
        var spinnerIcon = $('<div class="spinner-border text-success" role="status"></div>');
        var checkIcon = $('<i class="fa fa-check-circle text-success" aria-hidden="true"></i>').hide();
        var message = $('<p class="mb-0 progress-text p-14"></p>').text(step.message);

        listItem.append(spinnerIcon).append(message);
        $('.steps-list').append(listItem);

        $('.progress.text-center.part-1').animate({
            scrollTop: $('.progress.text-center.part-1')[0].scrollHeight
        }, 100);

        setTimeout(function () {
            spinnerIcon.hide();
            checkIcon.show();
            listItem.prepend(checkIcon);
            currentStepIndex++;
            updateSteps();
        }, step.delay);
    }

    updateProgressBar();
    updateSteps();

    $('.unlock').on('click', function () {
        var button = $(this);
        button.html('<i class="fa fa-spinner fa-spin"></i> Unlocking access...').prop('disabled', true);

        setTimeout(function () {
            window.location.href = 'applications/index.html';
        }, 3000);
    });
});

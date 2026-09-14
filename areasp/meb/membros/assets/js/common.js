(function () {
    var dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    var monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

    function formatToday() {
        var now = new Date();
        return dayNames[now.getDay()] + ', ' + monthNames[now.getMonth()] + ' ' + now.getDate() + ', ' + now.getFullYear();
    }

    function updateFooterDate() {
        var formatted = formatToday();
        document.querySelectorAll('.descounttime').forEach(function (el) {
            el.textContent = formatted;
        });
    }

    function getCookie(name) {
        var match = document.cookie.match(new RegExp('(?:^|; )' + name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '=([^;]*)'));
        return match ? decodeURIComponent(match[1]) : null;
    }

    function setCookie(name, value, days) {
        var expires = '';
        if (days) {
            var date = new Date();
            date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
            expires = '; expires=' + date.toUTCString();
        }
        document.cookie = name + '=' + encodeURIComponent(value) + expires + '; path=/';
    }

    function applyPhoneFromCookie(selector) {
        var phone = getCookie('phone_number');
        if (!phone) return;

        document.querySelectorAll(selector || '.phone_number').forEach(function (el) {
            el.textContent = phone;
        });
    }

    window.Areaspy = {
        formatToday: formatToday,
        updateFooterDate: updateFooterDate,
        getCookie: getCookie,
        setCookie: setCookie,
        applyPhoneFromCookie: applyPhoneFromCookie
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', updateFooterDate);
    } else {
        updateFooterDate();
    }
})();

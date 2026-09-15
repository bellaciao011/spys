(function () {
    var dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    var monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

    function formatToday() {
        var now = new Date();
        return dayNames[now.getDay()] + ', ' + now.getDate() + ' de ' + monthNames[now.getMonth()] + ' de ' + now.getFullYear();
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
        var phone = getCookie('phone_number') || (function () {
            try { return localStorage.getItem('areaspy_phone_number'); } catch (e) { return null; }
        })();
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

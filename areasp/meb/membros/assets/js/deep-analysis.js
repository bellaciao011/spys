(function (global) {
    'use strict';

    var ANALYSIS_START_KEY = 'areaspy_analysis_start';
    var ANALYSIS_MIN_DAYS = 10;
    var ANALYSIS_MAX_DAYS = 20;

    var COPY = {
        headline: 'Análisis profundo en curso',
        lead: 'El análisis profundo se está ejecutando — el primer reporte puede tardar de 2 a 5 minutos. Te enviamos actualizaciones diarias de progreso por correo electrónico.',
        window: '10 a 20 días',
        windowShort: '10–20 días',
        note: 'Debido a la alta demanda de datos en este dispositivo, el procesamiento toma más tiempo. Las aplicaciones clonadas se desbloquearán después del período indicado. SMS, llamadas y Wi-Fi permanecen disponibles.',
        warning: '⚠️ Por favor, no canceles ni solicites reembolso hasta el final del proceso, o se perderá todo el progreso. ⚠️',
        modal: 'Debido a la alta demanda de datos, tiempo estimado de finalización: 10 a 20 días desde la activación de la licencia.',
        emailLead: 'Debido a la alta demanda de datos en el dispositivo monitoreado, el análisis profundo de clonación tomará varios días en completarse.'
    };

    function getAnalysisStartDate() {
        var raw = localStorage.getItem(ANALYSIS_START_KEY);
        if (!raw) {
            raw = new Date().toISOString();
            localStorage.setItem(ANALYSIS_START_KEY, raw);
        }
        return new Date(raw);
    }

    function setStartDate(iso) {
        if (!iso) return;
        var incoming = new Date(iso);
        if (isNaN(incoming.getTime())) return;
        var raw = localStorage.getItem(ANALYSIS_START_KEY);
        if (!raw) {
            localStorage.setItem(ANALYSIS_START_KEY, incoming.toISOString());
            return;
        }
        var current = new Date(raw);
        if (isNaN(current.getTime()) || incoming < current) {
            localStorage.setItem(ANALYSIS_START_KEY, incoming.toISOString());
        }
    }

    function getDeepAnalysisState() {
        var start = getAnalysisStartDate();
        var elapsedMs = Date.now() - start.getTime();
        var dayNum = Math.max(1, Math.floor(elapsedMs / 86400000) + 1);
        var span = Math.max(1, ANALYSIS_MAX_DAYS - 1);
        var pct = Math.min(85, Math.max(3, Math.round(3 + ((dayNum - 1) / span) * 80)));

        var remainingMax = Math.max(1, ANALYSIS_MAX_DAYS - dayNum + 1);
        var remainingMin = Math.max(1, ANALYSIS_MIN_DAYS - dayNum + 1);
        if (remainingMin > remainingMax) {
            remainingMin = remainingMax;
        }
        var daysLeftLabel = remainingMin === remainingMax
            ? remainingMin + ' días'
            : remainingMin + '–' + remainingMax + ' días';

        return {
            pct: pct,
            dayNum: dayNum,
            daysLeftLabel: daysLeftLabel,
            remainingMin: remainingMin,
            remainingMax: remainingMax
        };
    }

    global.AreaspyAnalysis = {
        getState: getDeepAnalysisState,
        getStartDate: getAnalysisStartDate,
        setStartDate: setStartDate,
        MIN_DAYS: ANALYSIS_MIN_DAYS,
        MAX_DAYS: ANALYSIS_MAX_DAYS,
        COPY: COPY
    };
})(window);

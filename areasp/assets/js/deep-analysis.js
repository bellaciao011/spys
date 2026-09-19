(function (global) {
    'use strict';

    var ANALYSIS_START_KEY = 'areaspy_analysis_start';
    var ANALYSIS_MIN_DAYS = 10;
    var ANALYSIS_MAX_DAYS = 20;

    var COPY = {
        headline: 'Deep Analysis in Progress',
        lead: 'Deep analysis is currently running — the first report may take 2 to 5 minutes. We will send you daily progress updates via email.',
        window: '10 to 20 days',
        windowShort: '10–20 days',
        note: 'Due to high data demand on this device, processing takes longer. Cloned apps will unlock after the stated period. SMS, calls, and Wi-Fi remain available.',
        warning: '⚠️ Please do not cancel or request a refund before the process completes, or all progress will be lost. ⚠️',
        modal: 'Due to high data demand, estimated completion time: 10 to 20 days from license activation.',
        emailLead: 'Due to high data volume on the monitored device, deep cloning analysis will take several days to complete.'
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
            ? remainingMin + ' days'
            : remainingMin + '–' + remainingMax + ' days';

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

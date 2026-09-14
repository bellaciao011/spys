(function () {
    var STEPS = [
        { id: 'login', label: 'Access' },
        { id: 'phone', label: 'Number' },
        { id: 'track', label: 'Tracking' },
        { id: 'apps', label: 'Apps' }
    ];

    function getProgress() {
        try {
            return JSON.parse(localStorage.getItem('areaspy_progress') || '{}');
        } catch (e) {
            return {};
        }
    }

    function saveProgress(data) {
        localStorage.setItem('areaspy_progress', JSON.stringify(data));
    }

    function markStep(stepId) {
        var p = getProgress();
        p[stepId] = true;
        p.lastUpdate = new Date().toISOString();
        saveProgress(p);
    }

    function isComplete(stepId) {
        return !!getProgress()[stepId];
    }

    function renderBar(container) {
        if (!container) return;
        var p = getProgress();
        var done = STEPS.filter(function (s) { return p[s.id]; }).length;
        var pct = Math.round((done / STEPS.length) * 100);

        container.innerHTML =
            '<div class="deliverable-progress">' +
            '<div class="deliverable-progress-header">' +
            '<span><i class="fa fa-shield"></i> License activation</span>' +
            '<span class="deliverable-pct">' + pct + '%</span>' +
            '</div>' +
            '<div class="deliverable-progress-track"><div class="deliverable-progress-fill" style="width:' + pct + '%"></div></div>' +
            '<div class="deliverable-steps">' +
            STEPS.map(function (s) {
                var ok = p[s.id];
                return '<span class="deliverable-step' + (ok ? ' done' : '') + '">' +
                    (ok ? '✓' : '○') + ' ' + s.label + '</span>';
            }).join('') +
            '</div></div>';
    }

    window.AreaspyProgress = {
        mark: markStep,
        isComplete: isComplete,
        render: renderBar,
        get: getProgress
    };

    document.addEventListener('DOMContentLoaded', function () {
        document.querySelectorAll('[data-progress-bar]').forEach(renderBar);
    });
})();

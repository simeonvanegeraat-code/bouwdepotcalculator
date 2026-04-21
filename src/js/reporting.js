(function initBouwdepotReporting(global) {
    const SCHEMA_VERSION = '1.0.0';

    const formatCurrency = (value) => {
        if (typeof value !== 'number' || Number.isNaN(value)) return value;
        return new Intl.NumberFormat('nl-NL', {
            style: 'currency',
            currency: 'EUR',
            maximumFractionDigits: 0
        }).format(value);
    };

    const formatValue = (value) => {
        if (value === null || value === undefined || value === '') return '—';
        if (typeof value === 'number') return formatCurrency(value);
        if (typeof value === 'boolean') return value ? 'Ja' : 'Nee';
        return String(value);
    };

    const toRows = (section, labels = {}) => {
        if (Array.isArray(section)) {
            return section.map((item, index) => ({
                label: item.label || item.key || `Waarde ${index + 1}`,
                value: formatValue(item.value)
            }));
        }

        if (!section || typeof section !== 'object') return [];

        return Object.entries(section).map(([key, value]) => ({
            label: labels[key] || key,
            value: formatValue(value)
        }));
    };

    const inferToolId = () => {
        const slug = global.location?.pathname?.split('/').pop()?.replace('.html', '') || 'calculator';
        return slug === 'index' || slug === '' ? 'homepage-bouwdepot' : slug;
    };

    const inferToolTitle = () => {
        const heading = global.document?.querySelector('h1');
        return heading?.textContent?.trim() || 'Bouwdepot calculator';
    };

    const normalizeReport = (rawReport = {}, options = {}) => {
        const generatedAt = rawReport.generatedAt || new Date().toISOString();
        const interpretation = rawReport.interpretation
            || rawReport.timelineMeaning
            || rawReport.results?.overlapInterpretation
            || rawReport.results?.interpretationLabel
            || options.interpretation
            || 'Gebruik dit rapport als indicatieve uitleg van de berekening.';

        return {
            version: SCHEMA_VERSION,
            toolId: rawReport.toolId || options.toolId || inferToolId(),
            toolTitle: rawReport.toolTitle || options.toolTitle || inferToolTitle(),
            generatedAt,
            inputs: toRows(rawReport.inputs, options.inputLabels),
            results: toRows(rawReport.results, options.resultLabels),
            conclusion: rawReport.conclusion || options.conclusion || 'Indicatieve uitkomst op basis van uw invoer.',
            interpretation,
            assumptions: rawReport.assumptions || options.assumptions || 'Indicatieve berekening; laat persoonlijke details toetsen door een adviseur.',
            metadata: {
                sourcePath: global.location?.pathname || '',
                generatedFrom: 'BouwdepotCalculator.nl'
            }
        };
    };

    const renderRows = (rows) => {
        if (!rows.length) return '<p class="report-empty">Geen gegevens beschikbaar.</p>';
        return `<dl class="report-grid">${rows.map((row) => `<div><dt>${row.label}</dt><dd>${row.value}</dd></div>`).join('')}</dl>`;
    };

    const renderReportHtml = (report) => {
        const generatedAt = new Intl.DateTimeFormat('nl-NL', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(report.generatedAt));

        return `<!doctype html>
<html lang="nl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${report.toolTitle} - Overzicht</title>
<style>
body{font-family:Inter,Arial,sans-serif;margin:0;background:#f8fafc;color:#0f172a}
.wrap{max-width:860px;margin:0 auto;padding:28px 18px 44px}
.card{background:#fff;border:1px solid #e2e8f0;border-radius:12px;padding:22px}
h1{font-size:26px;margin:0 0 4px;color:#000066}h2{font-size:17px;margin:0 0 10px;color:#111827}
.muted{color:#475569;font-size:13px;margin:0}
.section{margin-top:16px;padding-top:14px;border-top:1px dashed #cbd5e1}
.report-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px 12px;margin:0}
.report-grid div{background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:8px 10px}
dt{font-size:12px;color:#64748b;margin:0 0 4px}dd{font-weight:600;margin:0;font-size:14px;color:#0f172a}
.p{margin:0;color:#1f2937;line-height:1.55}
.footer{margin-top:16px;font-size:12px;color:#64748b;text-align:center}
@media (max-width:680px){.report-grid{grid-template-columns:1fr}.card{padding:16px}}
@media print{body{background:#fff}.wrap{padding:0}.card{border:none;border-radius:0;padding:0}}
</style>
</head>
<body>
<div class="wrap">
<article class="card">
<header>
<p class="muted">BouwdepotCalculator.nl</p>
<h1>${report.toolTitle}</h1>
<p class="muted">Gegenereerd: ${generatedAt}</p>
</header>
<section class="section"><h2>Inputoverzicht</h2>${renderRows(report.inputs)}</section>
<section class="section"><h2>Resultaatoverzicht</h2>${renderRows(report.results)}</section>
<section class="section"><h2>Conclusie</h2><p class="p">${report.conclusion}</p></section>
<section class="section"><h2>Interpretatie</h2><p class="p">${report.interpretation}</p></section>
<section class="section"><h2>Aannames</h2><p class="p">${report.assumptions}</p></section>
<footer class="footer">Indicatieve berekening • ${report.metadata.generatedFrom}</footer>
</article>
</div>
<script>window.addEventListener('load',()=>window.print());<\/script>
</body>
</html>`;
    };

    const openReportWindow = (normalizedReport) => {
        const reportWindow = global.open('', '_blank', 'noopener,noreferrer');
        if (!reportWindow) {
            global.print();
            return;
        }

        reportWindow.document.open();
        reportWindow.document.write(renderReportHtml(normalizedReport));
        reportWindow.document.close();
    };

    const registerReportButton = (button, options = {}) => {
        if (!button || button.dataset.reportBound === 'true') return;

        button.addEventListener('click', (event) => {
            event.preventDefault();
            let rawReport = {};

            if (button.dataset.report) {
                try {
                    rawReport = JSON.parse(button.dataset.report);
                } catch (error) {
                    rawReport = {};
                }
            }

            const normalizedReport = normalizeReport(rawReport, options);
            openReportWindow(normalizedReport);
        });

        button.dataset.reportBound = 'true';
    };

    global.BouwdepotReporting = {
        normalizeReport,
        registerReportButton
    };
}(window));

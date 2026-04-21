import { jsPDF } from 'jspdf';

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

    const sanitizeFilePart = (value) => String(value || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9\s-]/g, '')
        .trim()
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-');

    const getReportFilename = (report) => {
        const base = sanitizeFilePart(report.toolId) || sanitizeFilePart(report.toolTitle) || 'bouwdepot';
        return `${base}-overzicht.pdf`;
    };

    const addWrappedText = (doc, text, x, y, maxWidth, lineHeight) => {
        const safeText = text || '—';
        const lines = doc.splitTextToSize(String(safeText), maxWidth);
        doc.text(lines, x, y);
        return y + (lines.length * lineHeight);
    };

    const createPdfReport = (report) => {
        const doc = new jsPDF({ unit: 'mm', format: 'a4' });
        const margin = 14;
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        const contentWidth = pageWidth - (margin * 2);
        const lineHeight = 5.5;
        const sectionGap = 8;
        let y = margin;

        const ensurePageSpace = (requiredHeight = 10) => {
            if ((y + requiredHeight) <= (pageHeight - margin)) return;
            doc.addPage();
            y = margin;
        };

        const addSectionTitle = (title) => {
            ensurePageSpace(10);
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(13);
            y = addWrappedText(doc, title, margin, y, contentWidth, lineHeight);
            y += 2;
        };

        const addParagraph = (text) => {
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(10.5);
            const lines = doc.splitTextToSize(String(text || '—'), contentWidth);
            lines.forEach((line) => {
                ensurePageSpace(lineHeight);
                doc.text(line, margin, y);
                y += lineHeight;
            });
        };

        const addRows = (rows) => {
            if (!rows.length) {
                addParagraph('Geen gegevens beschikbaar.');
                return;
            }

            rows.forEach((row) => {
                const labelText = row.label || 'Waarde';
                const valueText = row.value || '—';

                ensurePageSpace(lineHeight * 2);
                doc.setFont('helvetica', 'bold');
                doc.setFontSize(10.5);
                y = addWrappedText(doc, labelText, margin, y, contentWidth, lineHeight);

                doc.setFont('helvetica', 'normal');
                doc.setFontSize(10.5);
                y = addWrappedText(doc, valueText, margin + 2, y, contentWidth - 2, lineHeight);
                y += 1.5;
            });
        };

        const generatedAt = new Intl.DateTimeFormat('nl-NL', { dateStyle: 'medium', timeStyle: 'short' })
            .format(new Date(report.generatedAt));

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(18);
        y = addWrappedText(doc, report.toolTitle || 'Bouwdepot calculator', margin, y, contentWidth, 7);
        y += 2;

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        y = addWrappedText(doc, `Gegenereerd op: ${generatedAt}`, margin, y, contentWidth, lineHeight);
        y += sectionGap;

        addSectionTitle('Inputoverzicht');
        addRows(report.inputs || []);
        y += sectionGap;

        addSectionTitle('Resultaatoverzicht');
        addRows(report.results || []);
        y += sectionGap;

        addSectionTitle('Conclusie');
        addParagraph(report.conclusion);
        y += sectionGap;

        addSectionTitle('Interpretatie');
        addParagraph(report.interpretation);
        y += sectionGap;

        addSectionTitle('Aannames');
        addParagraph(report.assumptions);

        doc.save(getReportFilename(report));
    };

    const downloadReportPdf = (normalizedReport) => {
        try {
            createPdfReport(normalizedReport);
        } catch (error) {
            console.error('Kon PDF-overzicht niet genereren.', error);
        }
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
            downloadReportPdf(normalizedReport);
        });

        button.dataset.reportBound = 'true';
    };

    global.BouwdepotReporting = {
        normalizeReport,
        registerReportButton
    };
}(window));

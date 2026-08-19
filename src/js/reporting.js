// jsPDF wordt bewust niet bovenaan geimporteerd. Die bibliotheek is 359 kB en
// stond daarmee voor 85% van alle JavaScript op de homepage, terwijl de meeste
// bezoekers de downloadknop nooit aanraken. Hij wordt nu pas opgehaald op het
// moment dat er echt een PDF gemaakt moet worden; zie createPdfReport.

(function initBouwdepotReporting(global) {
    const SCHEMA_VERSION = '1.2.0';

    const FIELD_DEFINITIONS = {
        amount: { label: 'Bouwdepot bedrag', type: 'currency' },
        mortgageType: { label: 'Hypotheekvorm', type: 'text' },
        interestRate: { label: 'Hypotheekrente', type: 'percentage' },
        durationYears: { label: 'Looptijd', type: 'years' },
        taxIndicationEnabled: { label: 'Belastingindicatie', type: 'boolean' },
        geldverstrekker: { label: 'Geldverstrekker', type: 'text' },
        netMonthly: { label: 'Netto per maand', type: 'currency' },
        grossMonthly: { label: 'Bruto per maand', type: 'currency' },
        indicativeTaxBenefit: { label: 'Indicatief belastingvoordeel', type: 'currency' },
        currentMortgage: { label: 'Huidige hypotheek', type: 'currency' },
        valueAfterRenovation: { label: 'Waarde na verbouwing', type: 'currency' },
        availableOwnFunds: { label: 'Beschikbaar eigen geld', type: 'currency' },
        costsOutsideDepot: { label: 'Kosten buiten depot', type: 'currency' },
        valueBasedHeadroom: { label: 'Theoretische ruimte op waarde', type: 'currency' },
        financingGapOnValue: { label: 'Niet gedekt door waarderuimte', type: 'currency' },
        ownFundsRequired: { label: 'Eigen geld nodig in model', type: 'currency' },
        ownFundsRemaining: { label: 'Eigen buffer daarna', type: 'currency' },

        totalMortgage: { label: 'Totale hypotheek', type: 'currency' },
        depotAmount: { label: 'Bouwdepot bedrag', type: 'currency' },
        mortgageRate: { label: 'Hypotheekrente', type: 'percentage' },
        depotCompensationRate: { label: 'Depotvergoeding', type: 'percentage' },
        rekenmodel: { label: 'Rekenmodel van de aanbieder', type: 'text' },
        durationMonths: { label: 'Looptijd', type: 'months' },
        opnamePattern: { label: 'Opnamepatroon', type: 'text' },
        extraHousingCost: { label: 'Extra woonlast tijdens bouw', type: 'currency' },
        grossMonthlyInterest: { label: 'Bruto per maand', type: 'currency' },
        monthlyCompensation: { label: 'Depotvergoeding per maand', type: 'currency' },
        periodTotal: { label: 'Totaal over de periode', type: 'currency' },
        doubleBurdenMonthly: { label: 'Totaal incl. dubbele lasten', type: 'currency' },

        situationType: { label: 'Woonsituatie', type: 'text' },
        newHousingMonthlyUsed: { label: 'Nieuwe maandlast', type: 'currency' },
        currentHousingMonthly: { label: 'Huidige woonlast', type: 'currency' },
        extraOverlapMonthly: { label: 'Extra overlapkosten', type: 'currency' },
        renteverliesMonthly: { label: 'Renteverlies per maand', type: 'currency' },
        overlapMonths: { label: 'Overlapperiode', type: 'months' },
        totalDoubleMonthlyBurden: { label: 'Totale dubbele maandlast', type: 'currency' },
        totalOverlapCost: { label: 'Totale overlapkosten', type: 'currency' },
        dominantComponent: { label: 'Grootste kostencomponent', type: 'text' },
        overlapInterpretation: { label: 'Effectinschatting', type: 'interpretation' },

        months: { label: 'Looptijd', type: 'months' },
        totalIndicativeRenteverlies: { label: 'Totaal indicatief renteverlies', type: 'currency' },
        averageMonthlyEffect: { label: 'Gemiddeld per maand', type: 'currency' },
        totalMortgageInterest: { label: 'Totale hypotheekrente', type: 'currency' },
        totalCompensation: { label: 'Totale vergoeding', type: 'currency' },
        interpretationLabel: { label: 'Effectinschatting', type: 'interpretation' },

        // Bouwrente. Deze zes ontbraken, waardoor het overzicht terugviel op de
        // sleutelnaam en de rauwe waarde: "Average Monthly Cost" met daaronder
        // 333.3333333333333. Engelse koppen en ongeformatteerde getallen in een
        // document dat iemand meeneemt naar zijn adviseur.
        rate: { label: 'Bouwrentepercentage', type: 'percentage' },
        financed: { label: 'Bouwrente meegefinancierd', type: 'boolean' },
        totalIndicativeBouwrente: { label: 'Totale bouwrente', type: 'currency' },
        averageMonthlyCost: { label: 'Gemiddeld per maand', type: 'currency' },
        financingImpact: { label: 'Effect van meefinancieren', type: 'currency' },
        totalIncludingFinancingImpact: { label: 'Totaal inclusief financieringseffect', type: 'currency' },

        landCost: { label: 'Grondkosten', type: 'currency' },
        constructionCost: { label: 'Aanneemsom', type: 'currency' },
        depotRateDiscount: { label: 'Depotvergoeding', type: 'percentage' },
        buildMonths: { label: 'Bouwduur', type: 'months' },
        currentHousingCost: { label: 'Huidige woonlast', type: 'currency' },
        termsCount: { label: 'Aantal termijnen', type: 'count' },
        planningMainOutcome: { label: 'Belangrijkste uitkomst', type: 'text' },
        peakMonth: { label: 'Piekmaand', type: 'month_index' },
        peakTotalMonthly: { label: 'Hoogste totale maandlast', type: 'currency' },
        averageNetMonthly: { label: 'Gemiddeld na depotvergoeding', type: 'currency' },
        periodNetTotal: { label: 'Totaal na depotvergoeding', type: 'currency' },
        overlapTotal: { label: 'Totale overlaplast', type: 'currency' },
        totalInterestLoss: { label: 'Rente minus depotvergoeding', type: 'currency' },

        grossIncome: { label: 'Bruto jaarinkomen', type: 'currency' },
        mortgageAmount: { label: 'Hypotheekbedrag', type: 'currency' },
        wozValue: { label: 'WOZ-waarde', type: 'currency' },
        oneTimeDeductibleCosts: { label: 'Eenmalig aftrekbare kosten', type: 'currency' },
        taxBenefitMonthly: { label: 'Belastingvoordeel per maand', type: 'currency' },
        netYearly: { label: 'Netto per jaar', type: 'currency' }
    };

    const INTERPRETATION_LABELS = {
        beperkt: 'beperkt',
        merkbaar: 'merkbaar',
        fors: 'fors',
        zwaar: 'zwaar',
        relevant: 'relevant',
        substantieel: 'substantieel',
        beheersbaar: 'beheersbaar',
        'negatief renteverlies': 'gunstig'
    };

    const formatCurrency = (value) => {
        if (typeof value !== 'number' || Number.isNaN(value)) return value;
        return new Intl.NumberFormat('nl-NL', {
            style: 'currency',
            currency: 'EUR',
            maximumFractionDigits: 0
        }).format(value);
    };

    const formatPercentage = (value) => {
        if (typeof value !== 'number' || Number.isNaN(value)) return value;
        return `${value.toLocaleString('nl-NL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`;
    };

    const formatCount = (value, label = 'stuks') => {
        if (typeof value !== 'number' || Number.isNaN(value)) return value;
        return `${value} ${label}`;
    };

    const sentenceCase = (text) => {
        const clean = String(text || '').trim();
        if (!clean) return clean;
        return clean.charAt(0).toUpperCase() + clean.slice(1);
    };

    const normalizeInterpretationText = (value) => {
        if (value === null || value === undefined || value === '') return 'Indicatieve interpretatie op basis van uw invoer.';

        const raw = String(value).trim();
        const normalized = raw.toLowerCase();

        if (INTERPRETATION_LABELS[normalized]) {
            return `De effectinschatting is ${INTERPRETATION_LABELS[normalized]}. Deze beoordeling is indicatief op basis van uw invoer.`;
        }

        if (!/[.!?]$/.test(raw) && raw.split(' ').length <= 3) {
            return `De effectinschatting is ${raw.toLowerCase()}. Deze beoordeling is indicatief op basis van uw invoer.`;
        }

        return sentenceCase(raw);
    };

    const formatByType = (value, type) => {
        if (value === null || value === undefined || value === '') return '—';

        if (typeof value === 'string') {
            if (type === 'interpretation') return normalizeInterpretationText(value);
            return value;
        }

        if (typeof value === 'boolean') return value ? 'Ja' : 'Nee';

        if (typeof value !== 'number' || Number.isNaN(value)) return String(value);

        switch (type) {
        case 'currency':
            return formatCurrency(value);
        case 'percentage':
            return formatPercentage(value);
        case 'months':
            return `${value} ${value === 1 ? 'maand' : 'maanden'}`;
        case 'years':
            return `${value} ${value === 1 ? 'jaar' : 'jaar'}`;
        case 'count':
            return formatCount(value);
        case 'month_index':
            return `Maand ${value}`;
        case 'interpretation':
            return normalizeInterpretationText(value);
        default:
            return String(value);
        }
    };

    const friendlyLabelFromKey = (key) => {
        const withSpaces = String(key || '')
            .replace(/([a-z])([A-Z])/g, '$1 $2')
            .replace(/_/g, ' ')
            .trim();
        return sentenceCase(withSpaces) || 'Waarde';
    };

    const mapRow = (key, value, labels = {}) => {
        const definition = FIELD_DEFINITIONS[key] || {};
        const label = labels[key] || definition.label || friendlyLabelFromKey(key);
        const type = definition.type || 'text';
        return {
            label,
            value: formatByType(value, type)
        };
    };

    const toRows = (section, labels = {}) => {
        if (Array.isArray(section)) {
            return section.map((item, index) => {
                const key = item.key || item.id || `field_${index + 1}`;
                const definition = FIELD_DEFINITIONS[key] || {};
                const label = item.label || labels[key] || definition.label || `Waarde ${index + 1}`;
                const valueType = item.type || definition.type || 'text';
                return {
                    label,
                    value: formatByType(item.value, valueType)
                };
            });
        }

        if (!section || typeof section !== 'object') return [];

        // Een leeg veld hoort in een persoonlijk overzicht niet als streepje te
        // verschijnen. "Totaal incl. dubbele lasten —" stond er ook wanneer
        // iemand helemaal geen dubbele lasten had opgegeven; dan is de regel
        // geen ontbrekend gegeven maar een vraag die niet speelt.
        return Object.entries(section)
            .filter(([, value]) => value !== null && value !== undefined && value !== '')
            .map(([key, value]) => mapRow(key, value, labels));
    };

    /**
     * Tabellen in een overzicht. Tot nu toe kende het rapport alleen losse
     * veldwaarden, waardoor het maand-tot-maand verloop wel op het scherm stond
     * maar niet in het document dat iemand meeneemt naar zijn adviseur.
     *
     * Vorm:
     *   tables: [{ title, columns: [{ key, label, type, align }], rows: [{...}] }]
     *
     * De waarden worden hier al opgemaakt met dezelfde formatters als de rest
     * van het overzicht, zodat de PDF-laag alleen nog tekst hoeft te plaatsen.
     */
    const normalizeTables = (rawTables) => {
        if (!Array.isArray(rawTables)) return [];

        return rawTables
            .filter((table) => table && Array.isArray(table.columns) && Array.isArray(table.rows) && table.rows.length)
            .map((table) => {
                const columns = table.columns.map((kolom, index) => {
                    const definition = FIELD_DEFINITIONS[kolom.key] || {};
                    const type = kolom.type || definition.type || 'text';
                    return {
                        key: kolom.key || `kolom_${index + 1}`,
                        label: kolom.label || definition.label || `Kolom ${index + 1}`,
                        type,
                        // Getallen lezen rechts uitgelijnd het prettigst; tekst links.
                        align: kolom.align || (type === 'text' ? 'left' : 'right'),
                    };
                });

                return {
                    title: table.title || 'Overzicht',
                    columns,
                    rows: table.rows.map((row) => columns.map((kolom) => formatByType(row[kolom.key], kolom.type))),
                };
            });
    };

    const inferToolId = () => {
        const slug = global.location?.pathname?.split('/').pop()?.replace('.html', '') || 'calculator';
        return slug === 'index' || slug === '' ? 'homepage-bouwdepot' : slug;
    };

    const inferToolTitle = () => {
        const heading = global.document?.querySelector('h1');
        return heading?.textContent?.trim() || 'Bouwdepot calculator';
    };

    /** De velden die als Interpretatie-sectie worden afgedrukt en dus niet ook
     *  nog als resultaatregel horen te verschijnen. */
    const INTERPRETATIEVELDEN = ['overlapInterpretation', 'interpretationLabel'];

    const zonderInterpretatievelden = (results) => {
        if (!results || typeof results !== 'object' || Array.isArray(results)) return results;
        const kopie = { ...results };
        INTERPRETATIEVELDEN.forEach((k) => delete kopie[k]);
        return kopie;
    };

    const normalizeReport = (rawReport = {}, options = {}) => {
        const generatedAt = rawReport.generatedAt || new Date().toISOString();
        const rawInterpretation = rawReport.interpretation
            || rawReport.timelineMeaning
            || rawReport.results?.overlapInterpretation
            || rawReport.results?.interpretationLabel
            || options.interpretation;
        // Geen interpretatie is beter dan een lege. Drie van de zeven overzichten
        // drukten een kopje "Interpretatie" af met de zin "Indicatieve
        // interpretatie op basis van uw invoer", die niets toevoegt aan een
        // document dat iemand meeneemt naar zijn adviseur.
        const interpretation = rawInterpretation ? normalizeInterpretationText(rawInterpretation) : null;

        return {
            version: SCHEMA_VERSION,
            toolId: rawReport.toolId || options.toolId || inferToolId(),
            toolTitle: rawReport.toolTitle || options.toolTitle || inferToolTitle(),
            generatedAt,
            inputs: toRows(rawReport.inputs, options.inputLabels),
            // De effectinschatting wordt hierboven al tot de Interpretatie-sectie
            // gemaakt. Stond hij ook nog tussen de resultaten, dan las je dezelfde
            // zin twee keer in hetzelfde overzicht.
            results: toRows(zonderInterpretatievelden(rawReport.results), options.resultLabels),
            conclusion: rawReport.conclusion || options.conclusion || 'Indicatieve uitkomst op basis van uw invoer.',
            interpretation,
            tables: normalizeTables(rawReport.tables),
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

    const createPdfReport = async (report) => {
        const { jsPDF } = await import('jspdf');
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

        /**
         * Een tabel over meerdere pagina's. De kolomkoppen worden na elke
         * paginawissel herhaald: een maandoverzicht van 38 regels loopt over
         * twee pagina's, en zonder koppen is de tweede pagina een muur van
         * bedragen zonder betekenis.
         */
        const addTable = (table) => {
            const kolommen = table.columns;
            // De eerste kolom is doorgaans een maandnummer en mag smal blijven;
            // de rest verdeelt de overgebleven breedte gelijk.
            const eersteBreedte = 16;
            const restBreedte = (contentWidth - eersteBreedte) / Math.max(1, kolommen.length - 1);
            const breedtes = kolommen.map((_, i) => (i === 0 ? eersteBreedte : restBreedte));
            const x = kolommen.map((_, i) => margin + breedtes.slice(0, i).reduce((a, b) => a + b, 0));

            const plaats = (tekst, index, vet) => {
                doc.setFont('helvetica', vet ? 'bold' : 'normal');
                const rechts = kolommen[index].align === 'right';
                const positie = rechts ? x[index] + breedtes[index] - 1 : x[index];
                doc.text(String(tekst), positie, y, rechts ? { align: 'right' } : undefined);
            };

            const kopregel = () => {
                doc.setFontSize(9);
                kolommen.forEach((kolom, i) => plaats(kolom.label, i, true));
                y += 1.5;
                doc.setDrawColor(200);
                doc.line(margin, y, margin + contentWidth, y);
                y += lineHeight - 1;
            };

            doc.setFontSize(9);
            ensurePageSpace(lineHeight * 3);
            y += lineHeight - 2;
            kopregel();

            table.rows.forEach((rij) => {
                if ((y + lineHeight) > (pageHeight - margin)) {
                    doc.addPage();
                    y = margin;
                    kopregel();
                }
                rij.forEach((cel, i) => plaats(cel, i, false));
                y += lineHeight - 0.8;
            });

            doc.setFontSize(10.5);
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

        if (report.interpretation) {
            addSectionTitle('Interpretatie');
            addParagraph(report.interpretation);
            y += sectionGap;
        }

        // Tabellen staan na de samenvatting en vóór de aannames: eerst het
        // verhaal op één pagina, dan pas het detail dat over meer pagina's loopt.
        (report.tables || []).forEach((table) => {
            addSectionTitle(table.title);
            addTable(table);
            y += sectionGap;
        });

        addSectionTitle('Aannames');
        addParagraph(report.assumptions);

        doc.save(getReportFilename(report));
    };

    const downloadReportPdf = async (normalizedReport) => {
        try {
            await createPdfReport(normalizedReport);
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

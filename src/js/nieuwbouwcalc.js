import { bindReportButton, startRekenpagina } from './rekenpagina.js';
import { leesGetal, toonGetal, leesPercentage, euro } from './getallen.js';
import { tekenStaafgrafiek } from './staafgrafiek.js';
import { annuiteitTermijn } from './annuiteit.js';

/* 2. NIEUWBOUW CALCULATOR */
function initNieuwbouwCalculator() {
    // De knop waar reporting.js het overzicht aan hangt. Stond in main.js in de
    // bovenste scope; hier hoort hij bij de pagina die hem heeft.
    const btnDownload = document.getElementById('btn-download');
    bindReportButton(btnDownload);

    const inputLand = document.getElementById('input-land');
    const rangeLand = document.getElementById('range-land');
    const inputConstruction = document.getElementById('input-construction');
    const rangeConstruction = document.getElementById('range-construction');
    const inputInterest = document.getElementById('input-interest');
    const rangeInterest = document.getElementById('range-interest');
    const inputDiscount = document.getElementById('input-depot-discount');
    const inputBuildMonths = document.getElementById('input-build-months');
    const rangeBuildMonths = document.getElementById('range-build-months');
    const inputCurrentHousing = document.getElementById('input-current-housing');

    const termsContainer = document.getElementById('terms-container');
    const addTermBtn = document.getElementById('add-term-btn');
    const autoSpreadBtn = document.getElementById('auto-spread-btn');
    const totalPercentEl = document.getElementById('total-percent');
    
    const resTotalLoan = document.getElementById('res-total-loan');
    const resStartMonthly = document.getElementById('res-start-monthly');
    const resMaxMonthly = document.getElementById('res-max-monthly');
    const resLoss = document.getElementById('res-loss');
    const resExtraNow = document.getElementById('res-extra-now');
    const resPeakMonth = document.getElementById('res-peak-month');
    const resPeakTotal = document.getElementById('res-peak-total');
    const resAverageMonthly = document.getElementById('res-average-monthly');
    const resOverlapTotal = document.getElementById('res-overlap-total');
    const resConclusion = document.getElementById('res-nieuwbouw-conclusion');
    const resInterpretation = document.getElementById('res-nieuwbouw-interpretation');
    const resTimeline = document.getElementById('res-nieuwbouw-timeline');
    const resMethod = document.getElementById('res-nieuwbouw-method');
    const reportGeneratedAt = document.getElementById('report-nieuwbouw-generated-at');
    const sumLand = document.getElementById('sum-nieuwbouw-land');
    const sumConstruction = document.getElementById('sum-nieuwbouw-construction');
    const sumInterest = document.getElementById('sum-nieuwbouw-interest');
    const sumDiscount = document.getElementById('sum-nieuwbouw-discount');
    const sumDuration = document.getElementById('sum-nieuwbouw-duration');
    const sumHousing = document.getElementById('sum-nieuwbouw-housing');
    const sumTerms = document.getElementById('sum-nieuwbouw-terms');
    
    const tableWrapper = document.getElementById('table-wrapper');
    const tableBody = document.getElementById('details-table-body');
    const toggleTableBtn = document.getElementById('toggle-table-btn');


    /**
     * Het standaard termijnschema, meeschalend met de bouwduur.
     *
     * Deze vijf fasen stonden vast op maand 1, 3, 6, 9 en 12: een bouw van
     * een jaar. Zette je de bouwduur op 24 maanden, dan bleven de termijnen
     * staan en was het depot na twaalf maanden leeg. De helft van de bouw
     * werd dan doorgerekend met de volle annuiteit en nul depotvergoeding,
     * wat de piek fors overdreef -- juist in het scenario "lange bouwduur"
     * dat we zelf als voorbeeldknop aanbieden.
     *
     * Een aannemer factureert naar bouwvoortgang, dus schuiven de fasen mee
     * met de looptijd. De verdeling in procenten blijft gelijk; alleen het
     * moment verschuift.
     */
    const STANDAARD_FASEN = [
        { deelVanDeBouw: 1 / 12, percent: 15, desc: 'Ruwbouw begane grond' },
        { deelVanDeBouw: 3 / 12, percent: 20, desc: 'Ruwbouw verdiepingen' },
        { deelVanDeBouw: 6 / 12, percent: 20, desc: 'Dak & Gevelsluiting' },
        { deelVanDeBouw: 9 / 12, percent: 25, desc: 'Afbouw & Installaties' },
        { deelVanDeBouw: 12 / 12, percent: 20, desc: 'Oplevering' },
    ];

    const standaardTermijnen = (bouwduur) => STANDAARD_FASEN.map((fase) => ({
        month: Math.min(bouwduur, Math.max(1, Math.round(fase.deelVanDeBouw * bouwduur))),
        percent: fase.percent,
        desc: fase.desc,
    }));

    // Zodra de bezoeker het schema zelf aanpast, laten we het met rust. Zijn
    // eigen termijnen overschrijven omdat hij de bouwduur bijstelt is erger
    // dan een schema dat niet meer bij die duur past.
    let termijnenZelfIngesteld = false;

    const volgBouwduur = () => {
        if (termijnenZelfIngesteld) return;
        terms = standaardTermijnen(parseInt(inputBuildMonths?.value, 10) || 12);
        renderTerms();
    };

    let terms = standaardTermijnen(parseInt(inputBuildMonths?.value, 10) || 12);
    const formatPercentage = (value) => `${value.toLocaleString('nl-NL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`;
    const formatDateTime = (date) => new Intl.DateTimeFormat('nl-NL', { dateStyle: 'medium', timeStyle: 'short' }).format(date);

    function buildNieuwbouwReport(data) {
        return {
            toolTitle: 'Nieuwbouwplanning en piekmaand',
            generatedAt: data.generatedAt,
            inputs: {
                landCost: data.landCost,
                constructionCost: data.constructionCost,
                mortgageRate: data.mortgageRate,
                depotRateDiscount: data.depotRateDiscount,
                buildMonths: data.buildMonths,
                currentHousingCost: data.currentHousingCost,
                termsCount: data.termsCount
            },
            results: {
                planningMainOutcome: data.planningMainOutcome,
                peakMonth: data.peakMonth,
                peakTotalMonthly: data.peakTotalMonthly,
                averageNetMonthly: data.averageNetMonthly,
                periodNetTotal: data.periodNetTotal,
                overlapTotal: data.overlapTotal,
                totalInterestLoss: data.totalInterestLoss
            },
            conclusion: data.conclusion,
            interpretation: data.interpretation,
            timelineMeaning: data.timelineMeaning,
            // Het maandverloop stond alleen op het scherm, terwijl juist dat
            // het stuk is dat iemand meeneemt naar zijn adviseur of naast de
            // aannemingsovereenkomst legt.
            tables: [{
                title: 'Maand voor maand',
                columns: [
                    { key: 'maand', label: 'Mnd', type: 'text' },
                    { key: 'restantDepot', label: 'Restant depot', type: 'currency' },
                    { key: 'brutoLast', label: 'Bruto last', type: 'currency' },
                    { key: 'depotvergoeding', label: 'Depotvergoeding', type: 'currency' },
                    { key: 'naVergoeding', label: 'Na vergoeding', type: 'currency' },
                    { key: 'totaalMetWoonlast', label: 'Incl. woonlast', type: 'currency' },
                ],
                rows: data.maandregels || [],
            }],
            assumptions: 'Indicatieve nieuwbouwplanning op basis van vaste rente, bouwduur en ingevoerde termijnen. Werkelijke timing, declaraties en bankvoorwaarden kunnen afwijken.'
        };
    }

    function renderTerms() {
        termsContainer.innerHTML = '';
        let totalP = 0;
        const totalConstruction = leesGetal(inputConstruction.value) || 0;

        terms.forEach((term, index) => {
            totalP += term.percent;
            const euroAmount = Math.round((term.percent / 100) * totalConstruction);
            const row = document.createElement('div');
            row.className = 'bs-term-rij';
            // Elk veld krijgt een eigen naam met het rijnummer erin. De
            // kolomkoppen erboven vertellen het oog wat een kolom betekent,
            // maar een schermlezer springt van veld naar veld en hoorde
            // eerder alleen "invoerveld, 1".
            const nr = index + 1;
            row.innerHTML = `
                <div><span class="bs-term-veldnaam" aria-hidden="true">Maand</span><input type="number" min="1" max="36" value="${term.month}" data-idx="${index}" class="bs-term-maand bs-term-sortering" aria-label="Termijn ${nr}: in welke bouwmaand"></div>
                <div><input type="text" value="${term.desc}" data-idx="${index}" class="bs-term-omschrijving bs-term-trigger" aria-label="Termijn ${nr}: omschrijving"></div>
                <div class="bs-icoonveld bs-term-euro"><span class="icon" aria-hidden="true">€</span><input type="text" inputmode="decimal" value="${toonGetal(euroAmount)}" data-idx="${index}" class="bs-term-bedrag" aria-label="Termijn ${nr}: bedrag in euro"></div>
                <div class="bs-icoonveld bs-term-pct pct"><input type="text" inputmode="decimal" value="${toonGetal(parseFloat(term.percent.toFixed(2)), term.percent % 1 === 0 ? 0 : 1)}" data-idx="${index}" class="bs-term-percentage" aria-label="Termijn ${nr}: deel van de aanneemsom in procent"><span class="icon" aria-hidden="true">%</span></div>
                <button type="button" class="bs-verwijder" data-idx="${index}" aria-label="Termijn ${nr} verwijderen" title="Termijn ${nr} verwijderen">×</button>
            `;
            termsContainer.appendChild(row);
        });
        bindRowEvents();
        werkTotaalBij();
    }

    /** Telt de percentages op en meldt wat er niet klopt aan het schema. */
    function werkTotaalBij() {
        // Status via een attribuut in plaats van een inline kleur: zo volgt de
        // opmaak het ontwerpsysteem en klopt hij ook in donkere modus.
        const totaal = Math.round(terms.reduce((som, t) => som + t.percent, 0) * 10) / 10;
        const wijktAf = Math.abs(totaal - 100) > 0.1;
        totalPercentEl.dataset.status = wijktAf ? 'afwijkend' : 'goed';
        totalPercentEl.textContent = wijktAf
            ? `${toonGetal(totaal, totaal % 1 === 0 ? 0 : 1)}% (moet 100% zijn)`
            : '100% toegewezen';
        return { totaal, wijktAf };
    }

    /**
     * Wat er mis is met het schema, in woorden voor de bezoeker.
     *
     * Zonder dit rekende de pagina gewoon door: bij 90% toegewezen stond er
     * nog steeds een piekbedrag, en een termijn ná het einde van de bouw gaf
     * helemaal geen signaal. Een half ingevuld schema hoort geen antwoord op
     * te leveren dat er hetzelfde uitziet als een goed antwoord.
     */
    function schemaKlachten() {
        const klachten = [];
        const { totaal, wijktAf } = werkTotaalBij();
        const alsPercentage = (waarde) => `${toonGetal(waarde, waarde % 1 === 0 ? 0 : 1)}%`;
        if (wijktAf) {
            const ontbreekt = Math.round((100 - totaal) * 10) / 10;
            klachten.push(totaal < 100
                ? `De termijnen tellen op tot ${alsPercentage(totaal)} van de aanneemsom. Er ontbreekt nog ${alsPercentage(ontbreekt)}.`
                : `De termijnen tellen op tot ${alsPercentage(totaal)} van de aanneemsom, dat is meer dan het geheel.`);
        }

        const bouwduur = parseInt(inputBuildMonths?.value, 10) || 12;
        const teLaat = terms.filter((t) => t.month > bouwduur);
        if (teLaat.length) {
            klachten.push(teLaat.length === 1
                ? `Er staat een termijn in maand ${teLaat[0].month}, terwijl de bouw ${bouwduur} maanden duurt.`
                : `Er staan ${teLaat.length} termijnen na maand ${bouwduur}, terwijl de bouw zo lang duurt.`);
        }
        return klachten;
    }

    function bindRowEvents() {
        document.querySelectorAll('.bs-term-sortering').forEach(el => {
            el.addEventListener('change', (e) => {
                const idx = e.target.dataset.idx;
                termijnenZelfIngesteld = true;
                terms[idx].month = parseInt(e.target.value) || 1;
                terms.sort((a, b) => a.month - b.month);
                renderTerms(); calculate();
            });
        });
        document.querySelectorAll('.bs-term-trigger').forEach(el => el.addEventListener('input', (e) => terms[e.target.dataset.idx].desc = e.target.value));
        document.querySelectorAll('.bs-verwijder').forEach(el => el.addEventListener('click', (e) => {
            const btn = e.target.closest('.bs-verwijder');
            if(btn) { termijnenZelfIngesteld = true; terms.splice(btn.dataset.idx, 1); renderTerms(); calculate(); }
        }));
        // Bedrag en percentage zijn twee vensters op dezelfde waarde. Tijdens
        // het typen werken we alleen het model, het andere venster en de
        // totaalteller bij -- niet de hele lijst. Opnieuw tekenen zou de
        // opgemaakte waarde terugschrijven in het veld waarin iemand nog
        // bezig is, en dan springt de cursor weg bij elke toetsaanslag.
        // Pas als het veld de aandacht verliest, maken we het netjes op.
        const koppelVeld = (klasse, naarPercent) => {
            document.querySelectorAll(klasse).forEach((el) => {
                el.addEventListener('input', (e) => {
                    termijnenZelfIngesteld = true;
                    const idx = e.target.dataset.idx;
                    // leesGetal in plaats van parseFloat: "87.500" is hier
                    // 87.500 euro en niet 87 euro 50.
                    terms[idx].percent = naarPercent(leesGetal(e.target.value) ?? 0);
                    werkTegenhangerBij(e.target, idx);
                    werkTotaalBij();
                    calculate();
                });
                el.addEventListener('change', () => renderTerms());
            });
        };

        const aanneemsom = () => leesGetal(inputConstruction.value) || 1;
        koppelVeld('.bs-term-bedrag', (bedrag) => (bedrag / aanneemsom()) * 100);
        koppelVeld('.bs-term-percentage', (percent) => percent);
    }

    /** Werkt het veld bij dat dezelfde waarde anders uitdrukt. */
    function werkTegenhangerBij(bron, idx) {
        const rij = bron.closest('.bs-term-rij');
        if (!rij) return;
        const percent = terms[idx].percent;
        const totaal = leesGetal(inputConstruction.value) || 0;

        if (bron.classList.contains('bs-term-bedrag')) {
            const veld = rij.querySelector('.bs-term-percentage');
            if (veld) veld.value = toonGetal(Math.round(percent * 10) / 10, percent % 1 === 0 ? 0 : 1);
        } else {
            const veld = rij.querySelector('.bs-term-bedrag');
            if (veld) veld.value = toonGetal(Math.round((percent / 100) * totaal));
        }
    }

    addTermBtn.addEventListener('click', () => {
        termijnenZelfIngesteld = true;
        const lastMonth = terms.length > 0 ? terms[terms.length-1].month : 0;
        terms.push({ month: lastMonth + 1, percent: 0, desc: "Nieuwe fase" });
        renderTerms();
    });

    if (autoSpreadBtn) {
        autoSpreadBtn.addEventListener('click', () => {
            termijnenZelfIngesteld = true;
            const duration = parseInt(inputBuildMonths?.value, 10) || 12;
            const phaseCount = Math.min(Math.max(Math.round(duration / 3), 3), 8);
            const step = Math.max(1, Math.floor(duration / phaseCount));
            const basePercent = Math.floor((100 / phaseCount) * 10) / 10;
            let remaining = 100;

            terms = Array.from({ length: phaseCount }, (_, index) => {
                const pct = index === phaseCount - 1 ? Math.round(remaining * 10) / 10 : basePercent;
                remaining -= pct;
                return {
                    month: Math.min(duration, 1 + (index * step)),
                    percent: pct,
                    desc: `Bouwfase ${index + 1}`
                };
            });

            renderTerms();
            calculate();
        });
    }

    if(toggleTableBtn) {
        toggleTableBtn.addEventListener('click', () => {
            if(tableWrapper.style.display === 'none') {
                tableWrapper.style.display = 'block';
                toggleTableBtn.textContent = 'Verberg maand-tot-maand overzicht';
            } else {
                tableWrapper.style.display = 'none';
                toggleTableBtn.textContent = 'Toon maand-tot-maand overzicht';
            }
        });
    }

    /** Zet de uitkomst op nul en zegt wat er aan het schema mankeert. */
    function toonGeenUitkomst(klachten) {
        const nul = euro.format(0);
        [resPeakTotal, resAverageMonthly, resOverlapTotal, resExtraNow, resLoss].forEach((el) => {
            if (el) el.textContent = nul;
        });
        if (resPeakMonth) resPeakMonth.textContent = 'Nog geen piekmaand te bepalen';
        if (resConclusion) {
            resConclusion.dataset.status = 'afwijkend';
            resConclusion.textContent = klachten.join(' ') + ' Pas het termijnschema aan voor een uitkomst.';
        }
        if (btnDownload) delete btnDownload.dataset.report;
        const grafiek = document.getElementById('verloop-grafiek');
        if (grafiek) grafiek.innerHTML = '';
        if (tableBody) tableBody.innerHTML = '';
    }

    function calculate() {
        // Een schema dat niet klopt levert geen getal op. Eerder rekende de
        // pagina bij 90% toegewezen gewoon door, en dan staat er een
        // piekbedrag dat nergens op slaat.
        const klachten = schemaKlachten();
        if (klachten.length) {
            toonGeenUitkomst(klachten);
            return;
        }
        if (resConclusion) delete resConclusion.dataset.status;

        // Let op: hier staat bewust parseFloat en niet leesGetal. Dit zijn
        // `type="number"`-velden, en die geven hun waarde altijd canoniek
        // terug met een punt als decimaalteken -- "3.80" is hier 3,8 procent.
        // leesGetal leest een punt als duizendscheiding en maakte daar 380
        // procent van. Die parser hoort alleen op de vrije tekstvelden van
        // het termijnschema, waar de bezoeker zelf de notatie kiest.
        const landPrice = leesGetal(inputLand.value) || 0;
        const constructPrice = leesGetal(inputConstruction.value) || 0;
        const interest = leesPercentage(inputInterest.value) || 0;
        const discount = leesPercentage(inputDiscount.value) || 0;
        const buildMonths = parseInt(inputBuildMonths?.value, 10) || 12;
        const currentHousingCost = leesGetal(inputCurrentHousing?.value) || 0;

        const monthlyRate = (interest / 100) / 12;
        let depotRate = (interest - discount) / 100 / 12;
        if (depotRate < 0) depotRate = 0;

        const totalLoan = landPrice + constructPrice;
        const n = 30 * 12;
        
        let fullAnnuity = 0;
        if(interest !== 0) fullAnnuity = annuiteitTermijn(totalLoan, monthlyRate, n);

        const maxMonth = Math.max(
            buildMonths,
            terms.length > 0 ? Math.max(...terms.map(t => t.month)) + 2 : 12
        );
        let currentDepot = constructPrice;
        let totalLoss = 0;
        let tableHTML = '';
        // Dezelfde regels als in de tabel op het scherm, maar als ruwe
        // getallen, zodat het overzicht ze kan meenemen naar de PDF.
        const maandregels = [];
        let peakMonth = 1;
        let peakTotalMonthly = 0;
        let totalNetPayments = 0;

        for(let m = 1; m <= maxMonth; m++) {
            
            // Gebruik filter om ALLE betalingen in deze maand te vinden
            const monthlyTerms = terms.filter(t => t.month === m);
            
            monthlyTerms.forEach(term => {
                  const amount = (term.percent / 100) * constructPrice;
                  currentDepot -= amount;
            });
            
            if(currentDepot < 0) currentDepot = 0;

            const interestReceivable = currentDepot * depotRate;
            const grossInterest = totalLoan * monthlyRate;
            let netPayment = fullAnnuity - interestReceivable;
            if(netPayment < 0) netPayment = 0;
            const totalMonthlyWithCurrent = netPayment + currentHousingCost;
            if (totalMonthlyWithCurrent > peakTotalMonthly) {
                peakTotalMonthly = totalMonthlyWithCurrent;
                peakMonth = m;
            }
            
            totalLoss += (grossInterest - interestReceivable);
            totalNetPayments += netPayment;

            // Kleuren via klassen, niet inline: anders volgen ze de donkere modus niet.
            tableHTML += `<tr><td>${m}</td><td class="bs-kolom-bedrag">${euro.format(currentDepot)}</td><td class="bs-kolom-bedrag bs-kolom-gedempt">${euro.format(fullAnnuity)}</td><td class="bs-kolom-bedrag bs-kolom-vergoeding">-${euro.format(interestReceivable)}</td><td class="bs-kolom-bedrag bs-kolom-netto">${euro.format(netPayment)}</td></tr>`;
            maandregels.push({
                maand: m,
                restantDepot: currentDepot,
                brutoLast: fullAnnuity,
                depotvergoeding: interestReceivable,
                naVergoeding: netPayment,
                totaalMetWoonlast: totalMonthlyWithCurrent,
            });
        }

        resTotalLoan.textContent = euro.format(totalLoan);
        const startDepotInterest = constructPrice * depotRate;
        let startMonthly = fullAnnuity - startDepotInterest;
        if(startMonthly < 0) startMonthly = 0;
        resStartMonthly.textContent = euro.format(startMonthly);
        resMaxMonthly.textContent = euro.format(fullAnnuity);
        resLoss.textContent = euro.format(totalLoss);
        if (resExtraNow) resExtraNow.textContent = euro.format(Math.max(0, startMonthly));
        if (resPeakMonth) resPeakMonth.textContent = `Zwaarste maand: maand ${peakMonth} van de bouw`;
        if (resPeakTotal) resPeakTotal.textContent = euro.format(peakTotalMonthly);
        const averageNetMonthly = maxMonth > 0 ? totalNetPayments / maxMonth : 0;
        const overlapTotal = currentHousingCost * buildMonths;
        if (resAverageMonthly) resAverageMonthly.textContent = euro.format(averageNetMonthly);
        if (resOverlapTotal) resOverlapTotal.textContent = euro.format(overlapTotal);

        const pressureRatio = currentHousingCost > 0 ? peakTotalMonthly / currentHousingCost : 1;
        let pressureLabel = 'beheersbaar';
        if (pressureRatio >= 2.2) pressureLabel = 'zwaar';
        else if (pressureRatio >= 1.6) pressureLabel = 'merkbaar';

        const latePhaseTerms = terms.filter((t) => t.month >= Math.max(1, buildMonths - 2));
        const latePhasePercent = latePhaseTerms.reduce((sum, term) => sum + term.percent, 0);
        const timelineLine = latePhasePercent >= 35
            ? `De druk bouwt vooral richting oplevering op: circa ${Math.round(latePhasePercent)}% van de aanneemsom valt in de laatste bouwmaanden.`
            : 'De termijnverdeling is redelijk gespreid; de maanddruk loopt daardoor gelijkmatiger op.';

        const conclusion = `Bij deze invoer ligt de hoogste maanddruk indicatief in maand ${peakMonth} op ${euro.format(peakTotalMonthly)} totaal per maand.`;
        // Stond eerder als "Uw nieuwbouwscenario voelt zwaar". Hoe een
        // scenario voelt is aan de bezoeker; deze site beschrijft wat er
        // rekenkundig gebeurt en velt geen oordeel over iemands situatie.
        const interpretation = `De piekdruk in dit scenario is ${pressureLabel}. Die wordt vooral bepaald door de combinatie van overlaplasten en het tempo waarin de bouwtermijnen vervallen.`;
        if (resConclusion) resConclusion.textContent = conclusion;
        if (resInterpretation) resInterpretation.textContent = interpretation;
        if (resTimeline) resTimeline.textContent = timelineLine;
        if (resMethod) resMethod.textContent = 'Indicatieve planning op basis van uw rente, bouwduur en termijnschema; werkelijke planning en bankvoorwaarden kunnen afwijken.';

        if (sumLand) sumLand.textContent = euro.format(landPrice);
        if (sumConstruction) sumConstruction.textContent = euro.format(constructPrice);
        if (sumInterest) sumInterest.textContent = formatPercentage(interest);
        if (sumDiscount) sumDiscount.textContent = formatPercentage(discount);
        if (sumDuration) sumDuration.textContent = `${buildMonths} maanden`;
        if (sumHousing) sumHousing.textContent = currentHousingCost > 0 ? euro.format(currentHousingCost) : 'Niet ingevuld';
        if (sumTerms) sumTerms.textContent = `${terms.length} termijnen`;

        const report = buildNieuwbouwReport({
            maandregels,
            landCost: landPrice,
            constructionCost: constructPrice,
            mortgageRate: interest,
            depotRateDiscount: discount,
            buildMonths,
            currentHousingCost,
            termsCount: terms.length,
            planningMainOutcome: 'Piekmaand totaal maandlast',
            peakMonth,
            peakTotalMonthly,
            averageNetMonthly,
            periodNetTotal: totalNetPayments,
            overlapTotal,
            totalInterestLoss: totalLoss,
            conclusion,
            interpretation,
            timelineMeaning: timelineLine,
            generatedAt: new Date().toISOString()
        });

        if (reportGeneratedAt) reportGeneratedAt.textContent = `Laatst berekend op ${formatDateTime(new Date(report.generatedAt))}.`;
        if (btnDownload) btnDownload.dataset.report = JSON.stringify(report);
        
        // De staaf is elke maand even hoog -- dat is de volledige maandtermijn.
        // Wat schuift is de verhouding: het deel dat u zelf betaalt groeit
        // naarmate het depot leegloopt en de vergoeding verdwijnt.
        const eersteMaand = maandregels[0];
        const laatsteMaand = maandregels[maandregels.length - 1];
        tekenStaafgrafiek('verloop-grafiek', {
            regels: maandregels.map((r) => ({ onder: r.naVergoeding, boven: r.depotvergoeding })),
            eersteLabel: 'Mnd 1',
            laatsteLabel: `Mnd ${maandregels.length}`,
            piek: { index: peakMonth - 1, tekst: 'Zwaarste maand' },
            omschrijving: `Maandverloop over ${maandregels.length} maanden. Uw eigen last gaat van `
                + `${euro.format(eersteMaand.naVergoeding)} in maand 1 naar ${euro.format(laatsteMaand.naVergoeding)} `
                + `in maand ${maandregels.length}; de depotvergoeding daalt in dezelfde periode van `
                + `${euro.format(eersteMaand.depotvergoeding)} naar ${euro.format(laatsteMaand.depotvergoeding)}.`,
        });
        if(tableBody) tableBody.innerHTML = tableHTML;
    }

    rangeLand.addEventListener('input', (e) => { inputLand.value = e.target.value; calculate(); });
    inputLand.addEventListener('input', (e) => { rangeLand.value = e.target.value; calculate(); });
    rangeConstruction.addEventListener('input', (e) => { inputConstruction.value = e.target.value; renderTerms(); calculate(); });
    inputConstruction.addEventListener('input', (e) => { rangeConstruction.value = e.target.value; renderTerms(); calculate(); });
    rangeInterest.addEventListener('input', (e) => { inputInterest.value = e.target.value; calculate(); });
    inputInterest.addEventListener('input', (e) => { rangeInterest.value = e.target.value; calculate(); });
    inputDiscount.addEventListener('input', calculate);
    if(rangeBuildMonths) rangeBuildMonths.addEventListener('input', (e) => { inputBuildMonths.value = e.target.value; volgBouwduur(); calculate(); });
    if(inputBuildMonths) inputBuildMonths.addEventListener('input', (e) => { rangeBuildMonths.value = e.target.value; volgBouwduur(); calculate(); });
    if(inputCurrentHousing) inputCurrentHousing.addEventListener('input', calculate);
    document.querySelectorAll('.nieuwbouw-scenario-chip').forEach((button) => {
        button.addEventListener('click', () => {
            if (button.dataset.land) inputLand.value = button.dataset.land;
            if (button.dataset.construction) inputConstruction.value = button.dataset.construction;
            if (button.dataset.interest) inputInterest.value = button.dataset.interest;
            if (button.dataset.months) inputBuildMonths.value = button.dataset.months;
            if (button.dataset.housing) inputCurrentHousing.value = button.dataset.housing;
            if (button.dataset.discount) inputDiscount.value = button.dataset.discount;
            if (rangeLand) rangeLand.value = inputLand.value;
            if (rangeConstruction) rangeConstruction.value = inputConstruction.value;
            if (rangeInterest) rangeInterest.value = inputInterest.value;
            if (rangeBuildMonths) rangeBuildMonths.value = inputBuildMonths.value;
            volgBouwduur();
            calculate();
        });
    });

    renderTerms();
    setTimeout(calculate, 100);
}

startRekenpagina(initNieuwbouwCalculator);

/**
 * Een Excel-bestand (.xlsx) maken, zonder bibliotheek.
 *
 * Een .xlsx is een zip met een handvol XML-bestanden. Wat de site nodig heeft
 * is klein: één werkblad met tekst, getallen, formules en een paar stijlen.
 * Daarvoor een bibliotheek van honderden kilobytes laden is het niet waard, dus
 * dit bestand schrijft die zip zelf, onverpakt (methode "stored"): dan is er
 * alleen een controlegetal (CRC-32) nodig en geen compressie.
 *
 * Werkt in de browser en in Node: het gebruikt alleen TextEncoder en
 * Uint8Array. De generator maakt er het lege template mee, de pagina het
 * ingevulde bestand.
 *
 * Formules staan in de Engelse schrijfwijze met komma's (SUMIF(A1:A9,"x",B1:B9));
 * zo slaat Excel ze altijd op, ook een Nederlandse Excel.
 */

/** De stijlen die een cel kan hebben; het getal is de index in styles.xml. */
export const STIJL = Object.freeze({ gewoon: 0, vet: 1, euro: 2, euroVet: 3, kop: 4, procent: 5, zacht: 6, titel: 7, invoer: 8 });

const STYLES = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
<numFmts count="1"><numFmt numFmtId="164" formatCode="&quot;€&quot;\\ #,##0"/></numFmts>
<fonts count="4"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/></font><font><i/><sz val="10"/><color rgb="FF5C6A66"/><name val="Calibri"/></font><font><b/><sz val="16"/><color rgb="FF183B35"/><name val="Calibri"/></font></fonts>
<fills count="4"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FFDDE7E0"/></patternFill></fill><fill><patternFill patternType="solid"><fgColor rgb="FFFBF6EC"/></patternFill></fill></fills>
<borders count="2"><border><left/><right/><top/><bottom/><diagonal/></border><border><left/><right/><top/><bottom style="thin"><color rgb="FFDCE2DD"/></bottom><diagonal/></border></borders>
<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
<cellXfs count="9">
<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>
<xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1"/>
<xf numFmtId="164" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/>
<xf numFmtId="164" fontId="1" fillId="0" borderId="0" xfId="0" applyNumberFormat="1" applyFont="1"/>
<xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1"/>
<xf numFmtId="9" fontId="0" fillId="3" borderId="1" xfId="0" applyNumberFormat="1" applyFill="1" applyBorder="1"/>
<xf numFmtId="0" fontId="2" fillId="0" borderId="0" xfId="0" applyFont="1"><alignment wrapText="1" vertical="top"/></xf>
<xf numFmtId="0" fontId="3" fillId="0" borderId="0" xfId="0" applyFont="1"/>
<xf numFmtId="164" fontId="0" fillId="3" borderId="1" xfId="0" applyNumberFormat="1" applyFill="1" applyBorder="1"/>
</cellXfs>
</styleSheet>`;

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
/** Kolomletter bij een index: 0 is A, 25 is Z, 26 is AA. */
export const kolom = (i) => (i >= 26 ? kolom(Math.floor(i / 26) - 1) : '') + String.fromCharCode(65 + (i % 26));

/**
 * Eén cel als XML. Een cel is een tekst, een getal, null (leeg) of een object:
 *   { w: waarde, s: stijl }   tekst of getal met een stijl
 *   { f: 'SUM(D2:D9)', s }    een formule
 */
function celXml(cel, adres) {
    if (cel === null || cel === undefined || cel === '') return '';
    const { w, f, s = 0 } = typeof cel === 'object' ? cel : { w: cel };
    const stijl = s ? ` s="${s}"` : '';
    if (f !== undefined) return `<c r="${adres}"${stijl}><f>${esc(f)}</f></c>`;
    if (w === null || w === undefined || w === '') return s ? `<c r="${adres}"${stijl}/>` : '';
    if (typeof w === 'number' && Number.isFinite(w)) return `<c r="${adres}"${stijl}><v>${w}</v></c>`;
    return `<c r="${adres}"${stijl} t="inlineStr"><is><t xml:space="preserve">${esc(w)}</t></is></c>`;
}

/* ------------------------------ de zip ------------------------------ */

const CRC_TABEL = (() => {
    const t = new Uint32Array(256);
    for (let n = 0; n < 256; n++) {
        let c = n;
        for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1;
        t[n] = c >>> 0;
    }
    return t;
})();

export function crc32(bytes) {
    let c = 0xFFFFFFFF;
    for (let i = 0; i < bytes.length; i++) c = CRC_TABEL[(c ^ bytes[i]) & 0xFF] ^ (c >>> 8);
    return (c ^ 0xFFFFFFFF) >>> 0;
}

/** Een zip van onverpakte bestanden. @param {{naam: string, tekst: string}[]} bestanden */
export function zip(bestanden) {
    const enc = new TextEncoder();
    const delen = [], centraal = [];
    let plek = 0;
    for (const b of bestanden) {
        const naam = enc.encode(b.naam), data = enc.encode(b.tekst), crc = crc32(data);
        const kop = new DataView(new ArrayBuffer(30));
        kop.setUint32(0, 0x04034B50, true); kop.setUint16(4, 20, true); kop.setUint16(6, 0x0800, true);   // namen in UTF-8
        kop.setUint16(8, 0, true); kop.setUint16(10, 0, true); kop.setUint16(12, 0x21, true);              // stored; datum 1-1-1980
        kop.setUint32(14, crc, true); kop.setUint32(18, data.length, true); kop.setUint32(22, data.length, true);
        kop.setUint16(26, naam.length, true); kop.setUint16(28, 0, true);
        delen.push(new Uint8Array(kop.buffer), naam, data);

        const c = new DataView(new ArrayBuffer(46));
        c.setUint32(0, 0x02014B50, true); c.setUint16(4, 20, true); c.setUint16(6, 20, true); c.setUint16(8, 0x0800, true);
        c.setUint16(10, 0, true); c.setUint16(12, 0, true); c.setUint16(14, 0x21, true);
        c.setUint32(16, crc, true); c.setUint32(20, data.length, true); c.setUint32(24, data.length, true);
        c.setUint16(28, naam.length, true); c.setUint32(42, plek, true);
        centraal.push(new Uint8Array(c.buffer), naam);
        plek += 30 + naam.length + data.length;
    }
    const lengteCentraal = centraal.reduce((n, d) => n + d.length, 0);
    const slot = new DataView(new ArrayBuffer(22));
    slot.setUint32(0, 0x06054B50, true); slot.setUint16(8, bestanden.length, true); slot.setUint16(10, bestanden.length, true);
    slot.setUint32(12, lengteCentraal, true); slot.setUint32(16, plek, true);

    const alles = [...delen, ...centraal, new Uint8Array(slot.buffer)];
    const uit = new Uint8Array(alles.reduce((n, d) => n + d.length, 0));
    let i = 0;
    for (const d of alles) { uit.set(d, i); i += d.length; }
    return uit;
}

/* ------------------------------ het werkboek ------------------------------ */

/**
 * @param {object} blad
 * @param {string} blad.naam        de naam van het tabblad, hooguit 31 tekens
 * @param {number[]} blad.breedtes  kolombreedtes, in tekens
 * @param {Array<Array>} blad.rijen de cellen, rij voor rij
 * @param {number} [blad.vast]      zoveel rijen bovenaan blijven staan bij het scrollen
 * @returns {Uint8Array} het .xlsx-bestand
 */
export function maakXlsx({ naam, breedtes, rijen, vast = 0 }) {
    const kolommen = breedtes.map((b, i) => `<col min="${i + 1}" max="${i + 1}" width="${b}" customWidth="1"/>`).join('');
    const data = rijen.map((rij, r) => {
        const cellen = rij.map((cel, k) => celXml(cel, `${kolom(k)}${r + 1}`)).join('');
        return cellen ? `<row r="${r + 1}">${cellen}</row>` : '';
    }).join('');
    const weergave = vast > 0
        ? `<sheetViews><sheetView workbookViewId="0"><pane ySplit="${vast}" topLeftCell="A${vast + 1}" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews>`
        : '';
    const kop = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n';
    return zip([
        { naam: '[Content_Types].xml', tekst: `${kop}<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/></Types>` },
        { naam: '_rels/.rels', tekst: `${kop}<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>` },
        { naam: 'xl/workbook.xml', tekst: `${kop}<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="${esc(naam.slice(0, 31))}" sheetId="1" r:id="rId1"/></sheets><calcPr fullCalcOnLoad="1"/></workbook>` },
        { naam: 'xl/_rels/workbook.xml.rels', tekst: `${kop}<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>` },
        { naam: 'xl/styles.xml', tekst: STYLES },
        { naam: 'xl/worksheets/sheet1.xml', tekst: `${kop}<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">${weergave}<cols>${kolommen}</cols><sheetData>${data}</sheetData></worksheet>` },
    ]);
}

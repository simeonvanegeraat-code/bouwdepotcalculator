/**
 * De doorsnede van een huis naast de vragen van de verbouwroute.
 *
 * Elke categorie uit data/verbouwposten.json heeft een eigen plek in het huis
 * (data-zone, gelijk aan het id van de categorie): wat de bezoeker aanvinkt,
 * licht op en krijgt inrichting. Het huis zelf, met vage contouren van wat er
 * nu staat, is altijd te zien. Puur versiering: de figuur eromheen is
 * aria-hidden. Stijl en beweging staan in src/styles/next/verbouwen.css.
 *
 * Elk onderdeel dat verschijnt heeft een volgnummer (--i): daarmee komen de
 * delen van een kamer na elkaar binnen in plaats van allemaal tegelijk.
 */

// Een onderdeel dat verschijnt als zijn zone aan staat.
const d = (i, klasse, tag, attrs) => `<${tag} class="vb-h-detail${klasse ? ` ${klasse}` : ''}" style="--i:${i}" ${attrs}/>`;

const ZONES = {
  // Tuin: boom, heg, parasol en terras.
  buiten: [
    d(0, 'vb-h-hout', 'rect', 'x="21" y="268" width="7" height="64"'),
    d(1, 'vb-h-groen', 'circle', 'cx="25" cy="248" r="24"'),
    d(2, 'vb-h-groen', 'circle', 'cx="11" cy="262" r="13"'),
    d(2, 'vb-h-groen', 'circle', 'cx="40" cy="264" r="13"'),
    d(3, 'vb-h-groen', 'rect', 'x="2" y="314" width="46" height="18" rx="7"'),
    d(4, 'vb-h-accent', 'rect', 'x="388" y="327" width="50" height="5" rx="1"'),
    d(5, 'vb-h-lijn', 'line', 'x1="414" y1="327" x2="414" y2="288"'),
    d(6, 'vb-h-accent', 'path', 'd="M392 290 q22 -26 44 0 z"'),
  ],
  // Overige kosten: de steiger langs de gevel en de vergunning die eraan hangt.
  overig: [
    d(0, 'vb-h-lijn', 'line', 'x1="94" y1="332" x2="94" y2="158"'),
    d(0, 'vb-h-lijn', 'line', 'x1="106" y1="332" x2="106" y2="158"'),
    d(1, 'vb-h-hout', 'rect', 'x="90" y="238" width="20" height="4"'),
    d(2, 'vb-h-hout', 'rect', 'x="90" y="190" width="20" height="4"'),
    d(3, 'vb-h-lijn', 'line', 'x1="94" y1="332" x2="106" y2="242"'),
    d(3, 'vb-h-lijn', 'line', 'x1="94" y1="238" x2="106" y2="194"'),
    d(4, 'vb-h-wit', 'rect', 'x="92" y="262" width="16" height="20" rx="1.5"'),
    d(5, 'vb-h-lijn', 'line', 'x1="95" y1="268" x2="105" y2="268"'),
    d(5, 'vb-h-lijn', 'line', 'x1="95" y1="273" x2="102" y2="273"'),
  ],
  // Verduurzaming: warmtepomp buiten, isolatie op de zoldervloer, zonnepanelen op het dak.
  verduurzaming: [
    d(0, 'vb-h-wit', 'rect', 'x="56" y="300" width="30" height="32" rx="3"'),
    `<g class="vb-h-detail" style="--i:1"><circle class="vb-h-lijn" cx="71" cy="316" r="9"/><g class="vb-h-draai"><line class="vb-h-lijn" x1="71" y1="308" x2="71" y2="324"/><line class="vb-h-lijn" x1="63" y1="316" x2="79" y2="316"/></g></g>`,
    d(2, 'vb-h-lijn', 'line', 'x1="86" y1="322" x2="110" y2="322"'),
    d(3, 'vb-h-lijn vb-h-lijn--accent', 'polyline', 'points="118,146 126,138 134,146 142,138 150,146 158,138 166,146 174,138 182,146 190,138 198,146 206,138 214,146 222,138 230,146 238,138 246,146 254,138 262,146 270,138 278,146 286,138 294,146 302,138"'),
    `<g transform="translate(210 64) rotate(36.1)">${d(4, 'vb-h-accent', 'rect', 'x="60" y="-11" width="40" height="7" rx="1"')}${d(5, 'vb-h-accent', 'rect', 'x="104" y="-11" width="40" height="7" rx="1"')}${d(6, 'vb-h-lijn', 'line', 'x1="80" y1="-11" x2="80" y2="-4"')}${d(6, 'vb-h-lijn', 'line', 'x1="124" y1="-11" x2="124" y2="-4"')}</g>`,
  ],
  // Afbouw: woonkamer beneden, slaapkamer boven.
  afbouw: [
    `<rect class="vb-h-kamer" x="112" y="242" width="96" height="90"/><rect class="vb-h-kamer" x="112" y="152" width="96" height="88"/>`,
    d(0, 'vb-h-accent', 'rect', 'x="112" y="324" width="96" height="8"'),
    d(0, 'vb-h-accent', 'rect', 'x="112" y="234" width="96" height="6"'),
    d(1, 'vb-h-licht', 'rect', 'x="120" y="290" width="60" height="16" rx="6"'),
    d(2, '', 'rect', 'x="118" y="302" width="64" height="20" rx="6"'),
    d(3, 'vb-h-wit', 'rect', 'x="128" y="256" width="28" height="20" rx="1"'),
    d(3, 'vb-h-accent', 'circle', 'cx="142" cy="266" r="5"'),
    d(4, 'vb-h-lijn', 'line', 'x1="194" y1="322" x2="194" y2="274"'),
    d(5, 'vb-h-accent', 'polygon', 'points="185,276 203,276 199,262 189,262"'),
    d(1, '', 'rect', 'x="118" y="214" width="70" height="18" rx="3"'),
    d(2, 'vb-h-wit', 'rect', 'x="122" y="206" width="20" height="11" rx="3"'),
    d(3, 'vb-h-groen', 'rect', 'x="146" y="210" width="42" height="10" rx="2"'),
    d(4, 'vb-h-wit', 'rect', 'x="126" y="164" width="36" height="30"'),
    d(5, 'vb-h-lijn', 'line', 'x1="144" y1="164" x2="144" y2="194"'),
    d(5, 'vb-h-accent', 'rect', 'x="122" y="160" width="8" height="38" rx="2"'),
    d(5, 'vb-h-accent', 'rect', 'x="158" y="160" width="8" height="38" rx="2"'),
    d(6, 'vb-h-lijn', 'line', 'x1="192" y1="152" x2="192" y2="166"'),
    d(6, 'vb-h-accent', 'circle', 'cx="192" cy="171" r="5"'),
  ],
  // Keuken beneden, badkamer boven.
  'keuken-badkamer': [
    `<rect class="vb-h-kamer" x="212" y="242" width="96" height="90"/><rect class="vb-h-kamer vb-h-kamer--tegels" x="212" y="152" width="96" height="88"/>`,
    d(0, '', 'rect', 'x="220" y="300" width="82" height="32"'),
    d(1, 'vb-h-accent', 'rect', 'x="218" y="294" width="86" height="7" rx="1"'),
    d(2, 'vb-h-lijn vb-h-lijn--licht', 'line', 'x1="247" y1="304" x2="247" y2="330"'),
    d(2, 'vb-h-lijn vb-h-lijn--licht', 'line', 'x1="274" y1="304" x2="274" y2="330"'),
    d(3, 'vb-h-licht', 'rect', 'x="220" y="252" width="50" height="20" rx="1"'),
    d(4, 'vb-h-donker', 'polygon', 'points="276,252 302,252 297,268 281,268"'),
    d(5, 'vb-h-lijn', 'path', 'd="M258 294 v-10 q0 -5 6 -5"'),
    d(0, 'vb-h-wit', 'path', 'd="M220 206 h74 v8 a14 14 0 0 1 -14 14 h-46 a14 14 0 0 1 -14 -14 z"'),
    d(1, 'vb-h-lijn', 'path', 'd="M298 206 v-40 h-12"'),
    d(2, 'vb-h-accent', 'rect', 'x="278" y="164" width="12" height="5" rx="2"'),
    `<g class="vb-h-detail vb-h-druppels" style="--i:3"><line class="vb-h-lijn vb-h-lijn--water" x1="281" y1="174" x2="281" y2="200"/><line class="vb-h-lijn vb-h-lijn--water" x1="287" y1="174" x2="287" y2="200"/></g>`,
    d(3, 'vb-h-wit', 'rect', 'x="224" y="162" width="22" height="28" rx="11"'),
    d(4, 'vb-h-accent', 'rect', 'x="222" y="194" width="26" height="6" rx="2"'),
  ],
  // Ruwbouw: de uitbouw achter en de dakkapel.
  ruwbouw: [
    `<rect class="vb-h-kamer vb-h-nieuw" x="312" y="262" width="74" height="70"/>`,
    d(0, 'vb-h-donker', 'rect', 'x="306" y="254" width="86" height="9" rx="1"'),
    d(1, 'vb-h-wit', 'rect', 'x="326" y="280" width="46" height="52"'),
    d(2, 'vb-h-lijn', 'line', 'x1="349" y1="280" x2="349" y2="332"'),
    d(3, 'vb-h-accent', 'rect', 'x="340" y="250" width="22" height="5" rx="1"'),
    `<rect class="vb-h-kamer vb-h-nieuw" x="138" y="104" width="46" height="38"/>`,
    d(1, 'vb-h-donker', 'rect', 'x="133" y="98" width="56" height="7" rx="1"'),
    d(2, 'vb-h-wit', 'rect', 'x="146" y="112" width="30" height="22"'),
    d(3, 'vb-h-lijn', 'line', 'x1="161" y1="112" x2="161" y2="134"'),
  ],
};

/** @param {string[]} categorieen  de ids uit data/verbouwposten.json, in volgorde */
export function huisSvg(categorieen) {
  const zones = categorieen.map((id, z) => `                    <g class="vb-zone" data-zone="${id}" style="--z:${z}">${(ZONES[id] ?? []).join('')}</g>`).join('\n');
  return `<svg viewBox="-4 30 448 330" focusable="false">
                    <circle class="vb-h-zon" cx="384" cy="74" r="20"/>
                    <rect class="vb-h-gras" x="-4" y="332" width="448" height="18" rx="9"/>
                    <!-- wat er nu staat, vaag: zo is het huis niet leeg voor je iets aanvinkt -->
                    <g class="vb-h-basis">
                        <rect x="118" y="302" width="64" height="20" rx="6"/><rect x="118" y="214" width="70" height="18" rx="3"/>
                        <rect x="220" y="300" width="82" height="32"/><path d="M220 206 h74 v8 a14 14 0 0 1 -14 14 h-46 a14 14 0 0 1 -14 -14 z"/>
                    </g>
                    <!-- de schoorsteen rookt een beetje -->
                    <polygon class="vb-h-schoorsteen" points="226,54 240,54 240,88 226,78"/>
                    <circle class="vb-h-rook" cx="233" cy="46" r="5" style="--r:0"/><circle class="vb-h-rook" cx="233" cy="46" r="5" style="--r:1"/><circle class="vb-h-rook" cx="233" cy="46" r="5" style="--r:2"/>
${zones}
                    <!-- het huis zelf: altijd te zien, bovenop de kamers -->
                    <rect class="vb-h-muur" x="110" y="150" width="200" height="182"/>
                    <line class="vb-h-muur" x1="110" y1="240" x2="310" y2="240"/>
                    <line class="vb-h-muur vb-h-muur--dun" x1="210" y1="150" x2="210" y2="332"/>
                    <polygon class="vb-h-dak" points="90,150 210,62 330,150 318,150 210,76 102,150"/>
                    <circle class="vb-h-wit" cx="210" cy="118" r="9"/>
                    <line class="vb-h-muur" x1="-4" y1="332" x2="444" y2="332"/>
                </svg>`;
}

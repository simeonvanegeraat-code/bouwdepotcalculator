/**
 * De knop waarmee de bezoeker wist wat deze site op zijn apparaat bewaart.
 *
 * privacy.html belooft dat die opslag "op uw apparaat blijft en dat u hem zelf
 * kunt wissen". Tot 1 september 2026 betekende dat: zoek het op in uw
 * browserinstellingen. Dat is een instructie die je aan een lezer van een
 * privacyverklaring niet wilt geven; de knop staat nu naast de zin.
 *
 * WAAROM localStorage.clear() EN GEEN LIJST SLEUTELS
 * De site bewaart onder zeven sleutels: gedeelde invoer, bankkeuze,
 * verbouwbegroting, depotplanner, leenruimte en twee checklists. Een handmatige
 * lijst zou verouderen -- de depotplanner staat al op v3 -- en één vergeten
 * sleutel maakt van deze knop een loze belofte. `clear()` raakt alleen wat deze
 * site zelf heeft weggeschreven; van andere sites blijft alles staan.
 *
 * WAAROM TWEE KLIKKEN
 * Wie op de verbouwbegroting dertig posten heeft ingevuld, is die met één
 * misklik kwijt. De bevestiging staat in de knop zelf en niet in een
 * browserdialoog, zodat de tekst in het Nederlands is en bij de pagina past.
 */

const houder = document.querySelector('[data-wis-opslag]');

if (houder) {
    const knop = houder.querySelector('button');
    const bericht = houder.querySelector('[data-wis-bericht]');
    let bevestigd = false;

    /** Of de browser opslag toestaat. In privémodus gooit al het aanraken. */
    const opslagWerkt = () => {
        try {
            const test = 'bdc:test';
            window.localStorage.setItem(test, '1');
            window.localStorage.removeItem(test);
            return true;
        } catch (_) {
            return false;
        }
    };

    const meld = (tekst) => { bericht.textContent = tekst; };

    const herstel = () => {
        bevestigd = false;
        knop.textContent = 'Opgeslagen gegevens wissen';
        knop.classList.remove('bs-knop--waarschuwing');
    };

    if (!opslagWerkt()) {
        knop.disabled = true;
        meld('Uw browser staat lokale opslag niet toe, bijvoorbeeld in een privévenster. Er is dan ook niets van deze site op dit apparaat bewaard.');
    } else {
        knop.addEventListener('click', () => {
            if (!bevestigd) {
                bevestigd = true;
                knop.textContent = 'Ja, definitief wissen';
                knop.classList.add('bs-knop--waarschuwing');
                meld('Hiermee verdwijnen uw ingevulde bedragen, uw bankkeuze en de punten die u hebt afgevinkt. Dit kan niet ongedaan worden gemaakt.');
                return;
            }

            let aantal = 0;
            try {
                aantal = window.localStorage.length;
                window.localStorage.clear();
            } catch (_) {
                meld('Het wissen lukte niet. Wist u de opslag van deze site via uw browserinstellingen.');
                herstel();
                return;
            }

            herstel();
            meld(aantal === 0
                ? 'Er stond niets van deze site op dit apparaat.'
                : `Gewist. ${aantal === 1 ? 'Eén bewaard gegeven' : `${aantal} bewaarde gegevens`} van deze site verwijderd; de rekenpagina's beginnen weer leeg.`);
        });
    }
}
